import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

// Lazy initialization of OpenAI client
let openai = null;

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.");
  }
  
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  return openai;
};

/**
 * Generate MCQs using OpenAI API
 * @param {string} extractedText - The text to generate MCQs from
 * @param {object} options - Generation options
 * @returns {array} Array of generated MCQs
 */
export const generateMCQsWithAI = async (extractedText, options = {}) => {
  const {
    numberOfQuestions = 10,
    difficulty = "mixed", // easy, medium, hard, mixed
    examType = "competitive", // competitive, university, academic
    bloomsLevel = "mixed", // remember, understand, apply, analyze, evaluate, create
    mcqType = "mixed", // factual, conceptual, analytical, tricky
    language = "English",
    subject = "General",
    topic = "General",
  } = options;

  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error("No text provided for MCQ generation");
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    const client = getOpenAIClient();
    
    // Chunk text if too long (GPT has token limits)
    const maxChunkLength = 3000;
    const textChunks = chunkText(extractedText, maxChunkLength);

    const allMCQs = [];

    for (const chunk of textChunks) {
      const prompt = buildMCQGenerationPrompt(chunk, {
        numberOfQuestions,
        difficulty,
        examType,
        bloomsLevel,
        mcqType,
        language,
        subject,
        topic,
      });

      const response = await client.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert educator and exam designer specializing in creating high-quality Multiple Choice Questions similar to PPSC, FPSC, NTS, IELTS, and university-level examinations. Create realistic, challenging, and well-crafted MCQs that test conceptual understanding and practical knowledge.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 0.9,
      });

      const content = response.choices[0]?.message?.content || "";
      const mcqs = parseMCQResponse(content);
      allMCQs.push(...mcqs);
    }

    // Limit to requested number
    return allMCQs.slice(0, numberOfQuestions);
  } catch (error) {
    console.error("OpenAI MCQ Generation Error:", error);
    throw new Error(`Failed to generate MCQs: ${error.message}`);
  }
};

/**
 * Build the prompt for MCQ generation
 */
const buildMCQGenerationPrompt = (text, options) => {
  const {
    numberOfQuestions,
    difficulty,
    examType,
    bloomsLevel,
    mcqType,
    language,
    subject,
    topic,
  } = options;

  let difficultyInstructions = "";
  if (difficulty === "easy") {
    difficultyInstructions = "Create easy-level questions testing basic recall and understanding.";
  } else if (difficulty === "medium") {
    difficultyInstructions = "Create medium-level questions testing comprehension and simple application.";
  } else if (difficulty === "hard") {
    difficultyInstructions = "Create hard-level questions testing analysis, evaluation, and synthesis.";
  } else {
    difficultyInstructions =
      "Create a mix of easy (30%), medium (40%), and hard (30%) level questions.";
  }

  let bloomsInstructions = "";
  if (bloomsLevel !== "mixed") {
    bloomsInstructions = `Focus on Bloom's Taxonomy level: ${bloomsLevel}.`;
  } else {
    bloomsInstructions =
      "Distribute across Bloom's levels: 10% Remember, 30% Understand, 30% Apply, 20% Analyze, 10% Evaluate.";
  }

  let mcqTypeInstructions = "";
  if (mcqType !== "mixed") {
    mcqTypeInstructions = `Generate ${mcqType} type questions that test ${
      mcqType === "factual"
        ? "direct knowledge from the text"
        : mcqType === "conceptual"
          ? "understanding of concepts"
          : mcqType === "analytical"
            ? "analysis and critical thinking"
            : "tricky scenarios and edge cases"
        }`;
  } else {
    mcqTypeInstructions =
      "Generate a mix of: 30% Factual (direct knowledge), 40% Conceptual (understanding), 20% Analytical (critical thinking), 10% Tricky (edge cases).";
  }

  return `
Based on the following text, generate ${numberOfQuestions} multiple-choice questions (MCQs) in ${language}.

TEXT TO ANALYZE:
"${text}"

REQUIREMENTS:
${difficultyInstructions}
${bloomsInstructions}
${mcqTypeInstructions}

Each MCQ should:
1. Have a clear, concise question
2. Include exactly 4 options (A, B, C, D)
3. Have only ONE correct answer
4. Avoid ambiguous or trick options that rely on wordplay
5. Have plausible distractors based on common misconceptions
6. Test understanding from the provided text
7. Be appropriate for ${examType} level examinations
8. Avoid duplicate or similar questions

Subject: ${subject}
Topic: ${topic}
Exam Type: ${examType}

RESPONSE FORMAT:
Return the MCQs in this exact JSON format (no markdown, just valid JSON):
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Brief explanation of why this is correct",
    "difficulty": "easy|medium|hard",
    "bloomsLevel": "remember|understand|apply|analyze|evaluate|create",
    "mcqType": "factual|conceptual|analytical|tricky",
    "marks": 1
  }
]

Generate the JSON array now:`;
};

