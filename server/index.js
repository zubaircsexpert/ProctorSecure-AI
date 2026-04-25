import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import dns from "dns";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";

import notificationRoutes from "./routes/notificationRoutes.js";
import assignmentRoutes from "./routes/assignments.js";

import User from "./models/User.js";
import Question from "./models/Question.js";
import Result from "./models/Result.js";
import Exam from "./models/Exam.js";
import PaperCheck from "./models/PaperCheck.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");
const paperChecksDir = path.join(uploadsDir, "paper-checks");

fs.mkdirSync(paperChecksDir, { recursive: true });

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(uploadsDir));

app.use("/api/assignments", assignmentRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.send("Backend Running");
});

const signToken = (user) =>
  jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET
  );

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

const verifyTeacher = async (req, res, next) => {
  if (req.user?.role === "teacher") {
    return next();
  }

  if (!req.user?.userId) {
    return res.status(403).json({ message: "Only teachers can do this action." });
  }

  try {
    const user = await User.findById(req.user.userId).select("role");

    if (user?.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can do this action." });
    }

    next();
  } catch (err) {
    console.log("VERIFY TEACHER ERROR:", err);
    res.status(500).json({ message: "Role verification failed." });
  }
};

const buildExamPayload = (exam) => ({
  ...exam.toObject(),
  canStart: exam.status === "live" && exam.accessGranted === true,
});

const safeJsonParse = (value, fallback) => {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const removeFileIfExists = (fileName) => {
  if (!fileName) return;

  const absolutePath = path.join(uploadsDir, fileName);
  if (absolutePath.startsWith(uploadsDir) && fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
};

const paperCheckStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, paperChecksDir);
  },
  filename: (req, file, cb) => {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-");
    cb(null, `${Date.now()}-${sanitized}`);
  },
});

const paperCheckUpload = multer({ storage: paperCheckStorage });

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "student",
    });

    await newUser.save();

    res.json({ message: "Registered successfully" });
  } catch (err) {
    console.log("REGISTER ERROR:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Wrong password" });
    }

    res.json({
      token: signToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).json({ message: "Login Error" });
  }
});

app.post("/api/exams/add", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const {
      title,
      course,
      syllabus,
      duration,
      examKey,
      startTime,
      endTime,
    } = req.body;

    if (!title || !course || !duration) {
      return res.status(400).json({ message: "Course, title, duration required" });
    }

    const exam = new Exam({
      title,
      course,
      syllabus: syllabus || "",
      duration: Number(duration),
      examKey: examKey || "",
      startTime: startTime || null,
      endTime: endTime || null,
      status: "scheduled",
      accessGranted: false,
    });

    await exam.save();
    res.json({ message: "Exam scheduled", exam: buildExamPayload(exam) });
  } catch (err) {
    console.log("ADD EXAM ERROR:", err);
    res.status(500).json({ message: "Failed to create exam" });
  }
});

app.get("/api/exams/all", verifyToken, async (req, res) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 });
    res.json(exams.map(buildExamPayload));
  } catch (err) {
    console.log("FETCH EXAMS ERROR:", err);
    res.status(500).json({ message: "Failed to load exams" });
  }
});

app.put("/api/exams/update/:id", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const {
      title,
      course,
      syllabus,
      duration,
      examKey,
      startTime,
      endTime,
    } = req.body;

    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      {
        title,
        course,
        syllabus: syllabus || "",
        duration: Number(duration),
        examKey: examKey || "",
        startTime: startTime || null,
        endTime: endTime || null,
      },
      { new: true, runValidators: true }
    );

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    res.json({ message: "Exam updated", exam: buildExamPayload(exam) });
  } catch (err) {
    console.log("UPDATE EXAM DETAILS ERROR:", err);
    res.status(500).json({ message: "Failed to update exam" });
  }
});

app.put("/api/exams/update-status/:id", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const { status, accessGranted, startTime, endTime } = req.body;
    const updateData = {};

    if (status !== undefined) {
      updateData.status = status;
    }

    if (typeof accessGranted === "boolean") {
      updateData.accessGranted = accessGranted;
    } else if (status === "live") {
      updateData.accessGranted = true;
    } else if (status === "scheduled" || status === "closed") {
      updateData.accessGranted = false;
    }

    if (startTime !== undefined) {
      updateData.startTime = startTime || null;
    }

    if (endTime !== undefined) {
      updateData.endTime = endTime || null;
    }

    const exam = await Exam.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    res.json({ message: "Exam status updated", exam: buildExamPayload(exam) });
  } catch (err) {
    console.log("UPDATE EXAM STATUS ERROR:", err);
    res.status(500).json({ message: "Failed to update exam status" });
  }
});

app.delete("/api/exams/delete/:id", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    await Question.deleteMany({ examId: req.params.id });
    res.json({ message: "Exam deleted" });
  } catch (err) {
    console.log("DELETE EXAM ERROR:", err);
    res.status(500).json({ message: "Failed to delete exam" });
  }
});

app.post("/api/questions/add", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const { examId, questionText, question, options, correctAnswer } = req.body;
    const finalQuestionText = questionText || question;
    const cleanedOptions = Array.isArray(options)
      ? options.map((option) => String(option).trim()).filter(Boolean)
      : [];

    if (!examId || !finalQuestionText || cleanedOptions.length < 2 || !correctAnswer) {
      return res.status(400).json({ message: "Invalid question data" });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const newQuestion = new Question({
      examId,
      questionText: finalQuestionText,
      options: cleanedOptions,
      correctAnswer,
    });

    await newQuestion.save();
    res.json({ message: "Question added", question: newQuestion });
  } catch (err) {
    console.log("ADD QUESTION ERROR:", err);
    res.status(500).json({ message: "Failed to add question" });
  }
});

