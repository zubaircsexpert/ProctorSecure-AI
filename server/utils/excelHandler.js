import ExcelJS from "exceljs";
import XLSX from "xlsx";

/**
 * Export MCQs to Excel file
 */
export const exportMCQsToExcel = async (mcqs, fileName = "mcqs.xlsx") => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("MCQs");

    // Add header row
    worksheet.columns = [
      { header: "S.No", key: "sno", width: 8 },
      { header: "Question", key: "question", width: 50 },
      { header: "Option A", key: "optionA", width: 25 },
      { header: "Option B", key: "optionB", width: 25 },
      { header: "Option C", key: "optionC", width: 25 },
      { header: "Option D", key: "optionD", width: 25 },
      { header: "Correct Answer", key: "correctAnswer", width: 15 },
      { header: "Explanation", key: "explanation", width: 40 },
      { header: "Difficulty", key: "difficulty", width: 12 },
      { header: "Blooms Level", key: "bloomsLevel", width: 15 },
      { header: "MCQ Type", key: "mcqType", width: 15 },
      { header: "Topic", key: "topic", width: 15 },
      { header: "Marks", key: "marks", width: 8 },
      { header: "Status", key: "status", width: 12 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF366092" },
    };
    worksheet.getRow(1).alignment = { horizontal: "center", vertical: "center", wrapText: true };

    // Add data rows
    mcqs.forEach((mcq, index) => {
      worksheet.addRow({
        sno: index + 1,
        question: mcq.question || "",
        optionA: mcq.options?.[0] || "",
        optionB: mcq.options?.[1] || "",
        optionC: mcq.options?.[2] || "",
        optionD: mcq.options?.[3] || "",
        correctAnswer: mcq.correctAnswer || "",
        explanation: mcq.explanation || "",
        difficulty: mcq.difficulty || "medium",
        bloomsLevel: mcq.bloomsLevel || "understand",
        mcqType: mcq.mcqType || "factual",
        topic: mcq.topic || "General",
        marks: mcq.marks || 1,
        status: mcq.status || "draft",
      });
    });

    // Set alignment for all data rows
    for (let i = 2; i <= mcqs.length + 1; i++) {
      const row = worksheet.getRow(i);
      row.alignment = { horizontal: "left", vertical: "top", wrapText: true };
      row.height = 60; // Auto height for wrapped text
    }

    // Freeze the header row
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    return await workbook.xlsx.writeBuffer();
  } catch (error) {
    console.error("Error exporting MCQs to Excel:", error);
    throw new Error(`Failed to export MCQs: ${error.message}`);
  }
};

/**
 * Import MCQs from Excel file
 */
export const importMCQsFromExcel = async (filePath) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet("MCQs") || workbook.worksheets[0];

    if (!worksheet) {
      throw new Error("No worksheet found in Excel file");
    }

    const mcqs = [];
    let rowIndex = 2; // Start from row 2 (skip header)

    worksheet.eachRow((row, index) => {
      if (index === 1) return; // Skip header row

      const values = row.values;

      // Validate required fields
      const question = String(values[2] || "").trim();
      const optionA = String(values[3] || "").trim();
      const optionB = String(values[4] || "").trim();
      const optionC = String(values[5] || "").trim();
      const optionD = String(values[6] || "").trim();
      const correctAnswer = String(values[7] || "").trim();

      if (!question || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
        console.warn(`Skipping row ${index}: Missing required fields`);
        return;
      }

      // Validate correct answer
      const options = [optionA, optionB, optionC, optionD];
      if (!options.includes(correctAnswer)) {
        console.warn(
          `Skipping row ${index}: Correct answer not in options`
        );
        return;
      }

      mcqs.push({
        question,
        options,
        correctAnswer,
        explanation: String(values[8] || "").trim(),
        difficulty: ["easy", "medium", "hard"].includes(String(values[9] || "").toLowerCase())
          ? String(values[9] || "").toLowerCase()
          : "medium",
        bloomsLevel: [
          "remember",
          "understand",
          "apply",
          "analyze",
          "evaluate",
          "create",
        ].includes(String(values[10] || "").toLowerCase())
          ? String(values[10] || "").toLowerCase()
          : "understand",
        mcqType: ["factual", "conceptual", "analytical", "tricky"].includes(
          String(values[11] || "").toLowerCase()
        )
          ? String(values[11] || "").toLowerCase()
          : "factual",
        topic: String(values[12] || "General").trim(),
        marks: Number(values[13]) || 1,
        status: ["draft", "approved", "rejected"].includes(
          String(values[14] || "").toLowerCase()
        )
          ? String(values[14] || "").toLowerCase()
          : "draft",
        sourceType: "imported",
      });
    });

    if (mcqs.length === 0) {
      throw new Error("No valid MCQs found in Excel file");
    }

    return mcqs;
  } catch (error) {
    console.error("Error importing MCQs from Excel:", error);
    throw new Error(`Failed to import MCQs: ${error.message}`);
  }
};

