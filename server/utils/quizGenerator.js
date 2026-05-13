import Tesseract from "tesseract.js";
import sharp from "sharp";
import fs from "fs";
import path from "path";

/**
 * Enhanced OCR extraction from images with confidence scoring
 */
export const extractTextFromImage = async (imagePath) => {
  try {
    if (!fs.existsSync(imagePath)) {
      return { text: "", confidence: 0, error: "File not found" };
    }

    const worker = await Tesseract.createWorker();
    const result = await worker.recognize(imagePath);
    await worker.terminate();

    return {
      text: result.data.text || "",
      confidence: result.data.confidence || 0,
      lines: (result.data.lines || []).map((line) => ({
        text: line.text,
        confidence: line.confidence,
      })),
    };
  } catch (error) {
    console.error("OCR Error:", error.message);
    return { text: "", confidence: 0, error: error.message };
  }
};

/**
 * Extract text from images with language support
 */
export const extractTextFromImageWithLanguage = async (imagePath, languages = ["eng", "urd"]) => {
  try {
    if (!fs.existsSync(imagePath)) {
      return { text: "", confidence: 0, error: "File not found" };
    }

    const languageList = Array.isArray(languages) ? languages.join("+") : String(languages || "eng");
    const worker = await Tesseract.createWorker(languageList);

    const result = await worker.recognize(imagePath);
    await worker.terminate();

    return {
      text: result.data.text || "",
      confidence: result.data.confidence || 0,
      psm: result.data.psm,
      languages,
      lines: (result.data.lines || []).map((line) => ({
        text: line.text,
        confidence: line.confidence,
      })),
    };
  } catch (error) {
    console.error("Multi-language OCR Error:", error.message);
    if (Array.isArray(languages) && languages.length > 1) {
      return extractTextFromImage(imagePath);
    }
    return { text: "", confidence: 0, error: error.message };
  }
};

const splitSourceSentences = (text) => {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  const sentences = normalized
    .split(/(?<=[.!?])\s+|[\n\r]+|(?:\s[-*]\s)/)
    .map((sentence) => sentence.trim().replace(/^[\d.)\-\s]+/, ""))
    .filter((sentence) => sentence.length >= 12 && sentence.length <= 180);

  if (sentences.length >= 3) return sentences;

  const words = normalized.split(" ").filter(Boolean);
  const chunked = [];
  for (let index = 0; index < words.length; index += 12) {
    const chunk = words.slice(index, index + 18).join(" ").trim();
    if (chunk.length >= 12) chunked.push(chunk);
  }

  return [...sentences, ...chunked]
    .filter((sentence, idx, arr) => arr.indexOf(sentence) === idx)
    .slice(0, 80);
};

const extractKeywordPhrases = (text, subject = "General") => {
  const stopWords = new Set([
    "about",
    "after",
    "also",
    "because",
    "between",
    "could",
    "every",
    "from",
    "have",
    "into",
    "more",
    "most",
    "only",
    "other",
    "should",
    "such",
    "than",
    "that",
    "their",
    "there",
    "these",
    "this",
    "through",
    "used",
    "were",
    "when",
    "where",
    "which",
    "while",
    "with",
    "would",
  ]);

  const phrases = new Map();
  const source = `${subject} ${text}`;
  const phraseMatches = source.match(/\b[A-Z][A-Za-z0-9-]*(?:\s+[A-Z][A-Za-z0-9-]*){0,3}\b/g) || [];
  phraseMatches.forEach((phrase) => {
    const cleaned = phrase.trim();
    if (cleaned.length > 3) phrases.set(cleaned.toLowerCase(), cleaned);
  });

  const words = source.match(/\b[A-Za-z][A-Za-z0-9-]{4,}\b/g) || [];
  words.forEach((word) => {
    const cleaned = word.trim();
    if (!stopWords.has(cleaned.toLowerCase())) {
      phrases.set(cleaned.toLowerCase(), cleaned);
    }
  });

  return [...phrases.values()].slice(0, 80);
};

const sentenceCase = (value) => {
  const text = String(value || "").trim();
  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : "";
};