app.get("/api/questions", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: 1 });
    res.json(questions);
  } catch (err) {
    console.log("FETCH QUESTIONS ERROR:", err);
    res.status(500).json({ message: "Failed to load questions" });
  }
});

app.get("/api/questions/:examId", verifyToken, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    if (!(exam.status === "live" && exam.accessGranted === true)) {
      return res.status(403).json({
        message: "Teacher ne abhi exam allow nahi kiya.",
      });
    }

    const questions = await Question.find({ examId: req.params.examId }).sort({
      createdAt: 1,
    });

    res.json(questions);
  } catch (err) {
    console.log("FETCH EXAM QUESTIONS ERROR:", err);
    res.status(500).json({ message: "Failed to load questions" });
  }
});

app.post("/api/results/submit", verifyToken, async (req, res) => {
  try {
    const result = new Result({
      ...req.body,
      userId: req.user.userId,
    });

    await result.save();
    res.json({ message: "Result saved", result });
  } catch (err) {
    console.log("RESULT SAVE ERROR:", err);
    res.status(500).json({ message: "Failed to save result" });
  }
});

app.get("/api/results/my", verifyToken, async (req, res) => {
  try {
    const results = await Result.find({ userId: req.user.userId }).sort({
      createdAt: -1,
    });
    res.json(results);
  } catch (err) {
    console.log("MY RESULTS ERROR:", err);
    res.status(500).json({ message: "Failed to load results" });
  }
});

app.get("/my-results", verifyToken, async (req, res) => {
  try {
    const results = await Result.find({ userId: req.user.userId }).sort({
      createdAt: -1,
    });
    res.json(results);
  } catch (err) {
    console.log("MY RESULTS ERROR:", err);
    res.status(500).json({ message: "Failed to load results" });
  }
});

app.get("/api/results", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const results = await Result.find().sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    console.log("RESULTS ERROR:", err);
    res.status(500).json({ message: "Failed to load all results" });
  }
});

app.delete("/api/results/delete/:id", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const deletedResult = await Result.findByIdAndDelete(req.params.id);

    if (!deletedResult) {
      return res.status(404).json({ message: "Result not found." });
    }

    res.json({ message: "Result deleted successfully." });
  } catch (err) {
    console.log("RESULT DELETE ERROR:", err);
    res.status(500).json({ message: "Delete failed." });
  }
});

app.post(
  "/api/paper-checks",
  verifyToken,
  verifyTeacher,
  paperCheckUpload.fields([
    { name: "answerSheet", maxCount: 1 },
    { name: "answerKey", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const report = safeJsonParse(req.body.report, {});
      const answerSheetFile = req.files?.answerSheet?.[0];
      const answerKeyFile = req.files?.answerKey?.[0];

      const paperCheck = new PaperCheck({
        teacherId: req.user.userId,
        examTitle: report.examTitle || req.body.examTitle || "MCQ Paper Check",
        course: report.course || req.body.course || "",
        candidateName: report.candidateName || req.body.candidateName || "",
        processingMode: report.processingMode || "hybrid-ocr",
        answerSheetFile: answerSheetFile
          ? path.relative(uploadsDir, answerSheetFile.path).replace(/\\/g, "/")
          : "",
        answerKeyFile: answerKeyFile
          ? path.relative(uploadsDir, answerKeyFile.path).replace(/\\/g, "/")
          : "",
        totalQuestions: Number(report.totalQuestions || 0),
        parsedQuestions: Number(report.parsedQuestions || 0),
        correctAnswers: Number(report.correctAnswers || 0),
        incorrectAnswers: Number(report.incorrectAnswers || 0),
        unansweredAnswers: Number(report.unansweredAnswers || 0),
        lowConfidenceCount: Number(report.lowConfidenceCount || 0),
        totalMarks: Number(report.totalMarks || 0),
        marksAwarded: Number(report.marksAwarded || 0),
        accuracyPercentage: Number(report.accuracyPercentage || 0),
        reviewSummary: report.reviewSummary || "",
        manualReviewRequired: Boolean(report.manualReviewRequired),
        answerKeyMap: report.answerKeyMap || {},
        studentAnswerMap: report.studentAnswerMap || {},
        questionResults: Array.isArray(report.questionResults)
          ? report.questionResults
          : [],
      });

      await paperCheck.save();
      res.status(201).json({ message: "Paper check saved", paperCheck });
    } catch (err) {
      console.log("SAVE PAPER CHECK ERROR:", err);
      res.status(500).json({ message: "Failed to save paper check" });
    }
  }
);

app.get("/api/paper-checks", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const paperChecks = await PaperCheck.find().sort({ createdAt: -1 });
    res.json(paperChecks);
  } catch (err) {
    console.log("FETCH PAPER CHECKS ERROR:", err);
    res.status(500).json({ message: "Failed to load paper checks" });
  }
});

app.delete("/api/paper-checks/:id", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const paperCheck = await PaperCheck.findByIdAndDelete(req.params.id);

    if (!paperCheck) {
      return res.status(404).json({ message: "Paper check not found." });
    }

    removeFileIfExists(paperCheck.answerSheetFile);
    removeFileIfExists(paperCheck.answerKeyFile);

    res.json({ message: "Paper check deleted successfully." });
  } catch (err) {
    console.log("DELETE PAPER CHECK ERROR:", err);
    res.status(500).json({ message: "Failed to delete paper check." });
  }
});

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    app.listen(port, () => {
      console.log(`Server Running on ${port}`);
    });
  } catch (err) {
    console.log("DB Error", err);
  }
};

startServer();
