import express from "express";
import Exam from "../models/Exam.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware (Copy this from your index.js)
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

// ➕ Add Exam (Teacher)
router.post("/add", verifyToken, async (req, res) => {
    try {
        const { title, course, duration, examKey, startTime, endTime } = req.body;
        const exam = new Exam({ title, course, duration, examKey, startTime, endTime });
        await exam.save();
        res.json({ message: "Exam Scheduled ✅", exam });
    } catch (err) {
        res.status(500).json({ message: "Error ❌" });
    }
});

// 🔑 Verify Exam (Student)
router.post("/verify", verifyToken, async (req, res) => {
    try {
        const { examId, enteredKey } = req.body;
        const exam = await Exam.findById(examId);
        if (!exam) return res.status(404).json({ message: "Exam not found" });

        if (exam.examKey !== enteredKey) return res.status(400).json({ message: "Invalid Key ❌" });

        const now = new Date();
        if (now < new Date(exam.startTime)) return res.status(400).json({ message: "Exam not started yet." });
        if (now > new Date(exam.endTime)) return res.status(400).json({ message: "Exam expired." });

        res.json({ message: "Access Granted ✅", exam });
    } catch (err) {
        res.status(500).json({ message: "Error ❌" });
    }
});

// 📥 Get All Exams
router.get("/all", verifyToken, async (req, res) => {
    try {
        const exams = await Exam.find();
        res.json(exams);
    } catch (err) {
        res.status(500).json({ message: "Error ❌" });
    }
});

export default router;