const cleanExamText = (value, maxWords = 7, maxChars = 54) => {
  const withoutLabels = String(value || "")
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/\([^)]{35,}\)/g, " ")
    .replace(/^[A-D][.)]\s*/i, "")
    .replace(/^[\d.)\-\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
  const compact = withoutLabels
    .split(/\s+/)
    .filter((word) => word.length <= 28)
    .slice(0, maxWords)
    .join(" ")
    .replace(/[,:;.\s]+$/, "")
    .trim();

  return sentenceCase(compact.length > maxChars ? compact.slice(0, maxChars).replace(/\s+\S*$/, "") : compact);
};

const isBadExamText = (value) => {
  const text = String(value || "").trim();
  const words = text.split(/\s+/).filter(Boolean);
  return (
    !text ||
    text.length > 90 ||
    words.length > 14 ||
    /according to|uploaded|material|statement best explains|source-based|provided content/i.test(text)
  );
};

const normalizeQuestion = (question) => {
  const text = cleanExamText(question, 14, 88).replace(/\?+$/, "");
  return text ? `${text}?` : "";
};

const normalizeOption = (option) => cleanExamText(option, 5, 42);

const shuffleBySeed = (items, seed = 0) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = (seed + i * 7) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const buildDistractors = (correctAnswer, pool, count = 3) => {
  const correct = normalizeOption(correctAnswer);
  const normalizedPool = pool
    .map((item) => normalizeOption(item))
    .filter((item) => item && item.toLowerCase() !== correct.toLowerCase())
    .filter((item, idx, arr) => arr.findIndex((candidate) => candidate.toLowerCase() === item.toLowerCase()) === idx);

  const generic = [
    "India",
    "China",
    "Australia",
    "Canada",
    "Nile",
    "Amazon",
    "Karachi",
    "Islamabad",
    "Lahore",
    "1956",
    "1947",
    "1962",
    "CPU",
    "RAM",
    "HTTP",
    "Democracy",
  ].filter((item) => item.toLowerCase() !== correct.toLowerCase());

  return [...normalizedPool, ...generic]
    .filter((item, idx, arr) => arr.findIndex((candidate) => candidate.toLowerCase() === item.toLowerCase()) === idx)
    .slice(0, count);
};

const dedupeFacts = (facts) =>
  facts.filter(
    (fact, idx, arr) =>
      arr.findIndex(
        (item) =>
          item.questionText.toLowerCase() === fact.questionText.toLowerCase() &&
          item.correctAnswer.toLowerCase() === fact.correctAnswer.toLowerCase()
      ) === idx
  );

const addFact = (facts, seen, questionText, correctAnswer, topic, sourceType = "fact") => {
  const question = normalizeQuestion(questionText);
  const answer = normalizeOption(correctAnswer);
  if (!question || !answer || isBadExamText(question) || answer.length < 2) return;

  const key = `${question.toLowerCase()}::${answer.toLowerCase()}`;
  if (seen.has(key)) return;
  seen.add(key);
  facts.push({ questionText: question, correctAnswer: answer, topic: cleanExamText(topic || answer, 5, 42), sourceType });
};

