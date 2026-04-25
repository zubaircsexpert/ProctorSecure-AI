import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import dns from "dns";
import path from "path";
import { fileURLToPath } from "url";

import notificationRoutes from "./routes/notificationRoutes.js";
import assignmentRoutes from "./routes/assignments.js";

import User from "./models/User.js";
import Question from "./models/Question.js";
import Result from "./models/Result.js";
import Exam from "./models/Exam.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/assignments", assignmentRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.send("Backend Running ✅");
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exist = await User.findOne({ email });
    if (exist) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashed,
      role: role || "student",
    });

    await newUser.save();
    res.json({ message: "Registered Successfully ✅" });
  } catch (err) {
    console.log("REGISTER ERROR:", err);
    res.status(500).json({ message: "Server Error ❌" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).json({ message: "Login Error ❌" });
  }
});

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

const buildExamPayload = (exam) => {
  return {
    ...exam.toObject(),
    canStart: exam.status === "live" && exam.accessGranted === true,
  };
};

// ================= EXAMS =================

app.post("/api/exams/add", verifyToken, async (req, res) => {
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
    res.json({ message: "Exam Scheduled ✅", exam: buildExamPayload(exam) });
  } catch (err) {
    console.log("ADD EXAM ERROR:", err);
    res.status(500).json({ message: "Error ❌" });
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

app.put("/api/exams/update-status/:id", verifyToken, async (req, res) => {
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
    });

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    res.json({ message: "Exam Updated ✅", exam: buildExamPayload(exam) });
  } catch (err) {
    console.log("UPDATE EXAM ERROR:", err);
    res.status(500).json({ message: "Error ❌" });
  }
});

app.delete("/api/exams/delete/:id", verifyToken, async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    await Question.deleteMany({ examId: req.params.id });

    res.json({ message: "Exam deleted ✅" });
  } catch (err) {
    console.log("DELETE EXAM ERROR:", err);
    res.status(500).json({ message: "Error ❌" });
  }
});

// ================= QUESTIONS =================

app.post("/api/questions/add", verifyToken, async (req, res) => {
  try {
    const { examId, questionText, question, options, correctAnswer } = req.body;

    const finalQuestionText = questionText || question;
    const cleanOptions = Array.isArray(options)
      ? options.map((item) => String(item).trim()).filter(Boolean)
      : [];

    if (!examId || !finalQuestionText || cleanOptions.length < 2 || !correctAnswer) {
      return res.status(400).json({ message: "Invalid question data ❌" });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found ❌" });
    }

    const newQuestion = new Question({
      examId,
      questionText: finalQuestionText,
      options: cleanOptions,
      correctAnswer,
    });

    await newQuestion.save();
    res.json({ message: "Question Added ✅", question: newQuestion });
  } catch (err) {
    console.log("ADD QUESTION ERROR:", err);
    res.status(500).json({ message: "Error ❌" });
  }
});

app.get("/api/questions", verifyToken, async (req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: 1 });
    res.json(questions);
  } catch (err) {
    console.log("FETCH QUESTIONS ERROR:", err);
    res.status(500).json({ message: "Error fetching questions ❌" });
  }
});

app.get("/api/questions/:examId", verifyToken, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);

    if (!exam) {
      return res.status(404).json({ message: "Exam not found ❌" });
    }

    const canStart = exam.status === "live" && exam.accessGranted === true;

    if (!canStart) {
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

// ================= RESULTS =================

app.post("/api/results/submit", verifyToken, async (req, res) => {
  try {
    const result = new Result({
      ...req.body,
      userId: req.user.userId,
    });

    await result.save();
    res.json({ message: "Result Saved ✅", result });
  } catch (err) {
    console.log("RESULT SAVE ERROR:", err);
    res.status(500).json({ message: "Error ❌" });
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
    res.status(500).json({ message: "Error ❌" });
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
    res.status(500).json({ message: "Error ❌" });
  }
});

app.get("/api/results", verifyToken, async (req, res) => {
  try {
    const data = await Result.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    console.log("RESULTS ERROR:", err);
    res.status(500).json({ message: "Error ❌" });
  }
});

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected ✅");

    app.listen(port, () => {
      console.log(`Server Running on ${port} 🚀`);
    });
  } catch (err) {
    console.log("DB Error ❌", err);
  }
};

startServer();
