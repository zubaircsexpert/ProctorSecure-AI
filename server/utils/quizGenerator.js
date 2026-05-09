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
      .filter((sentence) => sentence.length >= 45 && sentence.length <= 260);

    if (sentences.length >= 3) return sentences;

    const words = normalized.split(" ").filter(Boolean);
    const chunked = [];
    for (let index = 0; index < words.length; index += 24) {
      const chunk = words.slice(index, index + 32).join(" ").trim();
      if (chunk.length >= 45) chunked.push(chunk);
    }

    return [...sentences, ...chunked]
      .filter((sentence, idx, arr) => arr.indexOf(sentence) === idx)
      .slice(0, 30);
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

const shortenOption = (sentence) => {
  const cleaned = String(sentence || "").trim().replace(/\s+/g, " ");
  return cleaned.length > 145 ? `${cleaned.slice(0, 142).trim()}...` : cleaned;
};

const buildQuestionFromSentence = (sentence, keyword, idx, difficulty, subject) => {
  const questionTemplates = [
    `According to the uploaded ${subject} material, which statement best explains ${keyword}?`,
    `Which source-based statement is most directly connected with ${keyword}?`,
    `What does the provided content indicate about ${keyword}?`,
    `In the study material, which option correctly describes the idea around ${keyword}?`,
  ];

  return {
    questionText: questionTemplates[idx % questionTemplates.length],
    correctAnswer: shortenOption(sentence),
    explanation: `The correct option is taken from the uploaded content and directly supports the question about ${keyword}.`,
    difficultyTag: difficulty,
    topic: keyword || subject || "General",
    conceptsInvolved: [keyword || subject || "General"],
  };
};

/**
 * Process PDF and extract rich text with structure
 */
export const processPdfAdvanced = async (pdfParse, dataBuffer) => {
  try {
    const data = await pdfParse(dataBuffer);

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
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);

    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.questions || !Array.isArray(parsed.questions)) return null;

    // Validate each question
    const validQuestions = parsed.questions.filter((q) => {
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
      originalCount: parsed.questions.length,
    };
  } catch (error) {
    console.error("MCQ Parse Error:", error.message);
    return null;
  }
};

/**
 * Generate fallback high-quality MCQs from text
 */
export const generateFallbackMCQs = (text, count = 5, difficulty = "medium", subject = "General") => {
  const sentences = splitSourceSentences(text);
  const keywords = extractKeywordPhrases(text, subject);
  const sourceOptions = sentences.map(shortenOption).filter((option, idx, arr) => arr.indexOf(option) === idx);

  const questions = [];
  const usableCount = Math.min(count, sentences.length);

  for (let i = 0; i < usableCount; i++) {
    const sentence = sentences[i];
    const sentenceLower = sentence.toLowerCase();
    const keyword =
      keywords.find((item) => sentenceLower.includes(item.toLowerCase())) ||
      keywords[i % Math.max(keywords.length, 1)] ||
      subject ||
      "the selected topic";

    const baseQuestion = buildQuestionFromSentence(sentence, keyword, i, difficulty, subject);
    const distractors = sourceOptions
      .filter((option) => option !== baseQuestion.correctAnswer)
      .filter((option) => !option.toLowerCase().includes(String(keyword).toLowerCase()))
      .slice(i + 1)
      .concat(sourceOptions.filter((option) => option !== baseQuestion.correctAnswer))
      .filter((option, idx, arr) => arr.indexOf(option) === idx)
      .slice(0, 3);

    const keywordDistractors = keywords
      .filter((item) => item.toLowerCase() !== String(keyword).toLowerCase())
      .slice(0, 3)
      .map((item) => `The material mainly identifies ${item} as the answer instead.`);

    const options = [baseQuestion.correctAnswer, ...distractors, ...keywordDistractors]
      .filter(Boolean)
      .filter((option, idx, arr) => arr.indexOf(option) === idx)
      .slice(0, 4);

    if (options.length >= 4) {
      const rotatedOptions = [...options.slice(i % 4), ...options.slice(0, i % 4)];
      questions.push({
        ...baseQuestion,
        options: rotatedOptions,
      });
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
  };

  const prompt = `You are an expert AI Quiz Generator for academic assessments. Generate EXACTLY ${count} unique, high-quality multiple-choice questions from the provided educational content.

CRITICAL REQUIREMENTS:
1. Each question MUST be directly derived from the provided content
2. Generate REAL exam-style questions, NOT placeholder content
3. Each option MUST be meaningful and plausible (avoid "Option A", "Option B", etc.)
4. Ensure options are similar in length and complexity
5. Make exactly ONE option clearly correct
6. Provide clear, educational explanations
7. ${languageInstruction}

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
      "questionText": "Complete question (at least 10 words, derived from content)",
      "options": [
        "First meaningful option (8-15 words)",
        "Second meaningful option (8-15 words)",
        "Third meaningful option (8-15 words)",
        "Fourth meaningful option (8-15 words)"
      ],
      "correctAnswer": "Exact text of the correct option from above",
      "explanation": "Clear explanation (2-3 sentences) with reference to the source material",
      "difficultyTag": "${difficulty}",
      "topic": "Specific topic from ${subject}",
      "conceptsInvolved": ["concept1", "concept2"]
    }
  ]
}

EDUCATIONAL CONTENT:
${extractedText}

VALIDATION CHECKLIST:
- Every question is conceptually unique
- Each option is distinct and realistic
- No placeholder text is used
- All questions relate to the provided content
- Explanations reference specific parts of the material
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
  generateFallbackMCQs,
  buildEnhancedQuizPrompt,
  enhanceQuizMetadata,
};