const extractExamFacts = (text, subject = "General") => {
  const facts = [];
  const seen = new Set();
  const sentences = splitSourceSentences(text);
  const lines = String(text || "")
    .split(/\n|(?<=\.)\s+/)
    .map((line) => line.trim())
    .filter(Boolean);

  [...lines, ...sentences].forEach((line) => {
    const cleanLine = line.replace(/\s+/g, " ").trim();
    if (!cleanLine || cleanLine.length > 190) return;

    const capital = cleanLine.match(/capital of ([A-Za-z\s-]{3,40})\s+(?:is|:|-)\s+([A-Za-z\s-]{3,35})/i);
    if (capital) {
      addFact(facts, seen, `Capital of ${capital[1]}?`, capital[2], "Capital", "capital");
    }

    const namedFact = cleanLine.match(/^([A-Za-z][A-Za-z\s/-]{3,48})\s*(?:-|:|=)\s*([A-Za-z0-9][A-Za-z0-9\s/-]{1,48})$/);
    if (namedFact) {
      const label = cleanExamText(namedFact[1], 7, 54);
      const answer = cleanExamText(namedFact[2], 5, 42);
      const lowerLabel = label.toLowerCase();
      if (/capital/.test(lowerLabel)) addFact(facts, seen, `${label}?`, answer, label, "pair");
      else if (/first|largest|longest|highest|deepest|oldest|founder|president|prime minister|river|mountain|city|country/.test(lowerLabel)) {
        addFact(facts, seen, `Which is the ${label}?`, answer, label, "pair");
      } else {
        addFact(facts, seen, `What is ${label}?`, answer, label, "pair");
      }
    }

    [
      { regex: /\blongest\s+river\s+([A-Za-z-]{3,30})/i, question: "Which is the longest river?", topic: "Longest river" },
      { regex: /\blargest\s*(?:\([^)]*\))?\s+([A-Za-z-]{3,30})/i, question: "Which river has largest volume?", topic: "Largest river" },
      { regex: /\bdeepest\s+river\s+([A-Za-z-]{3,30})/i, question: "Which is the deepest river?", topic: "Deepest river" },
      { regex: /\bhighest\s+mountain\s+([A-Za-z-]{3,30})/i, question: "Which is the highest mountain?", topic: "Highest mountain" },
    ].forEach((pattern) => {
      const match = cleanLine.match(pattern.regex);
      if (match) addFact(facts, seen, pattern.question, match[1], pattern.topic, "direct");
    });

    const superlative = cleanLine.match(/\b(first|largest|longest|highest|deepest|oldest|smallest)\s+([A-Za-z\s-]{3,45})\s+(?:is|was|:|-)\s*([A-Z][A-Za-z0-9\s-]{2,42})/i);
    if (superlative) {
      const topic = `${superlative[1]} ${superlative[2]}`;
      addFact(facts, seen, `Which is the ${topic}?`, superlative[3], topic, "superlative");
    }

    const definition = cleanLine.match(/^([A-Z][A-Za-z0-9\s/-]{2,45})\s+(?:is|means|refers to|stands for)\s+(.{4,90})$/i);
    if (definition && !/^capital of\b/i.test(definition[1])) {
      addFact(facts, seen, `What is ${definition[1]}?`, definition[2], definition[1], "definition");
    }

    const firstPerson = cleanLine.match(/^([A-Z][A-Za-z\s.-]{3,45})\s+was\s+(?:the\s+)?first\s+([A-Za-z\s-]{3,55})/);
    if (firstPerson) {
      addFact(facts, seen, `Who was the first ${firstPerson[2]}?`, firstPerson[1], firstPerson[2], "person");
    }

    const dateFact = cleanLine.match(/\b([A-Z][A-Za-z\s-]{3,45})\s+(?:was|were|is|formed|founded|established|created)\s+(?:in|on)\s+(\d{4}|[A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/);
    if (dateFact) {
      addFact(facts, seen, `When was ${dateFact[1]} founded?`, dateFact[2], dateFact[1], "date");
    }
  });

  if (facts.length >= 3) return facts.slice(0, 80);

  const keywords = extractKeywordPhrases(text, subject);
  keywords.slice(0, 30).forEach((keyword, index) => {
    const answer = keywords[(index + 1) % keywords.length] || keyword;
    addFact(facts, seen, `Which term is linked with ${keyword}?`, answer, keyword, "keyword");
  });

  return facts.slice(0, 80);
};

/**
 * Process PDF and extract rich text with structure
 */
export const processPdfAdvanced = async (pdfParser, dataBuffer) => {
  try {
    if (typeof pdfParser === "function" && /^class\s/.test(Function.prototype.toString.call(pdfParser))) {
      const parser = new pdfParser({ data: dataBuffer });
      try {
        const textResult = await parser.getText();
        const infoResult = await parser.getInfo({ parsePageInfo: true }).catch(() => ({}));
        const text = textResult?.text || "";

        return {
          text,
          pages: textResult?.total || infoResult?.total || infoResult?.pages?.length || 0,
          metadata: infoResult?.info || infoResult?.metadata || {},
          lines: text.split("\n").filter((line) => line.trim()),
          version: infoResult?.version,
          rawText: text,
        };
      } finally {
        await parser.destroy?.();
      }
    }

    const data = await pdfParser(dataBuffer);

    return {
      text: data.text || "",
      pages: data.numpages || 0,
      metadata: data.info || {},
      lines: (data.text || "").split("\n").filter((line) => line.trim()),
      version: data.version,
      rawText: data.text,
    };
  } catch (error) {
    console.error("PDF Processing Error:", error.message);
    return { text: "", pages: 0, error: error.message };
  }
};

/**
 * Optimize and normalize extracted text for AI processing
 */
export const normalizeExtractedText = (rawText) => {
  if (!rawText) return "";

  let text = String(rawText || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[\n\r]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n");

  // Remove OCR artifacts
  text = text.replace(/[\u0080-\u009F]/g, "");

  // Clean up broken words
  text = text.replace(/(\w+)-\n(\w+)/g, "$1$2");

  return text.trim();
};

/**
 * Extract key concepts from text using AI-friendly chunking
 */
export const extractConceptsFromText = (text) => {
  const lines = text.split("\n").filter((line) => line.trim().length > 5);

  const concepts = [];
  const headingPattern = /^(#{1,6}|\*{1,3}|_{1,3}|[A-Z]{2,}[:\.]?)\s+(.+)$/gm;

  let match;
  while ((match = headingPattern.exec(text)) !== null) {
    concepts.push({
      heading: match[2],
      type: "section",
    });
  }

  // Extract bullet points and numbered lists
  const listPattern = /^[\s]*[-•*]\s+(.+)$/gm;
  while ((match = listPattern.exec(text)) !== null) {
    concepts.push({
      item: match[1],
      type: "bullet",
    });
  }

  // Extract key definitions (common academic patterns)
  const defPattern = /(.+?)\s*(?:is|means|refers to|denotes|=)\s*(.+?)(?:\.|$)/gi;
  while ((match = defPattern.exec(text)) !== null) {
    concepts.push({
      term: match[1].trim(),
      definition: match[2].trim(),
      type: "definition",
    });
  }

  return {
    concepts: concepts.slice(0, 50),
    totalLines: lines.length,
    conceptCount: concepts.length,
  };
};

/**
 * Smart text chunking for AI processing
 */
export const chunkTextForAI = (text, maxChunkSize = 3000) => {
  const chunks = [];
  let currentChunk = "";

  const paragraphs = text.split("\n\n");

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

/**
 * Validate and clean MCQ options
 */
export const validateMCQOptions = (options) => {
  if (!Array.isArray(options)) return [];

  return options
    .map((opt) => String(opt || "").trim())
    .filter((opt) => opt.length > 2)
    .filter((opt, idx, arr) => arr.indexOf(opt) === idx) // Remove duplicates
    .slice(0, 5);
};

/**
 * Parse AI response to extract MCQs
 */
export const parseAIMCQResponse = (rawResponse) => {
  try {
    const trimmed = String(rawResponse || "").trim();
    const jsonMatch = trimmed.match(/\{[\s\S]*\}|\[[\s\S]*\]/);

    if (!jsonMatch) return null;

    const parsedRaw = JSON.parse(jsonMatch[0]);
    const parsed = Array.isArray(parsedRaw) ? { questions: parsedRaw } : parsedRaw;

    if (!parsed.questions || !Array.isArray(parsed.questions)) return null;

    // Validate each question
    const normalizedQuestions = parsed.questions.map((q) => ({
      ...q,
      questionText: q.questionText || q.question || q.prompt || "",
      correctAnswer: q.correctAnswer || q.answer || q.correct_option || "",
      options: Array.isArray(q.options) ? q.options : [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean),
    }));

    const validQuestions = normalizedQuestions.filter((q) => {
      return (
        q.questionText &&
        q.options &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        q.correctAnswer
      );
    });

    return {
      ...parsed,
      questions: validQuestions,
      validCount: validQuestions.length,
      originalCount: normalizedQuestions.length,
    };
  } catch (error) {
    console.error("MCQ Parse Error:", error.message);
    return null;
  }
};

export const sanitizeCompetitiveMCQ = (question, difficulty = "medium", subject = "General", pool = []) => {
  if (!question) return null;

  const questionText = normalizeQuestion(question.questionText);
  const correctAnswer = normalizeOption(question.correctAnswer);
  const rawOptions = Array.isArray(question.options) ? question.options : [];
  const options = rawOptions
    .map(normalizeOption)
    .filter(Boolean)
    .filter((option, idx, arr) => arr.findIndex((item) => item.toLowerCase() === option.toLowerCase()) === idx);

  if (!questionText || !correctAnswer || isBadExamText(questionText)) return null;

  const answerExists = options.some((option) => option.toLowerCase() === correctAnswer.toLowerCase());
  const distractors = buildDistractors(correctAnswer, [...options, ...pool], 3);
  const finalOptions = [answerExists ? options.find((option) => option.toLowerCase() === correctAnswer.toLowerCase()) : correctAnswer, ...distractors]
    .filter(Boolean)
    .filter((option, idx, arr) => arr.findIndex((item) => item.toLowerCase() === option.toLowerCase()) === idx)
    .slice(0, 4);

  if (finalOptions.length !== 4) return null;

  const finalAnswer =
    finalOptions.find((option) => option.toLowerCase() === correctAnswer.toLowerCase()) || finalOptions[0];

  return {
    questionText,
    options: finalOptions,
    correctAnswer: finalAnswer,
    explanation:
      cleanExamText(question.explanation, 18, 140) ||
      `${finalAnswer} is the correct answer based on the uploaded study material.`,
    difficultyTag: question.difficultyTag || difficulty,
    topic: cleanExamText(question.topic || subject, 5, 42) || subject || "General",
    conceptsInvolved: Array.isArray(question.conceptsInvolved)
      ? question.conceptsInvolved.map((item) => cleanExamText(item, 4, 32)).filter(Boolean).slice(0, 4)
      : [cleanExamText(question.topic || subject, 4, 32) || "General"],
  };
};

/**
 * Generate fallback competitive-exam MCQs from extracted facts.
 */
export const generateFallbackMCQs = (text, count = 5, difficulty = "medium", subject = "General") => {
  const seed = Math.max(1, String(text || subject).length);
  const facts = dedupeFacts(extractExamFacts(text, subject));
  const keywords = extractKeywordPhrases(text, subject);
  let keywordIndex = 0;
  while (facts.length < count * 2 && keywordIndex < keywords.length) {
    const keyword = keywords[keywordIndex];
    const answer = keywords.find((item, idx) => idx !== keywordIndex && item.toLowerCase() !== keyword.toLowerCase());
    if (answer) {
      facts.push({
        questionText: `Which term is linked with ${keyword}?`,
        correctAnswer: normalizeOption(answer),
        topic: normalizeOption(keyword),
        sourceType: "keyword",
      });
    }
    keywordIndex += 1;
  }

  const answerPool = facts.map((fact) => fact.correctAnswer);
  const orderedFacts = facts;
  const questions = [];

  for (let i = 0; i < orderedFacts.length && questions.length < count; i += 1) {
    const fact = orderedFacts[i];
    const distractors = buildDistractors(fact.correctAnswer, answerPool, 3);
    const options = shuffleBySeed([fact.correctAnswer, ...distractors].slice(0, 4), seed + i);

    const sanitized = sanitizeCompetitiveMCQ(
      {
        questionText: fact.questionText,
        options,
        correctAnswer: fact.correctAnswer,
        explanation: `${fact.correctAnswer} is the correct answer for ${fact.topic || subject}.`,
        difficultyTag: difficulty,
        topic: fact.topic || subject,
        conceptsInvolved: [fact.topic || subject],
      },
      difficulty,
      subject,
      answerPool
    );

    if (
      sanitized &&
      !questions.some((item) => item.questionText.toLowerCase() === sanitized.questionText.toLowerCase())
    ) {
      questions.push(sanitized);
    }
  }

  return questions;
};

/**
 * Build AI prompt with enhanced instructions
 */
export const buildEnhancedQuizPrompt = (
  extractedText,
  count = 6,
  difficulty = "medium",
  subject = "General",
  language = "english"
) => {
  const languageInstruction =
    language === "urdu"
      ? "Generate questions in both Urdu and English. Provide bilingual options for better understanding."
      : "Generate questions in English with clear, professional language.";

  const difficultyGuide = {
    easy: "Focus on basic definitions, direct facts, and straightforward comprehension. All students should understand.",
    medium:
      "Include conceptual understanding, application, and analysis. Require integration of ideas. Mix direct recall with applied thinking.",
    hard: "Focus on synthesis, evaluation, critical analysis, and complex reasoning. Include multi-step problem solving and comparison of concepts.",
    mixed:
      "Balance easy, medium, and hard questions. Include direct recall, conceptual, analytical, application-based, and tricky competitive-exam patterns.",
  };

  const prompt = `You are an expert PPSC/FPSC/entry-test MCQ generator. Generate EXACTLY ${count} concise competitive-exam questions from the provided educational content.

CRITICAL REQUIREMENTS:
1. Create short one-line MCQs like PPSC/FPSC past papers.
2. Do NOT copy full PDF lines. Extract facts, dates, terms, definitions, people, places, abbreviations, and concepts.
3. Question length target: 3-12 words. Never mention uploaded material, source, passage, paragraph, or document.
4. Each question MUST have exactly 4 short options. Option target: 1-5 words.
5. Create realistic distractors from related facts in the content.
6. Exactly one option must be correct and correctAnswer must exactly match one option.
7. Prefer direct forms such as "Capital of Australia?", "Who was the first Prime Minister of Pakistan?", "Which is the longest river?"
8. ${languageInstruction}

DIFFICULTY LEVEL: ${difficulty.toUpperCase()}
${difficultyGuide[difficulty] || difficultyGuide.medium}

SUBJECT: ${subject}

OUTPUT FORMAT (JSON only, no additional text):
{
  "title": "Quiz on ${subject}",
  "subject": "${subject}",
  "category": "${subject}",
  "difficulty": "${difficulty}",
  "language": "${language}",
  "questions": [
    {
      "questionText": "Short exam-style question?",
      "options": [
        "Short option",
        "Short option",
        "Short option",
        "Short option"
      ],
      "correctAnswer": "Exact text of the correct option from above",
      "explanation": "One short reason for the answer",
      "difficultyTag": "${difficulty}",
      "topic": "Specific topic from ${subject}",
      "conceptsInvolved": ["concept1", "concept2"]
    }
  ]
}

EDUCATIONAL CONTENT:
${extractedText}

VALIDATION CHECKLIST:
- Every question is concise, readable, and conceptually unique
- Every question has exactly 4 short options
- No placeholder text is used
- All questions relate to the provided content
- Difficulty matches the requested level
`;

  return prompt;
};

/**
 * Enhance AI response with metadata and validation
 */
export const enhanceQuizMetadata = (quiz, sourceInfo = {}) => {
  if (!quiz || !quiz.questions) return quiz;

  return {
    ...quiz,
    metadata: {
      generatedAt: new Date().toISOString(),
      source: sourceInfo.sourceType || "unknown",
      sourceFile: sourceInfo.sourceFile || null,
      textLength: sourceInfo.textLength || 0,
      extractionConfidence: sourceInfo.confidence || 0,
      questionsGenerated: quiz.questions.length,
      validQuestions: quiz.questions.filter((q) => q.questionText && q.correctAnswer).length,
      questionsRequiringReview: quiz.questions.filter((q) => !q.explanation).length,
    },
    questions: quiz.questions.map((q, idx) => ({
      ...q,
      id: `q_${idx + 1}`,
      order: idx + 1,
      hasExplanation: Boolean(q.explanation),
      optionsCount: Array.isArray(q.options) ? q.options.length : 0,
      isValid: Boolean(q.questionText && q.correctAnswer && Array.isArray(q.options)),
    })),
  };
};

export default {
  extractTextFromImage,
  extractTextFromImageWithLanguage,
  processPdfAdvanced,
  normalizeExtractedText,
  extractConceptsFromText,
  chunkTextForAI,
  validateMCQOptions,
  parseAIMCQResponse,
  sanitizeCompetitiveMCQ,
  generateFallbackMCQs,
  buildEnhancedQuizPrompt,
  enhanceQuizMetadata,
};
