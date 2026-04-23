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
import examRoutes from "./routes/examRoutes.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// --- Static Folder Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= ROUTES =================
app.use("/api/assignments", assignmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/exams", examRoutes);

// ================= AUTH ROUTES =================
// ================= EXAMS (TEST) =================
app.get("/", (req, res) => {
  res.send("Backend Running ✅");
});


app.post("/api/exams/add", (req, res) => {
  res.send("Exam route working ✅");
});
// REGISTER
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    console.log("Register Data:", req.body);

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

// LOGIN
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

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

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

// ================= EXAMS =================
// Added because Exam.js calls: GET /api/exams/all
app.get("/api/exams/all", async (req, res) => {
  try {
    const questions = await Question.find().lean();

    if (!questions.length) {
      return res.json([]);
    }

    const examMap = new Map();

    questions.forEach((q) => {
      const examId =
        q.examId?.toString() ||
        q.exam?._id?.toString() ||
        q.exam?.toString() ||
        "default-exam";

      const title =
        q.examTitle ||
        q.subject ||
        q.title ||
        "ProctorSecure Final Assessment";

      const duration = q.duration || 5;

      if (!examMap.has(examId)) {
        examMap.set(examId, {
          _id: examId,
          title,
          duration,
        });
      }
    });

    res.json(Array.from(examMap.values()));
  } catch (err) {
    console.log("FETCH EXAMS ERROR:", err);
    res.status(500).json({ message: "Failed to load exams" });
  }
});

// ================= QUESTIONS =================
app.get("/api/questions", verifyToken, async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    console.log("FETCH QUESTIONS ERROR:", err);
    res.status(500).json({ message: "Error fetching questions ❌" });
  }
});

// Added because Exam.js calls: GET /api/questions/:examId
app.get("/api/questions/:examId", async (req, res) => {
  try {
    const { examId } = req.params;
    let questions = [];

    if (!examId || examId === "default-exam") {
      questions = await Question.find();
    } else {
      const filters = [
        { examId: examId },
        { exam: examId },
        { "exam._id": examId },
      ];

      if (mongoose.Types.ObjectId.isValid(examId)) {
        const objectId = new mongoose.Types.ObjectId(examId);
        filters.push({ examId: objectId });
        filters.push({ exam: objectId });
        filters.push({ "exam._id": objectId });
      }

      questions = await Question.find({ $or: filters });

      if (!questions.length) {
        questions = await Question.find();
      }
    }

    res.json(questions);
  } catch (err) {
    console.log("FETCH EXAM QUESTIONS ERROR:", err);
    res.status(500).json({ message: "Failed to load questions" });
  }
});

// ================= SUBMIT EXAM =================
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

// ================= RESULTS =================
app.get("/my-results", verifyToken, async (req, res) => {
  try {
    const results = await Result.find({ userId: req.user.userId });
    res.json(results);
  } catch (err) {
    console.log("MY RESULTS ERROR:", err);
    res.status(500).json({ message: "Error ❌" });
  }
});

app.get("/api/results", async (req, res) => {
  try {
    const data = await Result.find();
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error ❌" });
  }
});

// ================= START SERVER AFTER DB =================
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
