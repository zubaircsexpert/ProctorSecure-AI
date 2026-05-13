import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";

// Models
import MCQBank from "../models/MCQBank.js";
import QuizTemplate from "../models/QuizTemplate.js";
import Quiz from "../models/Quiz.js";
import QuizSession from "../models/QuizSession.js";
import CheatDetection from "../models/CheatDetection.js";
import QuizAnalytics from "../models/QuizAnalytics.js";
import GeneratedQuestion from "../models/GeneratedQuestion.js";
import User from "../models/User.js";

// Utilities
import {
  generateMCQsWithAI,
  regenerateWeakQuestions,
  detectDuplicateQuestions,
} from "../utils/mcqGenerator.js";
import {
  exportMCQsToExcel,
  importMCQsFromExcel,
  createQuizFromMCQs,
  validateMCQ,
  generatePDFFromMCQs,
} from "../utils/excelHandler.js";
import {
  detectSimilarAnswers,
  detectImpossibleTiming,
  calculateCheatingRiskScore,
  generateCheatDetectionReport,
} from "../utils/cheatDetection.js";
import {
  calculateQuizStatistics,
  calculateQuestionPerformance,
  calculateDifficultyAnalysis,
  calculateTopicAnalysis,
  identifyWeakQuestions,
  generateStudentPerformanceReport,
} from "../utils/analyticsCalculator.js";
import {
  extractTextFromImageWithLanguage,
  processPdfAdvanced,
  normalizeExtractedText,
} from "../utils/quizGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer setup for file uploads
const quizUploadsDir = path.join(
  path.dirname(__dirname),
  "uploads",
  "quiz-materials"
);
if (!fs.existsSync(quizUploadsDir)) {
  fs.mkdirSync(quizUploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: quizUploadsDir,
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/webp",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// Middleware to verify JWT and extract user
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const verifyTeacher = (req, res, next) => {
  if (req.userRole !== "teacher" && req.userRole !== "admin") {
    return res.status(403).json({ message: "Only teachers can access this" });
  }
  next();
};

/**
 * Upload file and extract text for MCQ generation
 * POST /api/quiz/upload-material
 */
router.post(
  "/upload-material",
  verifyToken,
  verifyTeacher,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { extractedText } = await extractTextFromFile(req.file);

      if (!extractedText) {
        return res.status(400).json({
          message: "Failed to extract text from file",
        });
      }

      res.json({
        success: true,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        extractedText: extractedText.substring(0, 2000), // Return first 2000 chars for preview
        fullTextLength: extractedText.length,
        filePath: `/uploads/quiz-materials/${req.file.filename}`,
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * Generate MCQs from extracted text
 * POST /api/quiz/generate-mcqs
 */
router.post("/generate-mcqs", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const {
      text,
      numberOfQuestions = 10,
      difficulty = "mixed",
      examType = "competitive",
      bloomsLevel = "mixed",
      mcqType = "mixed",
      subject = "General",
      topic = "General",
    } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "No text provided" });
    }

    // Show status updates (could use WebSocket for real-time updates)
    const startTime = Date.now();

    const mcqs = await generateMCQsWithAI(text, {
      numberOfQuestions,
      difficulty,
      examType,
      bloomsLevel,
      mcqType,
      subject,
      topic,
    });

    // Detect duplicates
    const duplicates = detectDuplicateQuestions(mcqs);

    const timeTaken = (Date.now() - startTime) / 1000;

    res.json({
      success: true,
      mcqs,
      duplicatesDetected: duplicates.length,
      generationTime: timeTaken,
      message: `Generated ${mcqs.length} MCQs in ${timeTaken.toFixed(2)}s`,
    });
  } catch (error) {
    console.error("MCQ generation error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Save generated MCQs to database
 * POST /api/quiz/save-mcqs
 */
router.post("/save-mcqs", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const { mcqs, quizId = null, topic = "General" } = req.body;

    if (!Array.isArray(mcqs) || mcqs.length === 0) {
      return res.status(400).json({ message: "No MCQs to save" });
    }

    // Validate all MCQs
    const validatedMCQs = mcqs
      .filter((mcq) => {
        const validation = validateMCQ(mcq);
        return validation.isValid;
      })
      .map((mcq) => ({
        ...mcq,
        createdBy: req.userId,
        quizId: quizId ? new mongoose.Types.ObjectId(quizId) : null,
        topic: mcq.topic || topic,
        sourceType: "generated",
        status: "draft",
        aiGenerated: true,
      }));

    if (validatedMCQs.length === 0) {
      return res.status(400).json({
        message: "No valid MCQs to save",
      });
    }

    // Bulk insert
    const savedMCQs = await MCQBank.insertMany(validatedMCQs);

    // If quizId is provided, add questions to quiz
    if (quizId) {
      await Quiz.findByIdAndUpdate(quizId, {
        $push: { questions: { $each: savedMCQs.map((m) => m._id) } },
      });
    }

    res.json({
      success: true,
      savedCount: savedMCQs.length,
      mcqIds: savedMCQs.map((m) => m._id),
      message: `Saved ${savedMCQs.length} MCQs`,
    });
  } catch (error) {
    console.error("Save MCQs error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get all MCQs for a teacher (with pagination and filtering)
 * GET /api/quiz/mcqs?page=1&limit=20&difficulty=medium&topic=English&status=draft
 */
router.get("/mcqs", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      difficulty,
      topic,
      status,
      search,
    } = req.query;

    const filter = { createdBy: req.userId };

    if (difficulty) filter.difficulty = difficulty;
    if (topic) filter.topic = topic;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { questionText: { $regex: search, $options: "i" } },
        { topic: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const mcqs = await MCQBank.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await MCQBank.countDocuments(filter);

    res.json({
      success: true,
      mcqs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get MCQs error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Update MCQ (edit)
 * PUT /api/quiz/mcqs/:mcqId
 */
router.put("/mcqs/:mcqId", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const { mcqId } = req.params;
    const updateData = req.body;

    // Validate MCQ format
    const validation = validateMCQ(updateData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors,
      });
    }

    const mcq = await MCQBank.findOneAndUpdate(
      { _id: mcqId, createdBy: req.userId },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!mcq) {
      return res.status(404).json({ message: "MCQ not found" });
    }

    res.json({
      success: true,
      mcq,
      message: "MCQ updated successfully",
    });
  } catch (error) {
    console.error("Update MCQ error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Delete MCQ
 * DELETE /api/quiz/mcqs/:mcqId
 */
router.delete("/mcqs/:mcqId", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const { mcqId } = req.params;

    const mcq = await MCQBank.findOneAndDelete({
      _id: mcqId,
      createdBy: req.userId,
    });

    if (!mcq) {
      return res.status(404).json({ message: "MCQ not found" });
    }

    // Also remove from quiz if associated
    if (mcq.quizId) {
      await Quiz.findByIdAndUpdate(mcq.quizId, {
        $pull: { questions: mcqId },
      });
    }

    res.json({
      success: true,
      message: "MCQ deleted successfully",
    });
  } catch (error) {
    console.error("Delete MCQ error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Bulk delete MCQs
 * POST /api/quiz/mcqs/bulk-delete
 */
router.post(
  "/mcqs/bulk-delete",
  verifyToken,
  verifyTeacher,
  async (req, res) => {
    try {
      const { mcqIds } = req.body;

      if (!Array.isArray(mcqIds) || mcqIds.length === 0) {
        return res.status(400).json({ message: "No MCQ IDs provided" });
      }

      const result = await MCQBank.deleteMany({
        _id: { $in: mcqIds },
        createdBy: req.userId,
      });

      res.json({
        success: true,
        deletedCount: result.deletedCount,
        message: `Deleted ${result.deletedCount} MCQs`,
      });
    } catch (error) {
      console.error("Bulk delete error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * Approve MCQs
 * POST /api/quiz/mcqs/approve
 */
router.post("/mcqs/approve", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const { mcqIds } = req.body;

    if (!Array.isArray(mcqIds) || mcqIds.length === 0) {
      return res.status(400).json({ message: "No MCQ IDs provided" });
    }

    const result = await MCQBank.updateMany(
      { _id: { $in: mcqIds }, createdBy: req.userId },
      { status: "approved", updatedAt: new Date() }
    );

    res.json({
      success: true,
      modifiedCount: result.modifiedCount,
      message: `Approved ${result.modifiedCount} MCQs`,
    });
  } catch (error) {
    console.error("Approve MCQs error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Regenerate weak MCQs
 * POST /api/quiz/mcqs/regenerate-weak
 */
router.post(
  "/mcqs/regenerate-weak",
  verifyToken,
  verifyTeacher,
  async (req, res) => {
    try {
      const { mcqIds } = req.body;

      if (!Array.isArray(mcqIds) || mcqIds.length === 0) {
        return res.status(400).json({ message: "No weak MCQ IDs provided" });
      }

      const weakMCQs = await MCQBank.find({
        _id: { $in: mcqIds },
        createdBy: req.userId,
      });

      const regeneratedMCQs = await regenerateWeakQuestions(weakMCQs);

      // Save regenerated MCQs
      const savedMCQs = await MCQBank.insertMany(
        regeneratedMCQs.map((mcq) => ({
          ...mcq,
          createdBy: req.userId,
          status: "draft",
          sourceType: "regenerated",
        }))
      );

      res.json({
        success: true,
        regeneratedCount: savedMCQs.length,
        newMCQIds: savedMCQs.map((m) => m._id),
        message: `Regenerated ${savedMCQs.length} MCQs`,
      });
    } catch (error) {
      console.error("Regenerate weak MCQs error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * Export MCQs to Excel
 * POST /api/quiz/export-excel
 */
router.post(
  "/export-excel",
  verifyToken,
  verifyTeacher,
  async (req, res) => {
    try {
      const { mcqIds } = req.body;

      let mcqs;
      if (Array.isArray(mcqIds) && mcqIds.length > 0) {
        mcqs = await MCQBank.find({
          _id: { $in: mcqIds },
          createdBy: req.userId,
        });
      } else {
        mcqs = await MCQBank.find({ createdBy: req.userId });
      }

      if (mcqs.length === 0) {
        return res.status(400).json({ message: "No MCQs to export" });
      }

      const buffer = await exportMCQsToExcel(mcqs);

      res.set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="mcqs-${Date.now()}.xlsx"`,
      });

      res.send(buffer);
    } catch (error) {
      console.error("Export Excel error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * Import MCQs from Excel
 * POST /api/quiz/import-excel
 */
router.post(
  "/import-excel",
  verifyToken,
  verifyTeacher,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const importedMCQs = await importMCQsFromExcel(req.file.path);

      // Save imported MCQs
      const savedMCQs = await MCQBank.insertMany(
        importedMCQs.map((mcq) => ({
          ...mcq,
          createdBy: req.userId,
          sourceType: "imported",
          status: "draft",
        }))
      );

      // Clean up uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });

      res.json({
        success: true,
        importedCount: savedMCQs.length,
        mcqIds: savedMCQs.map((m) => m._id),
        message: `Imported ${savedMCQs.length} MCQs`,
      });
    } catch (error) {
      console.error("Import Excel error:", error);
      // Clean up uploaded file
      if (req.file?.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      }
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * Export MCQs to PDF
 * POST /api/quiz/export-pdf
 */
router.post("/export-pdf", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const { mcqIds, quizTitle = "Quiz" } = req.body;

    let mcqs;
    if (Array.isArray(mcqIds) && mcqIds.length > 0) {
      mcqs = await MCQBank.find({
        _id: { $in: mcqIds },
        createdBy: req.userId,
      });
    } else {
      mcqs = await MCQBank.find({ createdBy: req.userId });
    }

    if (mcqs.length === 0) {
      return res.status(400).json({ message: "No MCQs to export" });
    }

    const pdfContent = await generatePDFFromMCQs(mcqs, quizTitle);

    res.set({
      "Content-Type": "text/plain",
      "Content-Disposition": `attachment; filename="quiz-${Date.now()}.txt"`,
    });

    res.send(pdfContent);
  } catch (error) {
    console.error("Export PDF error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Helper function to extract text from uploaded file
 */
async function extractTextFromFile(file) {
  const ext = path.extname(file.originalname || "").toLowerCase();
  let extractedText = "";

  try {
    if (ext === ".pdf") {
      const { PDFParse } = await import("pdf-parse");
      const dataBuffer = fs.readFileSync(file.path);
      const pdfResult = await processPdfAdvanced(PDFParse, dataBuffer);
      extractedText = normalizeExtractedText(pdfResult.text || "");
    } else if (ext === ".docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ path: file.path });
      extractedText = normalizeExtractedText(result.value || "");
    } else if (ext === ".txt") {
      extractedText = normalizeExtractedText(
        fs.readFileSync(file.path, "utf-8")
      );
    } else if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext)) {
      const ocrResult = await extractTextFromImageWithLanguage(file.path, [
        "eng",
        "urd",
      ]);
      extractedText = normalizeExtractedText(ocrResult.text || "");
    }
  } catch (error) {
    console.error("Text extraction error:", error);
  }

  return { extractedText, fileName: file.originalname };
}

export default router;
