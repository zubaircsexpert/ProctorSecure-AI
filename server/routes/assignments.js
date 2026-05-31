import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Assignment from "../models/Assignment.js";

const router = express.Router();

// --- GET CURRENT DIRECTORY ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- SETUP DIRECTORIES ---
const uploadsDir = path.join(__dirname, "..", "uploads");
const assignmentFilesDir = path.join(uploadsDir, "assignment-files");
const assignmentSubmissionsDir = path.join(uploadsDir, "assignment-submissions");

// --- AUTOMATIC FOLDER CREATION ---
[uploadsDir, assignmentFilesDir, assignmentSubmissionsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// --- MULTER SETUP FOR TEACHER FILES ---
const teacherFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, assignmentFilesDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

// --- MULTER SETUP FOR STUDENT SUBMISSIONS ---
const studentSubmissionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, assignmentSubmissionsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const uploadTeacherFile = multer({ storage: teacherFileStorage });
const uploadStudentFile = multer({ storage: studentSubmissionStorage });

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
router.post("/add", uploadTeacherFile.single("file"), async (req, res) => {
  try {
    const fileUrl = req.file ? `assignment-files/${req.file.filename}` : "";
    
    const newAssignment = new Assignment({
      title: req.body.title,
      dueDate: req.body.dueDate,
      description: req.body.description || "",
      fileUrl: fileUrl,
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
router.post("/upload", uploadStudentFile.single("file"), async (req, res) => {
  try {
    const { assignmentId, studentName } = req.body;

    if (!assignmentId) {
      return res.status(400).json({ message: "Assignment id is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please attach a file" });
    }

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    assignment.submissionUrl = `assignment-submissions/${req.file.filename}`;
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

    if (!assignmentId) {
      return res.status(400).json({ message: "Assignment id is required" });
    }

    if (!String(marks || "").trim()) {
      return res.status(400).json({ message: "Marks are required" });
    }

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
