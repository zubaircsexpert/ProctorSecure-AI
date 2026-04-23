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
import Exam from "./models/Exam.js"; // ✅ NEW

dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// ================= FILE PATH =================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= ROUTES =================
app.use("/api/assignments", assignmentRoutes);
app.use("/api/notifications", notificationRoutes);

// ================= AUTH =================

// REGISTER
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
      role: role || "student"
    });

    await newUser.save();

    res.json({ message: "Registered Successfully ✅" });

  } catch (err) {
    console.log("REGISTER ERROR:", err);
    res.status(500).json({ message: "Server Error ❌" });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).json({ message: "Login Error ❌" });
  }
});

// ================= TOKEN =================
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ================= EXAMS (NEW) =================

// ➕ Add Exam (Teacher sets time)
app.post("/api/exams/add", verifyToken, async (req, res) => {
  try {
    const { title, course, duration } = req.body;

    if (!title || !duration) {
      return res.status(400).json({ message: "Title & duration required" });
    }

    const exam = new Exam({ title, course, duration });
    await exam.save();

    res.json({ message: "Exam Created ✅", exam });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error ❌" });
  }
});

// 📥 Get All Exams
app.get("/api/exams/all", verifyToken, async (req, res) => {
  try {
    const exams = await Exam.find();
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: "Error ❌" });
  }
});

// ================= QUESTIONS =================

// ➕ Add MCQ (Teacher)
app.post("/api/questions/add", verifyToken, async (req, res) => {
  try {
    const { examId, question, options, correctAnswer } = req.body;

    if (!examId || !question || !options || !correctAnswer) {
      return res.status(400).json({ message: "All fields required" });
    }

    const newQuestion = new Question({
      examId,
      question,
      options,
      correctAnswer
    });

    await newQuestion.save();

    res.json({ message: "Question Added ✅" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error ❌" });
  }
});

// 📥 Get Questions by Exam
app.get("/api/questions/:examId", verifyToken, async (req, res) => {
  try {
    const questions = await Question.find({
      examId: req.params.examId
    });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: "Error ❌" });
  }
});

// ================= RESULTS =================

// Submit Result
app.post("/api/results/submit", verifyToken, async (req, res) => {
  try {
    const { studentName, score, total, percentage } = req.body;

    const result = new Result({
      userId: req.user.userId,
      studentName,
      score,
      total,
      percentage
    });

    await result.save();

    res.json({ message: "Result Saved ✅" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error ❌" });
  }
});

// Get My Results
app.get("/api/results/my", verifyToken, async (req, res) => {
  try {
    const results = await Result.find({
      userId: req.user.userId
    });
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Error ❌" });
  }
});

// Get All Results (Admin/Teacher)
app.get("/api/results", verifyToken, async (req, res) => {
  try {
    const data = await Result.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error ❌" });
  }
});

// ================= SERVER =================
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