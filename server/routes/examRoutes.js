import express from "express";
import Exam from "../models/Exam.js"; // Make sure model exists

const router = express.Router();

// Get all exams for Student Panel
router.get("/all", async (req, res) => {
    try {
        const exams = await Exam.find();
        res.status(200).json(exams);
    } catch (err) {
        res.status(500).json({ message: "Fetch failed", error: err });
    }
});

// Add new exam course from Teacher Panel
router.post("/add", async (req, res) => {
    try {
        const newExam = new Exam({
            course: req.body.course,
            title: req.body.title,
            syllabus: req.body.syllabus
        });
        const savedExam = await newExam.save();
        res.status(201).json(savedExam);
    } catch (err) {
        res.status(500).json({ message: "Save failed", error: err });
    }
});

export default router;