import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import dns from "dns";
import path from "path"; // Added for file paths
import { fileURLToPath } from "url"; // Added for ES Module directory support
import notificationRoutes from "./routes/notificationRoutes.js";
import assignmentRoutes from "./routes/assignments.js";
import User from "./models/User.js";
import Question from "./models/Question.js";
import Result from "./models/Result.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
// --- Static Folder Setup (Zaroori for File Uploads) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());
// Ye line teacher ki upload ki hui files (PDF/Images) ko access karne ke liye hai
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); 

// ================= ROUTES =================
app.use("/api/assignments", assignmentRoutes);
app.use("/api/notifications", notificationRoutes);

// ================= AUTH ROUTES =================

// 🔥 REGISTER
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    console.log("Register Data:", req.body);

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exist = await User.findOne({ email });

    if (exist) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      name, // ✅ FIXED
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

// 🔥 LOGIN
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

// ================= VERIFY TOKEN =================
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

// ================= QUESTIONS =================
app.get("/api/questions", verifyToken, async (req, res) => {
  const questions = await Question.find();
  res.json(questions);
});

// ================= SUBMIT EXAM =================
app.post("/api/results/submit", verifyToken, async (req, res) => {
  try {
    const { studentName, score, total, percentage } = req.body;

    const result = new Result({
      userId: req.user.userId,
      score,
      total,
      percentage,
      studentName
    });

    await result.save();

    res.json({ message: "Result Saved ✅" });

  } catch (err) {
    res.status(500).json({ message: "Error ❌" });
  }
});

// ================= RESULTS =================
app.get("/my-results", verifyToken, async (req, res) => {
  const results = await Result.find({ userId: req.user.userId });
  res.json(results);
});

// ================= START SERVER AFTER DB =================
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected ✅");

    app.listen(5000, () => {
      console.log("Server Running on 5000 🚀");
    });

  } catch (err) {
    console.log("DB Error ❌", err);
  }
};

app.post("/api/results/submit", async (req, res) => {
  try {
    const result = new Result(req.body);
    await result.save();
    res.json({ message: "Saved ✅" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error ❌" });
  }
});

app.get("/api/results", async (req, res) => {
  const data = await Result.find();
  res.json(data);
});
startServer();