/**
 * Create quiz template from selected MCQs
 */
export const createQuizFromMCQs = (mcqs, quizConfig) => {
  const selectedMCQs = [];

  // Implement smart selection based on difficulty distribution
  const difficultyDistribution = quizConfig.difficultyDistribution || {
    easy: 30,
    medium: 40,
    hard: 30,
  };

  const totalQuestions = quizConfig.totalQuestions || 10;

  // Group MCQs by difficulty
  const grouped = {
    easy: mcqs.filter((m) => m.difficulty === "easy"),
    medium: mcqs.filter((m) => m.difficulty === "medium"),
    hard: mcqs.filter((m) => m.difficulty === "hard"),
  };

  // Calculate how many questions of each difficulty
  const easyCount = Math.floor((totalQuestions * difficultyDistribution.easy) / 100);
  const mediumCount = Math.floor((totalQuestions * difficultyDistribution.medium) / 100);
  const hardCount = totalQuestions - easyCount - mediumCount;

  // Select random questions from each group
  selectedMCQs.push(...getRandomElements(grouped.easy, easyCount));
  selectedMCQs.push(...getRandomElements(grouped.medium, mediumCount));
  selectedMCQs.push(...getRandomElements(grouped.hard, hardCount));

  // Shuffle if enabled
  if (quizConfig.questionShuffling) {
    selectedMCQs.sort(() => Math.random() - 0.5);
  }

  return selectedMCQs;
};

/**
 * Get random elements from array
 */
const getRandomElements = (arr, count) => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
};

/**
 * Validate MCQ format
 */
export const validateMCQ = (mcq) => {
  const errors = [];

  if (!mcq.question || mcq.question.trim().length === 0) {
    errors.push("Question is required");
  }

  if (!Array.isArray(mcq.options) || mcq.options.length !== 4) {
    errors.push("Exactly 4 options are required");
  }

  if (!mcq.correctAnswer) {
    errors.push("Correct answer is required");
  }

  if (!mcq.options.includes(mcq.correctAnswer)) {
    errors.push("Correct answer must be one of the options");
  }

  if (![
    "easy",
    "medium",
    "hard",
  ].includes(mcq.difficulty)) {
    errors.push("Invalid difficulty level");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Generate PDF from MCQs
 */
export const generatePDFFromMCQs = async (mcqs, quizTitle = "Quiz") => {
  // This would require a PDF library like pdfkit or html2pdf
  // For now, we'll export to a format that can be converted to PDF
  try {
    let pdfContent = `
QUIZ: ${quizTitle}
Generated on: ${new Date().toLocaleDateString()}
Total Questions: ${mcqs.length}
${"=".repeat(80)}

`;

    mcqs.forEach((mcq, index) => {
      pdfContent += `
Question ${index + 1}: ${mcq.question}
Marks: ${mcq.marks || 1}
Difficulty: ${mcq.difficulty}

A) ${mcq.options[0]}
B) ${mcq.options[1]}
C) ${mcq.options[2]}
D) ${mcq.options[3]}

${"_".repeat(80)}

`;
    });

    // Also add answer key at the end
    pdfContent += `

${"=".repeat(80)}
ANSWER KEY (FOR TEACHERS ONLY)
${"=".repeat(80)}

`;

    mcqs.forEach((mcq, index) => {
      pdfContent += `
Q${index + 1}: ${mcq.correctAnswer}
Explanation: ${mcq.explanation || "N/A"}

`;
    });

    return pdfContent;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};

export default {
  exportMCQsToExcel,
  importMCQsFromExcel,
  createQuizFromMCQs,
  validateMCQ,
  generatePDFFromMCQs,
};