/**
 * Parse MCQ response from OpenAI
 */
const parseMCQResponse = (responseText) => {
  try {
    // Extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn("No JSON array found in response");
      return [];
    }

    const mcqs = JSON.parse(jsonMatch[0]);

    // Validate and sanitize MCQs
    return mcqs
      .filter(
        (mcq) =>
          mcq.question &&
          Array.isArray(mcq.options) &&
          mcq.options.length === 4 &&
          mcq.correctAnswer &&
          mcq.options.includes(mcq.correctAnswer)
      )
      .map((mcq) => ({
        question: String(mcq.question || "").trim(),
        options: mcq.options.map((opt) => String(opt || "").trim()),
        correctAnswer: String(mcq.correctAnswer || "").trim(),
        explanation: String(mcq.explanation || "").trim(),
        difficulty: ["easy", "medium", "hard"].includes(mcq.difficulty)
          ? mcq.difficulty
          : "medium",
        bloomsLevel: [
          "remember",
          "understand",
          "apply",
          "analyze",
          "evaluate",
          "create",
        ].includes(mcq.bloomsLevel)
          ? mcq.bloomsLevel
          : "understand",
        mcqType: ["factual", "conceptual", "analytical", "tricky"].includes(
          mcq.mcqType
        )
          ? mcq.mcqType
          : "factual",
        marks: Number(mcq.marks) || 1,
        topic: "General",
      }));
  } catch (error) {
    console.error("Error parsing MCQ response:", error);
    return [];
  }
};

/**
 * Chunk text for processing
 */
const chunkText = (text, maxLength) => {
  const chunks = [];
  let currentChunk = "";

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += sentence + ". ";
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence + ". ";
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim());

  return chunks;
};

/**
 * Regenerate weak questions
 */
export const regenerateWeakQuestions = async (weakMCQs, options = {}) => {
  if (!Array.isArray(weakMCQs) || weakMCQs.length === 0) {
    throw new Error("No weak MCQs provided for regeneration");
  }

  try {
    const regeneratedMCQs = [];

    for (const mcq of weakMCQs) {
      const prompt = `
You are an expert educator. The following MCQ is weak (low difficulty percentage or flagged for issues):

Question: ${mcq.question}
Options: ${mcq.options.join(", ")}
Current Correct Answer: ${mcq.correctAnswer}
Issue: ${mcq.flagReason || "Weak or overused question"}

Generate a SINGLE improved replacement MCQ that:
1. Tests the same concept but in a different way
2. Has better distractors
3. Is clearer and less ambiguous
4. Maintains or increases the difficulty level
5. Is more engaging and realistic

Respond in JSON format:
{
  "question": "New question",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "Option A",
  "explanation": "Why this is correct",
  "difficulty": "easy|medium|hard",
  "bloomsLevel": "remember|understand|apply|analyze|evaluate|create",
  "mcqType": "factual|conceptual|analytical|tricky"
}`;

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are an expert MCQ designer. Generate high-quality, non-ambiguous questions.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1500,
        });

        const content = response.choices[0]?.message?.content || "";
        const newMCQ = parseMCQResponse("[" + content + "]")[0];

        if (newMCQ) {
          regeneratedMCQs.push({
            ...newMCQ,
            originalMcqId: mcq._id,
            topic: mcq.topic || "General",
          });
        }
      } catch (err) {
        console.error("Error regenerating single MCQ:", err);
        continue;
      }
    }

    return regeneratedMCQs;
  } catch (error) {
    console.error("Error in regenerateWeakQuestions:", error);
    throw error;
  }
};

/**
 * Detect duplicate or similar questions
 */
export const detectDuplicateQuestions = (mcqs) => {
  const duplicates = [];

  for (let i = 0; i < mcqs.length; i++) {
    for (let j = i + 1; j < mcqs.length; j++) {
      const similarity = calculateSimilarity(
        mcqs[i].question,
        mcqs[j].question
      );

      if (similarity > 0.8) {
        duplicates.push({
          mcq1Index: i,
          mcq2Index: j,
          similarity,
          recommendation: "Remove or regenerate one of these questions",
        });
      }
    }
  }

  return duplicates;
};

/**
 * Calculate similarity between two strings (Jaro-Winkler distance)
 */
const calculateSimilarity = (str1, str2) => {
  const s1 = String(str1 || "").toLowerCase();
  const s2 = String(str2 || "").toLowerCase();

  if (s1 === s2) return 1;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

/**
 * Calculate Levenshtein distance
 */
const getEditDistance = (s1, s2) => {
  const costs = [];

  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }

  return costs[s2.length];
};

export default {
  generateMCQsWithAI,
  regenerateWeakQuestions,
  detectDuplicateQuestions,
};
