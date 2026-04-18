import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Assignment from "../models/Assignment.js";

const router = express.Router();

// --- AUTOMATIC FOLDER CREATION ---
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Uploads folder created automatically! ✅");
}

// --- MULTER SETUP ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// =============================
// 1. Get All Assignments
// =============================
router.get("/all", async (req, res) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    res.status(200).json(assignments);
  } catch (err) {
    res.status(500).json({ message: "Error fetching assignments", error: err });
  }
});

// =============================
// 2. Add New Assignment (Teacher)
// =============================
router.post("/add", upload.single("file"), async (req, res) => {
  try {
    const newAssignment = new Assignment({
      title: req.body.title,
      dueDate: req.body.dueDate,
      description: req.body.description || "",
      fileUrl: req.file ? req.file.filename : "",
      status: "Pending",
      marks: "-",
      submissionUrl: "",
      studentName: "",
    });

    const savedAssignment = await newAssignment.save();
    res.status(201).json(savedAssignment);
  } catch (err) {
    console.error("SAVE ERROR:", err);
    res.status(500).json({ message: "Failed to create assignment", error: err });
  }
});

// =============================
// 3. Delete Assignment
// =============================
router.delete("/delete/:id", async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.status(200).json("Assignment deleted");
  } catch (err) {
    res.status(500).json(err);
  }
});

// =============================
// 4. STUDENT SUBMIT ASSIGNMENT ✅
// =============================
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { assignmentId, studentName } = req.body;

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    assignment.submissionUrl = req.file.filename;
    assignment.status = "Submitted";
    assignment.studentName = studentName;

    await assignment.save();

    res.json({ message: "Assignment Submitted Successfully ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed ❌" });
  }
});

// =============================
// 5. TEACHER GIVE MARKS ✅
// =============================
router.post("/give-marks", async (req, res) => {
  try {
    const { assignmentId, marks } = req.body;

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    assignment.marks = marks;
    assignment.status = "Checked";

    await assignment.save();

    res.json({ message: "Marks Added Successfully ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding marks ❌" });
  }
});

export default router;