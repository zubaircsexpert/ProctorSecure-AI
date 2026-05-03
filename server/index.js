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

import User from "./models/User.js";
import Classroom from "./models/Classroom.js";
import Question from "./models/Question.js";
import Result from "./models/Result.js";
import Exam from "./models/Exam.js";
import Assignment from "./models/Assignment.js";
import Submission from "./models/Submission.js";
import Notification from "./models/Notification.js";
import PaperCheck from "./models/PaperCheck.js";
import StudyResource from "./models/StudyResource.js";
import SystemCheck from "./models/SystemCheck.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const TEACHER_ACCESS_KEY =
  process.env.TEACHER_ACCESS_KEY || "Teacher-@9080#$@";
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || "admin@proctor.ai").trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ADMIN-PROCTOR-2026";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");
const paperChecksDir = path.join(uploadsDir, "paper-checks");
const studentCardsDir = path.join(uploadsDir, "student-cards");
const teacherFilesDir = path.join(uploadsDir, "assignment-files");
const studentSubmissionsDir = path.join(uploadsDir, "assignment-submissions");
const studyVaultDir = path.join(uploadsDir, "study-vault");
const tutorUploadsDir = path.join(uploadsDir, "ai-tutor");

[uploadsDir, paperChecksDir, studentCardsDir, teacherFilesDir, studentSubmissionsDir, studyVaultDir, tutorUploadsDir].forEach(
  (directory) => fs.mkdirSync(directory, { recursive: true })
);

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(uploadsDir));

const normalizeText = (value) => String(value || "").trim();
const toRelativeUploadPath = (absolutePath) =>
  path.relative(uploadsDir, absolutePath).replace(/\\/g, "/");

const sanitizeFileName = (name) =>
  normalizeText(name || "file")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");

const createDiskStorage = (destination) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${sanitizeFileName(file.originalname)}`);
    },
  });

const profileUpload = multer({ storage: createDiskStorage(studentCardsDir) });
const assignmentUpload = multer({ storage: createDiskStorage(teacherFilesDir) });
const submissionUpload = multer({
  storage: createDiskStorage(studentSubmissionsDir),
});
const paperCheckUpload = multer({
  storage: createDiskStorage(paperChecksDir),
});
const studyVaultUpload = multer({ storage: createDiskStorage(studyVaultDir) });
const tutorUpload = multer({ storage: createDiskStorage(tutorUploadsDir) });

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

const makeInviteCode = () =>
  `CLS-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now()
    .toString()
    .slice(-4)}`;

const buildClassroomLabel = (classroom) => {
  const primary =
    normalizeText(classroom.program) ||
    normalizeText(classroom.name) ||
    normalizeText(classroom.department) ||
    "Classroom";
  const extras = [];

  if (normalizeText(classroom.section)) {
    extras.push(`Section ${normalizeText(classroom.section)}`);
  }

  if (normalizeText(classroom.semester)) {
    extras.push(`Semester ${normalizeText(classroom.semester)}`);
  }

  return [primary, ...extras].join(" | ");
};

const buildClassroomPayload = (classroom) => ({
  id: classroom._id,
  name: classroom.name,
  label: buildClassroomLabel(classroom),
  department: classroom.department || "",
  program: classroom.program || "",
  section: classroom.section || "",
  semester: classroom.semester || "",
  description: classroom.description || "",
  inviteCode: classroom.inviteCode || "",
  teacherId: classroom.teacherId || null,
  teacherName: classroom.teacherName || "",
});

const buildUserPayload = (user, managedClassrooms = []) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  approvalStatus: user.approvalStatus || "approved",
  department: user.department || "",
  classroomId: user.classroomId || null,
  classroomName: user.classroomName || "",
  teacherId: user.teacherId || null,
  teacherName: user.teacherName || "",
  rollNumber: user.rollNumber || "",
  studentIdCardUrl: user.studentIdCardUrl || "",
  managedClassrooms: managedClassrooms.map(buildClassroomPayload),
});

const buildExamPayload = (exam) => ({
  ...exam.toObject(),
  canStart: exam.status === "live" && exam.accessGranted === true,
});

const formatTutorContext = ({ user, assignments, results, resources }) => {
  const assignmentSummary = assignments
    .slice(0, 5)
    .map((assignment) => {
      const submission = assignment.mySubmission || null;
      return `${assignment.title} | due ${assignment.dueDate || "N/A"} | status ${
        submission?.status || assignment.status || "Pending"
      } | feedback ${submission?.feedback || "none"}`;
    })
    .join("\n");
  const resultSummary = results
    .slice(0, 6)
    .map(
      (result) =>
        `${result.testName || "Assessment"} | ${result.assessmentType || "exam"} | ${
          result.percentage || 0
        }% | suspicious ${result.suspiciousScore || result.cheatingPercent || 0}%`
    )
    .join("\n");
  const resourceSummary = resources
    .slice(0, 5)
    .map((resource) => `${resource.title} | ${resource.resourceType || "notes"}`)
    .join("\n");

  return [
    `Student: ${user.name}`,
    `Classroom: ${user.classroomName || "N/A"}`,
    `Teacher: ${user.teacherName || "N/A"}`,
    `Recent assignments:\n${assignmentSummary || "No assignments found."}`,
    `Recent results:\n${resultSummary || "No results found."}`,
    `Study vault resources:\n${resourceSummary || "No study resources found."}`,
  ].join("\n\n");
};

const callOpenAiTutor = async ({ question, context, file }) => {
  if (!process.env.OPENAI_API_KEY) return null;

  const content = [
    {
      type: "text",
      text: `${context}\n\nStudent question:\n${question}\n\nAnswer like a helpful AI tutor. Give direct explanation, steps, examples, and an action plan. If an uploaded image is provided, analyze it for the student.`,
    },
  ];

  if (file?.mimetype?.startsWith("image/")) {
    const imageBase64 = fs.readFileSync(file.path).toString("base64");
    content.push({
      type: "image_url",
      image_url: {
        url: `data:${file.mimetype};base64,${imageBase64}`,
      },
    });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TUTOR_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are ProctorSecure AI Tutor. Be clear, practical, student-friendly, and grounded in the provided classroom context. Do not claim grades are official.",
        },
        { role: "user", content },
      ],
      temperature: 0.45,
      max_tokens: 900,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log("OPENAI TUTOR ERROR:", errorText);
    return null;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
};

const buildLocalTutorAnswer = ({ user, question, assignments, results, resources, file }) => {
  const lower = question.toLowerCase();
  const latestAssignment = assignments[0];
  const latestResult = results[0];
  const weakResults = results
    .filter((result) => Number(result.percentage || 0) < 60)
    .slice(0, 3)
    .map((result) => result.testName || "Assessment");
  const relevantResource = resources.find((resource) =>
    lower.includes(String(resource.title || "").toLowerCase().slice(0, 8))
  );

  const lines = [
    `Hi ${user.name || "there"}, I checked your classroom context and prepared a focused answer.`,
  ];

  if (file) {
    lines.push(
      file.mimetype?.startsWith("image/")
        ? "I received your image. If OPENAI_API_KEY is configured, the system analyzes it visually; otherwise use the steps below with the visible question/text."
        : `I received your file: ${file.originalname}. For PDFs/docs, describe the exact confusing question and I will guide you step by step.`
    );
  }

  if (lower.includes("assignment") || lower.includes("homework") || lower.includes("solve")) {
    lines.push(
      `Assignment focus: ${latestAssignment?.title || "No active assignment found"}. First write the required output, then solve one part at a time, then compare with teacher instructions before uploading.`
    );
  }

  if (lower.includes("quiz") || lower.includes("mcq") || lower.includes("exam")) {
    lines.push(
      `Assessment plan: revise the concept, attempt 10 MCQs, mark every wrong answer, then repeat only the weak topic. Latest score: ${latestResult?.percentage || 0}%.`
    );
  }

  if (weakResults.length) {
    lines.push(`Weak area signal: your lower attempts include ${weakResults.join(", ")}. Spend the next session on these topics before broad revision.`);
  }

  if (relevantResource) {
    lines.push(`Study Vault match: open "${relevantResource.title}" first, then ask me the exact paragraph/question you do not understand.`);
  } else if (resources.length) {
    lines.push(`Study Vault has ${resources.length} resource(s). Start with "${resources[0].title}" if your question is from class material.`);
  }

  lines.push(
    "Step-by-step method:",
    "1. Identify the topic and write what is being asked.",
    "2. Solve the smallest part first and check units/options.",
    "3. Explain the answer in your own words.",
    "4. If still stuck, send the exact question or upload a clear image."
  );

  return lines.join("\n\n");
};

const signToken = (user) =>
  jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

const getDbUser = async (userId) => User.findById(userId);

const ensureTeacherWorkspace = async (teacher) => {
  if (!teacher || teacher.role !== "teacher") {
    return [];
  }

  let classrooms = await Classroom.find({
    teacherId: teacher._id,
    active: true,
  }).sort({ createdAt: 1 });

  if (!classrooms.length) {
    const newClassroom = await Classroom.create({
      teacherId: teacher._id,
      teacherName: teacher.name,
      name:
        normalizeText(teacher.classroomName) ||
        normalizeText(teacher.department) ||
        "Primary Class",
      department: normalizeText(teacher.department) || "General Department",
      program:
        normalizeText(teacher.classroomName) ||
        normalizeText(teacher.department) ||
        "Primary Class",
      section: "A",
      semester: "",
      description: "Default classroom created for teacher workspace.",
      inviteCode: makeInviteCode(),
    });

    classrooms = [newClassroom];
  }

  const primaryClassroom = classrooms[0];
  const nextManagedIds = classrooms.map((classroom) => classroom._id);
  let changed = false;

  if (!teacher.classroomId || String(teacher.classroomId) !== String(primaryClassroom._id)) {
    teacher.classroomId = primaryClassroom._id;
    changed = true;
  }

  const nextLabel = buildClassroomLabel(primaryClassroom);
  if (teacher.classroomName !== nextLabel) {
    teacher.classroomName = nextLabel;
    changed = true;
  }

  if (
    JSON.stringify((teacher.managedClassrooms || []).map(String)) !==
    JSON.stringify(nextManagedIds.map(String))
  ) {
    teacher.managedClassrooms = nextManagedIds;
    changed = true;
  }

  if (changed) {
    await teacher.save();
  }

  return classrooms;
};

const verifyTeacher = async (req, res, next) => {
  try {
    const user = await getDbUser(req.user?.userId);

    if (!user || user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can do this action." });
    }

    req.dbUser = user;
    next();
  } catch (err) {
    console.log("VERIFY TEACHER ERROR:", err);
    res.status(500).json({ message: "Role verification failed." });
  }
};

const verifyAdmin = async (req, res, next) => {
  try {
    const user = await getDbUser(req.user?.userId);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can do this action." });
    }

    req.dbUser = user;
    next();
  } catch (err) {
    console.log("VERIFY ADMIN ERROR:", err);
    res.status(500).json({ message: "Admin verification failed." });
  }
};

const verifyStaff = async (req, res, next) => {
  try {
    const user = await getDbUser(req.user?.userId);

    if (!user || !["teacher", "admin"].includes(user.role)) {
      return res.status(403).json({ message: "Only staff can do this action." });
    }

    req.dbUser = user;
    next();
  } catch (err) {
    console.log("VERIFY STAFF ERROR:", err);
    res.status(500).json({ message: "Staff verification failed." });
  }
};

const verifyApprovedStudent = async (req, res, next) => {
  try {
    const user = await getDbUser(req.user?.userId);

    if (!user || user.role !== "student") {
      return res.status(403).json({ message: "Only students can do this action." });
    }

    if (user.approvalStatus !== "approved") {
      return res.status(403).json({
        message:
          user.approvalStatus === "pending"
            ? "Your account is waiting for teacher approval."
            : "Your student account access is currently restricted.",
      });
    }

    req.dbUser = user;
    next();
  } catch (err) {
    console.log("VERIFY STUDENT ERROR:", err);
    res.status(500).json({ message: "Student verification failed." });
  }
};

const findTeacherClassroom = async (teacherId, classroomId) => {
  if (!classroomId) return null;

  return Classroom.findOne({
    _id: classroomId,
    teacherId,
    active: true,
  });
};

app.get("/", (req, res) => {
  res.send("Backend Running");
});

app.get("/api/auth/bootstrap", async (req, res) => {
  try {
    const classrooms = await Classroom.find({ active: true }).sort({
      department: 1,
      program: 1,
      section: 1,
      createdAt: 1,
    }).lean();

    res.json({
      teacherPortalKeyRequired: true,
      classrooms: classrooms.map(buildClassroomPayload),
    });
  } catch (err) {
    console.log("AUTH BOOTSTRAP ERROR:", err);
    res.status(500).json({ message: "Failed to load registration options." });
  }
});

app.get("/api/classrooms/public", async (req, res) => {
  try {
    const classrooms = await Classroom.find({ active: true }).sort({
      department: 1,
      program: 1,
      section: 1,
      createdAt: 1,
    }).lean();
    res.json(classrooms.map(buildClassroomPayload));
  } catch (err) {
    console.log("PUBLIC CLASSROOMS ERROR:", err);
    res.status(500).json({ message: "Failed to load classrooms." });
  }
});

app.post(
  "/api/auth/register",
  profileUpload.single("studentIdCard"),
  async (req, res) => {
    try {
      const role = normalizeText(req.body.role || "student").toLowerCase();
      const name = normalizeText(req.body.name);
      const email = normalizeText(req.body.email).toLowerCase();
      const password = String(req.body.password || "");

      if (!name || !email || !password) {
        return res.status(400).json({ message: "All required fields must be filled." });
      }

      if (!["student", "teacher"].includes(role)) {
        return res.status(400).json({ message: "Invalid account role." });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      if (role === "teacher") {
        const teacherAccessKey = normalizeText(req.body.teacherAccessKey);
        const department = normalizeText(req.body.department);
        const classroomName = normalizeText(req.body.classroomName);
        const program = normalizeText(req.body.program);
        const section = normalizeText(req.body.section);
        const semester = normalizeText(req.body.semester);
        const description = normalizeText(req.body.description);

        if (teacherAccessKey !== TEACHER_ACCESS_KEY) {
          return res.status(400).json({
            message: "Teacher access key invalid. Teacher onboarding denied.",
          });
        }

        if (!department || !classroomName) {
          return res.status(400).json({
            message: "Department and primary classroom are required for teachers.",
          });
        }

        const teacher = new User({
          name,
          email,
          password: hashedPassword,
          role: "teacher",
          approvalStatus: "approved",
          department,
        });

        await teacher.save();

        const classroom = await Classroom.create({
          teacherId: teacher._id,
          teacherName: teacher.name,
          name: classroomName,
          department,
          program: program || classroomName,
          section: section || "A",
          semester,
          description,
          inviteCode: makeInviteCode(),
        });

        teacher.classroomId = classroom._id;
        teacher.classroomName = buildClassroomLabel(classroom);
        teacher.managedClassrooms = [classroom._id];
        await teacher.save();

        return res.status(201).json({
          message: "Teacher account created successfully.",
          user: buildUserPayload(teacher, [classroom]),
          classroom: buildClassroomPayload(classroom),
        });
      }

      const classroomId = normalizeText(req.body.classroomId);
      const rollNumber = normalizeText(req.body.rollNumber);

      if (!classroomId || !rollNumber) {
        return res.status(400).json({
          message: "Class selection and roll number are required for students.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "Student ID card image is required for teacher approval.",
        });
      }

      const classroom = await Classroom.findOne({
        _id: classroomId,
        active: true,
      });

      if (!classroom) {
        return res.status(404).json({ message: "Selected classroom not found." });
      }

      const teacher = await User.findById(classroom.teacherId);

      const student = new User({
        name,
        email,
        password: hashedPassword,
        role: "student",
        approvalStatus: "pending",
        department: classroom.department || "",
        classroomId: classroom._id,
        classroomName: buildClassroomLabel(classroom),
        teacherId: classroom.teacherId,
        teacherName: teacher?.name || classroom.teacherName || "",
        rollNumber,
        studentIdCardUrl: toRelativeUploadPath(req.file.path),
      });

      await student.save();

      await Notification.create({
        title: "New student approval request",
        message: `${student.name} (${rollNumber}) requested access to ${buildClassroomLabel(
          classroom
        )}. Review the request in the teacher approval queue.`,
        type: "approval",
        priority: "high",
        audience: "teachers",
        teacherId: classroom.teacherId,
        classroomId: classroom._id,
        classroomName: buildClassroomLabel(classroom),
        sender: student.name,
      });

      res.status(201).json({
        message: "Student registration submitted. Wait for teacher approval.",
        approvalStatus: "pending",
      });
    } catch (err) {
      console.log("REGISTER ERROR:", err);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = normalizeText(req.body.email).toLowerCase();
    const password = String(req.body.password || "");
    const portalRole = normalizeText(req.body.portalRole).toLowerCase();

    let user = await User.findOne({ email });
    if (!user && portalRole === "admin" && email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      user = await User.create({
        name: "System Admin",
        email: ADMIN_EMAIL,
        password: await bcrypt.hash(ADMIN_PASSWORD, 10),
        role: "admin",
        approvalStatus: "approved",
      });
    }

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (portalRole && portalRole !== user.role) {
      return res.status(403).json({
        message:
          user.role === "teacher"
            ? "This account belongs to the teacher portal."
            : user.role === "admin"
            ? "This account belongs to the admin portal."
            : "This account belongs to the student portal.",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Wrong password" });
    }

    if (user.role === "student" && user.approvalStatus !== "approved") {
      return res.status(403).json({
        message:
          user.approvalStatus === "pending"
            ? "Teacher approval is still pending for this student account."
            : "This student account was not approved yet. Contact your teacher.",
      });
    }

    const managedClassrooms =
      user.role === "teacher" ? await ensureTeacherWorkspace(user) : [];

    res.json({
      token: signToken(user),
      user: buildUserPayload(user, managedClassrooms),
    });
  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).json({ message: "Login Error" });
  }
});

app.get("/api/auth/me", verifyToken, async (req, res) => {
  try {
    const user = await getDbUser(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const managedClassrooms =
      user.role === "teacher" ? await ensureTeacherWorkspace(user) : [];

    res.json({ user: buildUserPayload(user, managedClassrooms) });
  } catch (err) {
    console.log("AUTH ME ERROR:", err);
    res.status(500).json({ message: "Failed to load profile." });
  }
});

app.get("/api/classrooms/my", verifyToken, async (req, res) => {
  try {
    const user = await getDbUser(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "teacher") {
      const classrooms = await ensureTeacherWorkspace(user);
      return res.json(classrooms.map(buildClassroomPayload));
    }

    if (!user.classroomId) {
      return res.json([]);
    }

    const classroom = await Classroom.findById(user.classroomId);
    res.json(classroom ? [buildClassroomPayload(classroom)] : []);
  } catch (err) {
    console.log("MY CLASSROOMS ERROR:", err);
    res.status(500).json({ message: "Failed to load classrooms." });
  }
});

app.post("/api/classrooms", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const teacher = req.dbUser;
    const name = normalizeText(req.body.name);
    const department = normalizeText(req.body.department) || teacher.department;
    const program = normalizeText(req.body.program) || name;
    const section = normalizeText(req.body.section) || "A";
    const semester = normalizeText(req.body.semester);
    const description = normalizeText(req.body.description);

    if (!name || !department) {
      return res.status(400).json({
        message: "Classroom name and department are required.",
      });
    }

    const classroom = await Classroom.create({
      teacherId: teacher._id,
      teacherName: teacher.name,
      name,
      department,
      program,
      section,
      semester,
      description,
      inviteCode: makeInviteCode(),
    });

    teacher.managedClassrooms = [...(teacher.managedClassrooms || []), classroom._id];
    if (!teacher.classroomId) {
      teacher.classroomId = classroom._id;
      teacher.classroomName = buildClassroomLabel(classroom);
    }
    if (!teacher.department) {
      teacher.department = department;
    }
    await teacher.save();

    res.status(201).json({
      message: "Classroom created successfully.",
      classroom: buildClassroomPayload(classroom),
    });
  } catch (err) {
    console.log("CREATE CLASSROOM ERROR:", err);
    res.status(500).json({ message: "Failed to create classroom." });
  }
});

app.get("/api/teacher/approval-queue", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const students = await User.find({
      role: "student",
      teacherId: req.dbUser._id,
      approvalStatus: "pending",
    }).sort({ createdAt: -1 });

    res.json(students);
  } catch (err) {
    console.log("APPROVAL QUEUE ERROR:", err);
    res.status(500).json({ message: "Failed to load approval queue." });
  }
});

app.put(
  "/api/teacher/approval-queue/:studentId",
  verifyToken,
  verifyTeacher,
  async (req, res) => {
    try {
      const action = normalizeText(req.body.action).toLowerCase();
      const rejectedReason = normalizeText(req.body.rejectedReason);

      if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({ message: "Invalid approval action." });
      }

      const student = await User.findOne({
        _id: req.params.studentId,
        role: "student",
        teacherId: req.dbUser._id,
      });

      if (!student) {
        return res.status(404).json({ message: "Student request not found." });
      }

      student.approvalStatus = action === "approve" ? "approved" : "rejected";
      student.rejectedReason = action === "reject" ? rejectedReason : "";
      await student.save();

      await Notification.create({
        title:
          action === "approve"
            ? "Student approved"
            : "Student request rejected",
        message:
          action === "approve"
            ? `${student.name} is now approved for ${student.classroomName}.`
            : `${student.name}'s registration request was rejected.`,
        type: "approval",
        priority: action === "approve" ? "normal" : "high",
        audience: "teachers",
        teacherId: req.dbUser._id,
        classroomId: student.classroomId || null,
        classroomName: student.classroomName || "",
        sender: req.dbUser.name,
      });

      res.json({
        message:
          action === "approve"
            ? "Student approved successfully."
            : "Student request rejected.",
        student,
      });
    } catch (err) {
      console.log("APPROVAL UPDATE ERROR:", err);
      res.status(500).json({ message: "Failed to update approval request." });
    }
  }
);

app.get("/api/teacher/roster", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const students = await User.find({
      role: "student",
      teacherId: req.dbUser._id,
      approvalStatus: "approved",
    }).sort({ classroomName: 1, name: 1 });

    res.json(students);
  } catch (err) {
    console.log("ROSTER ERROR:", err);
    res.status(500).json({ message: "Failed to load roster." });
  }
});

app.get("/api/notifications/all", verifyToken, async (req, res) => {
  try {
    const user = await getDbUser(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let query = { audience: "all" };

    if (user.role === "teacher") {
      const teacherClassrooms = (user.managedClassrooms || []).map((id) => id);
      query = {
        $or: [
          { audience: "all" },
          { audience: "teachers" },
          { teacherId: user._id },
          { classroomId: { $in: teacherClassrooms } },
        ],
      };
    } else {
      query = {
        $or: [
          { audience: "all" },
          { audience: "all-students" },
          { classroomId: user.classroomId || null },
        ],
      };
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (err) {
    console.log("FETCH NOTIFICATIONS ERROR:", err);
    res.status(500).json({ message: "Notifications fetch failed." });
  }
});

app.post("/api/notifications/add", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const title = normalizeText(req.body.title);
    const message = normalizeText(req.body.message);
    const type = normalizeText(req.body.type) || "general";
    const priority = normalizeText(req.body.priority) || "normal";
    const audience = normalizeText(req.body.audience) || "classroom";
    const classroomId = normalizeText(req.body.classroomId);

    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required." });
    }

    let classroom = null;
    if (audience === "classroom") {
      classroom = await findTeacherClassroom(req.dbUser._id, classroomId || req.dbUser.classroomId);
      if (!classroom) {
        return res.status(400).json({ message: "Valid classroom selection required." });
      }
    }

    const notification = await Notification.create({
      title,
      message,
      type,
      priority,
      audience,
      teacherId: req.dbUser._id,
      classroomId: classroom?._id || null,
      classroomName: classroom ? buildClassroomLabel(classroom) : "",
      sender: req.dbUser.name,
    });

    res.status(201).json(notification);
  } catch (err) {
    console.log("SAVE NOTIFICATION ERROR:", err);
    res.status(500).json({ message: "Failed to save notification." });
  }
});

app.put("/api/notifications/update/:id", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      teacherId: req.dbUser._id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    notification.title = normalizeText(req.body.title || notification.title);
    notification.message = normalizeText(req.body.message || notification.message);
    notification.type = normalizeText(req.body.type || notification.type);
    notification.priority = normalizeText(req.body.priority || notification.priority);
    notification.audience = normalizeText(req.body.audience || notification.audience);

    if (notification.audience === "classroom") {
      const classroom = await findTeacherClassroom(
        req.dbUser._id,
        normalizeText(req.body.classroomId) || notification.classroomId
      );

      if (!classroom) {
        return res.status(400).json({ message: "Valid classroom selection required." });
      }

      notification.classroomId = classroom._id;
      notification.classroomName = buildClassroomLabel(classroom);
    } else {
      notification.classroomId = null;
      notification.classroomName = "";
    }

    await notification.save();
    res.json(notification);
  } catch (err) {
    console.log("UPDATE NOTIFICATION ERROR:", err);
    res.status(500).json({ message: "Update error" });
  }
});

app.delete("/api/notifications/delete/:id", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const deleted = await Notification.findOneAndDelete({
      _id: req.params.id,
      teacherId: req.dbUser._id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Notification not found." });
    }

    res.json({ message: "Notification deleted." });
  } catch (err) {
    console.log("DELETE NOTIFICATION ERROR:", err);
    res.status(500).json({ message: "Delete failed." });
  }
});

app.post("/api/exams/add", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const title = normalizeText(req.body.title);
    const course = normalizeText(req.body.course);
    const syllabus = normalizeText(req.body.syllabus);
    const duration = Number(req.body.duration);
    const examKey = normalizeText(req.body.examKey);
    const assessmentType = normalizeText(req.body.assessmentType) || "exam";
    const instructions = normalizeText(req.body.instructions);
    const responseMode = normalizeText(req.body.responseMode) || "mcq";
    const submissionPrompt = normalizeText(req.body.submissionPrompt);
    const startTime = req.body.startTime || null;
    const endTime = req.body.endTime || null;
    const requiresCamera = req.body.requiresCamera !== false && req.body.requiresCamera !== "false";
    const requiresMicrophone =
      req.body.requiresMicrophone !== false && req.body.requiresMicrophone !== "false";
    const requiresScreenShare =
      req.body.requiresScreenShare !== false && req.body.requiresScreenShare !== "false";

    if (!title || !course || !duration) {
      return res.status(400).json({ message: "Course, title, duration required" });
    }

    const classroom = await findTeacherClassroom(
      req.dbUser._id,
      normalizeText(req.body.classroomId) || req.dbUser.classroomId
    );

    if (!classroom) {
      return res.status(400).json({ message: "Please select a valid classroom." });
    }

    const exam = new Exam({
      teacherId: req.dbUser._id,
      teacherName: req.dbUser.name,
      classroomId: classroom._id,
      classroomName: buildClassroomLabel(classroom),
      title,
      course,
      syllabus,
      duration,
      assessmentType,
      responseMode,
      instructions,
      submissionPrompt,
      requiresCamera,
      requiresMicrophone,
      requiresScreenShare,
      examKey,
      startTime,
      endTime,
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
    const user = await getDbUser(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const filter =
      user.role === "teacher"
        ? { teacherId: user._id }
        : { classroomId: user.classroomId || null };

    const exams = await Exam.find(filter).sort({ createdAt: -1 });
    res.json(exams.map(buildExamPayload));
  } catch (err) {
    console.log("FETCH EXAMS ERROR:", err);
    res.status(500).json({ message: "Failed to load exams" });
  }
});

app.put("/api/exams/update/:id", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const exam = await Exam.findOne({
      _id: req.params.id,
      teacherId: req.dbUser._id,
    });

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    if (req.body.classroomId) {
      const classroom = await findTeacherClassroom(req.dbUser._id, req.body.classroomId);
      if (!classroom) {
        return res.status(400).json({ message: "Selected classroom is invalid." });
      }

      exam.classroomId = classroom._id;
      exam.classroomName = buildClassroomLabel(classroom);
    }

    exam.title = normalizeText(req.body.title || exam.title);
    exam.course = normalizeText(req.body.course || exam.course);
    exam.syllabus = normalizeText(req.body.syllabus || exam.syllabus);
    exam.duration = Number(req.body.duration || exam.duration);
    exam.examKey = normalizeText(req.body.examKey || exam.examKey);
    exam.assessmentType =
      normalizeText(req.body.assessmentType || exam.assessmentType) || "exam";
    exam.responseMode = normalizeText(req.body.responseMode || exam.responseMode) || "mcq";
    exam.instructions = normalizeText(req.body.instructions || exam.instructions);
    exam.submissionPrompt = normalizeText(req.body.submissionPrompt || exam.submissionPrompt);
    if (req.body.requiresCamera !== undefined) {
      exam.requiresCamera = req.body.requiresCamera !== false && req.body.requiresCamera !== "false";
    }
    if (req.body.requiresMicrophone !== undefined) {
      exam.requiresMicrophone =
        req.body.requiresMicrophone !== false && req.body.requiresMicrophone !== "false";
    }
    if (req.body.requiresScreenShare !== undefined) {
      exam.requiresScreenShare =
        req.body.requiresScreenShare !== false && req.body.requiresScreenShare !== "false";
    }
    exam.startTime = req.body.startTime || null;
    exam.endTime = req.body.endTime || null;

    await exam.save();

    res.json({ message: "Exam updated", exam: buildExamPayload(exam) });
  } catch (err) {
    console.log("UPDATE EXAM ERROR:", err);
    res.status(500).json({ message: "Failed to update exam" });
  }
});

app.put("/api/exams/update-status/:id", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const exam = await Exam.findOne({
      _id: req.params.id,
      teacherId: req.dbUser._id,
    });

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    if (req.body.status !== undefined) {
      exam.status = req.body.status;
    }

    if (typeof req.body.accessGranted === "boolean") {
      exam.accessGranted = req.body.accessGranted;
    } else if (req.body.status === "live") {
      exam.accessGranted = true;
    } else if (["scheduled", "closed"].includes(req.body.status)) {
      exam.accessGranted = false;
    }

    if (req.body.startTime !== undefined) {
      exam.startTime = req.body.startTime || null;
    }

    if (req.body.endTime !== undefined) {
      exam.endTime = req.body.endTime || null;
    }

    await exam.save();
    res.json({ message: "Exam status updated", exam: buildExamPayload(exam) });
  } catch (err) {
    console.log("UPDATE EXAM STATUS ERROR:", err);
    res.status(500).json({ message: "Failed to update exam status" });
  }
});

app.delete("/api/exams/delete/:id", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const exam = await Exam.findOneAndDelete({
      _id: req.params.id,
      teacherId: req.dbUser._id,
    });

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
    const examId = normalizeText(req.body.examId);
    const questionText = normalizeText(req.body.questionText || req.body.question);
    const cleanedOptions = Array.isArray(req.body.options)
      ? req.body.options.map((option) => normalizeText(option)).filter(Boolean)
      : [];
    const correctAnswer = normalizeText(req.body.correctAnswer);

    if (!examId || !questionText || cleanedOptions.length < 2 || !correctAnswer) {
      return res.status(400).json({ message: "Invalid question data" });
    }

    const exam = await Exam.findOne({ _id: examId, teacherId: req.dbUser._id });
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    if ((exam.responseMode || "mcq") !== "mcq") {
      return res.status(400).json({
        message: "MCQs can only be added to exams that use MCQ response mode.",
      });
    }

    const newQuestion = new Question({
      examId,
      questionText,
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
    const exams = await Exam.find({ teacherId: req.dbUser._id }).select("_id");
    const examIds = exams.map((exam) => exam._id);
    const questions = await Question.find({ examId: { $in: examIds } }).sort({
      createdAt: 1,
    });
    res.json(questions);
  } catch (err) {
    console.log("FETCH QUESTIONS ERROR:", err);
    res.status(500).json({ message: "Failed to load questions" });
  }
});

app.get("/api/questions/:examId", verifyToken, async (req, res) => {
  try {
    const user = await getDbUser(req.user.userId);
    const exam = await Exam.findById(req.params.examId);

    if (!user || !exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    if (user.role === "teacher") {
      if (String(exam.teacherId) !== String(user._id)) {
        return res.status(403).json({ message: "This exam does not belong to your panel." });
      }
    } else {
      if (String(user.classroomId || "") !== String(exam.classroomId || "")) {
        return res.status(403).json({ message: "You cannot access another classroom exam." });
      }

      if (!(exam.status === "live" && exam.accessGranted === true)) {
        return res.status(403).json({
          message: "Teacher ne abhi exam allow nahi kiya.",
        });
      }
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

app.post("/api/results/submit", verifyToken, verifyApprovedStudent, async (req, res) => {
  try {
    const exam = await Exam.findById(req.body.examId);

    if (!exam) {
      return res.status(404).json({ message: "Exam not found." });
    }

    if (String(exam.classroomId || "") !== String(req.dbUser.classroomId || "")) {
      return res.status(403).json({ message: "This result does not match your classroom." });
    }

    const result = new Result({
      ...req.body,
      userId: req.dbUser._id,
      teacherId: exam.teacherId || null,
      classroomId: exam.classroomId || null,
      classroomName: exam.classroomName || req.dbUser.classroomName || "",
      studentName: normalizeText(req.body.studentName) || req.dbUser.name,
      testName: normalizeText(req.body.testName) || exam.title,
      assessmentType: normalizeText(req.body.assessmentType) || exam.assessmentType || "exam",
      responseMode: normalizeText(req.body.responseMode) || exam.responseMode || "mcq",
      submissionPrompt: normalizeText(req.body.submissionPrompt) || exam.submissionPrompt || "",
    });

    await result.save();
    res.json({ message: "Result saved", result });
  } catch (err) {
    console.log("RESULT SAVE ERROR:", err);
    res.status(500).json({ message: "Failed to save result" });
  }
});

app.post(
  "/api/results/submit-written",
  verifyToken,
  verifyApprovedStudent,
  submissionUpload.single("file"),
  async (req, res) => {
    try {
      const examId = normalizeText(req.body.examId);
      const exam = await Exam.findById(examId);

      if (!exam) {
        return res.status(404).json({ message: "Exam not found." });
      }

      if (String(exam.classroomId || "") !== String(req.dbUser.classroomId || "")) {
        return res.status(403).json({ message: "This result does not match your classroom." });
      }

      const responseMode = exam.responseMode || "written";
      if (responseMode !== "written") {
        return res.status(400).json({ message: "This exam does not accept written submissions." });
      }

      const writtenAnswer = String(req.body.writtenAnswer || "").trim();
      const fileUrl = req.file ? toRelativeUploadPath(req.file.path) : "";

      if (!writtenAnswer && !fileUrl) {
        return res.status(400).json({
          message: "Provide a typed answer or upload an answer sheet before submitting.",
        });
      }

      const result = new Result({
        ...safeJsonParse(req.body.payload, {}),
        userId: req.dbUser._id,
        teacherId: exam.teacherId || null,
        classroomId: exam.classroomId || null,
        classroomName: exam.classroomName || req.dbUser.classroomName || "",
        studentName: normalizeText(req.body.studentName) || req.dbUser.name,
        testName: normalizeText(req.body.testName) || exam.title,
        assessmentType: normalizeText(req.body.assessmentType) || exam.assessmentType || "exam",
        responseMode,
        writtenAnswer,
        writtenFileUrl: fileUrl,
        submissionPrompt: exam.submissionPrompt || exam.instructions || "",
        manualReviewRequired: true,
        status: "UNDER_REVIEW",
      });

      await result.save();
      res.json({ message: "Written exam saved", result });
    } catch (err) {
      console.log("WRITTEN RESULT SAVE ERROR:", err);
      res.status(500).json({ message: "Failed to save written submission" });
    }
  }
);

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
    const results = await Result.find({ teacherId: req.dbUser._id }).sort({
      createdAt: -1,
    });
    res.json(results);
  } catch (err) {
    console.log("RESULTS ERROR:", err);
    res.status(500).json({ message: "Failed to load all results" });
  }
});

app.delete("/api/results/delete/:id", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const deletedResult = await Result.findOneAndDelete({
      _id: req.params.id,
      teacherId: req.dbUser._id,
    });

    if (!deletedResult) {
      return res.status(404).json({ message: "Result not found." });
    }

    res.json({ message: "Result deleted successfully." });
  } catch (err) {
    console.log("RESULT DELETE ERROR:", err);
    res.status(500).json({ message: "Delete failed." });
  }
});

app.get("/api/assignments/all", verifyToken, async (req, res) => {
  try {
    const user = await getDbUser(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.role === "teacher") {
      const assignments = await Assignment.find({ teacherId: user._id }).sort({
        createdAt: -1,
      });
      const assignmentIds = assignments.map((assignment) => assignment._id);
      const submissions = await Submission.find({
        assignmentId: { $in: assignmentIds },
      }).sort({ submittedAt: -1 });

      const grouped = submissions.reduce((acc, submission) => {
        const key = String(submission.assignmentId);
        acc[key] = acc[key] || [];
        acc[key].push(submission);
        return acc;
      }, {});

      const payload = assignments.map((assignment) => ({
        ...assignment.toObject(),
        submissions: grouped[String(assignment._id)] || [],
        submissionCount: (grouped[String(assignment._id)] || []).length,
      }));

      return res.json(payload);
    }

    const assignments = await Assignment.find({
      classroomId: user.classroomId || null,
    }).sort({ createdAt: -1 });
    const assignmentIds = assignments.map((assignment) => assignment._id);
    const submissions = await Submission.find({
      assignmentId: { $in: assignmentIds },
      studentId: user._id,
    });

    const submissionsMap = submissions.reduce((acc, submission) => {
      acc[String(submission.assignmentId)] = submission;
      return acc;
    }, {});

    const payload = assignments.map((assignment) => {
      const mySubmission = submissionsMap[String(assignment._id)] || null;
      return {
        ...assignment.toObject(),
        mySubmission,
        status: mySubmission?.status || "Pending",
        marks:
          mySubmission?.status === "Checked"
            ? mySubmission.marks
            : mySubmission
            ? "Submitted"
            : "-",
      };
    });

    res.json(payload);
  } catch (err) {
    console.log("FETCH ASSIGNMENTS ERROR:", err);
    res.status(500).json({ message: "Error fetching assignments" });
  }
});

app.post(
  "/api/assignments/add",
  verifyToken,
  verifyTeacher,
  assignmentUpload.single("file"),
  async (req, res) => {
    try {
      const title = normalizeText(req.body.title);
      const dueDate = normalizeText(req.body.dueDate);
      const description = normalizeText(req.body.description);
      const classroom = await findTeacherClassroom(
        req.dbUser._id,
        normalizeText(req.body.classroomId) || req.dbUser.classroomId
      );

      if (!title || !dueDate || !classroom) {
        return res.status(400).json({
          message: "Title, due date, and valid classroom are required.",
        });
      }

      const assignment = await Assignment.create({
        teacherId: req.dbUser._id,
        classroomId: classroom._id,
        classroomName: buildClassroomLabel(classroom),
        title,
        description,
        dueDate,
        fileUrl: req.file ? toRelativeUploadPath(req.file.path) : "",
      });

      await Notification.create({
        title: `New assignment: ${assignment.title}`,
        message:
          description ||
          `A new assignment has been posted for ${buildClassroomLabel(classroom)}.`,
        type: "assignment",
        priority: "normal",
        audience: "classroom",
        teacherId: req.dbUser._id,
        classroomId: classroom._id,
        classroomName: buildClassroomLabel(classroom),
        sender: req.dbUser.name,
      });

      res.status(201).json(assignment);
    } catch (err) {
      console.log("CREATE ASSIGNMENT ERROR:", err);
      res.status(500).json({ message: "Failed to create assignment" });
    }
  }
);

app.delete("/api/assignments/delete/:id", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndDelete({
      _id: req.params.id,
      teacherId: req.dbUser._id,
    });

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    const submissions = await Submission.find({ assignmentId: assignment._id });
    submissions.forEach((submission) => removeFileIfExists(submission.fileUrl));
    await Submission.deleteMany({ assignmentId: assignment._id });
    removeFileIfExists(assignment.fileUrl);

    res.json({ message: "Assignment deleted" });
  } catch (err) {
    console.log("DELETE ASSIGNMENT ERROR:", err);
    res.status(500).json({ message: "Delete failed." });
  }
});

app.post(
  "/api/assignments/upload",
  verifyToken,
  verifyApprovedStudent,
  submissionUpload.single("file"),
  async (req, res) => {
    try {
      const assignmentId = normalizeText(req.body.assignmentId);

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

      if (String(assignment.classroomId || "") !== String(req.dbUser.classroomId || "")) {
        return res.status(403).json({ message: "This assignment is not assigned to your class." });
      }

      const existingSubmission = await Submission.findOne({
        assignmentId,
        studentId: req.dbUser._id,
      });

      if (existingSubmission?.fileUrl) {
        removeFileIfExists(existingSubmission.fileUrl);
      }

      const payload = {
        assignmentId,
        studentId: req.dbUser._id,
        fileUrl: toRelativeUploadPath(req.file.path),
        studentName: req.dbUser.name,
        rollNumber: req.dbUser.rollNumber || "",
        marks: existingSubmission?.marks || 0,
        status: existingSubmission ? "Re-submitted" : "Pending",
        feedback: existingSubmission?.feedback || "",
        reviewedAt: null,
        submittedAt: new Date(),
      };

      let submission = existingSubmission;
      if (submission) {
        Object.assign(submission, payload);
        await submission.save();
      } else {
        submission = await Submission.create(payload);
      }

      res.json({ message: "Assignment submitted successfully.", submission });
    } catch (err) {
      console.log("SUBMIT ASSIGNMENT ERROR:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

app.post("/api/assignments/give-marks", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const submissionId = normalizeText(req.body.submissionId);
    const feedback = normalizeText(req.body.feedback);
    const marks = Number(req.body.marks);

    if (!submissionId || Number.isNaN(marks)) {
      return res.status(400).json({ message: "Submission id and marks are required." });
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const assignment = await Assignment.findOne({
      _id: submission.assignmentId,
      teacherId: req.dbUser._id,
    });

    if (!assignment) {
      return res.status(403).json({ message: "This submission is outside your classroom scope." });
    }

    submission.marks = marks;
    submission.feedback = feedback;
    submission.status = "Checked";
    submission.reviewedAt = new Date();
    await submission.save();

    res.json({ message: "Marks added successfully", submission });
  } catch (err) {
    console.log("MARK SUBMISSION ERROR:", err);
    res.status(500).json({ message: "Error adding marks" });
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
        teacherId: req.dbUser._id,
        examTitle: report.examTitle || req.body.examTitle || "MCQ Paper Check",
        course: report.course || req.body.course || "",
        candidateName: report.candidateName || req.body.candidateName || "",
        processingMode: report.processingMode || "hybrid-ocr",
        answerSheetFile: answerSheetFile
          ? toRelativeUploadPath(answerSheetFile.path)
          : "",
        answerKeyFile: answerKeyFile ? toRelativeUploadPath(answerKeyFile.path) : "",
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
    const paperChecks = await PaperCheck.find({
      teacherId: req.dbUser._id,
    }).sort({ createdAt: -1 });
    res.json(paperChecks);
  } catch (err) {
    console.log("FETCH PAPER CHECKS ERROR:", err);
    res.status(500).json({ message: "Failed to load paper checks" });
  }
});

app.delete("/api/paper-checks/:id", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const paperCheck = await PaperCheck.findOneAndDelete({
      _id: req.params.id,
      teacherId: req.dbUser._id,
    });

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

app.post("/api/ai-tutor/ask", verifyToken, tutorUpload.single("file"), async (req, res) => {
  try {
    const user = await getDbUser(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const question = normalizeText(req.body.question);
    if (!question) {
      return res.status(400).json({ message: "Question is required." });
    }

    const [assignments, results, resources] = await Promise.all([
      Assignment.find({ classroomId: user.classroomId || null }).sort({ createdAt: -1 }).limit(8).lean(),
      Result.find({ userId: user._id }).sort({ createdAt: -1 }).limit(8).lean(),
      StudyResource.find({ classroomId: user.classroomId || null }).sort({ createdAt: -1 }).limit(8).lean(),
    ]);
    const context = formatTutorContext({ user, assignments, results, resources });
    const openAiAnswer = await callOpenAiTutor({ question, context, file: req.file });
    const answer =
      openAiAnswer ||
      buildLocalTutorAnswer({ user, question, assignments, results, resources, file: req.file });

    res.json({
      answer,
      mode: openAiAnswer ? "ai" : "contextual-fallback",
      attachment: req.file
        ? {
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
          }
        : null,
    });
  } catch (err) {
    console.log("AI TUTOR ERROR:", err);
    res.status(500).json({ message: "AI tutor could not respond right now." });
  }
});

app.get("/api/study-vault", verifyToken, async (req, res) => {
  try {
    const user = await getDbUser(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let query = {};
    if (user.role === "teacher") {
      query = { teacherId: user._id };
    } else if (user.role === "student") {
      query = { classroomId: user.classroomId || null };
    }

    const resources = await StudyResource.find(query).sort({ createdAt: -1 }).lean();
    res.json(resources);
  } catch (err) {
    console.log("STUDY VAULT FETCH ERROR:", err);
    res.status(500).json({ message: "Failed to load study vault." });
  }
});

app.post(
  "/api/study-vault",
  verifyToken,
  verifyStaff,
  studyVaultUpload.single("file"),
  async (req, res) => {
    try {
      const title = normalizeText(req.body.title);
      const description = normalizeText(req.body.description);
      const resourceType = normalizeText(req.body.resourceType) || "notes";
      const externalUrl = normalizeText(req.body.externalUrl);
      const classroomId = normalizeText(req.body.classroomId);

      if (!title) {
        return res.status(400).json({ message: "Title is required." });
      }

      let classroom = null;
      if (req.dbUser.role === "teacher") {
        classroom = await findTeacherClassroom(
          req.dbUser._id,
          classroomId || req.dbUser.classroomId
        );
      } else if (classroomId) {
        classroom = await Classroom.findById(classroomId);
      }

      if (!classroom) {
        return res.status(400).json({ message: "Valid classroom is required." });
      }

      const resource = await StudyResource.create({
        teacherId: req.dbUser.role === "teacher" ? req.dbUser._id : classroom.teacherId || null,
        teacherName: req.dbUser.role === "teacher" ? req.dbUser.name : "System Admin",
        classroomId: classroom._id,
        classroomName: buildClassroomLabel(classroom),
        title,
        description,
        resourceType,
        externalUrl,
        fileUrl: req.file ? toRelativeUploadPath(req.file.path) : "",
      });

      await Notification.create({
        title: `Study vault updated: ${resource.title}`,
        message: description || "A new study resource is available in your Study Vault.",
        type: "general",
        priority: "normal",
        audience: "classroom",
        teacherId: resource.teacherId,
        classroomId: classroom._id,
        classroomName: buildClassroomLabel(classroom),
        sender: req.dbUser.name,
      });

      res.status(201).json(resource);
    } catch (err) {
      console.log("STUDY VAULT CREATE ERROR:", err);
      res.status(500).json({ message: "Failed to save study resource." });
    }
  }
);

app.delete("/api/study-vault/:id", verifyToken, verifyStaff, async (req, res) => {
  try {
    const query =
      req.dbUser.role === "admin"
        ? { _id: req.params.id }
        : { _id: req.params.id, teacherId: req.dbUser._id };
    const resource = await StudyResource.findOneAndDelete(query);

    if (!resource) {
      return res.status(404).json({ message: "Study resource not found." });
    }

    removeFileIfExists(resource.fileUrl);
    res.json({ message: "Study resource deleted." });
  } catch (err) {
    console.log("STUDY VAULT DELETE ERROR:", err);
    res.status(500).json({ message: "Failed to delete study resource." });
  }
});

app.post("/api/system-checks", verifyToken, verifyApprovedStudent, async (req, res) => {
  try {
    const speedMbps = Number(req.body.speedMbps || 0);
    const latencyMs = Number(req.body.latencyMs || 0);
    const check = await SystemCheck.create({
      studentId: req.dbUser._id,
      studentName: req.dbUser.name,
      classroomId: req.dbUser.classroomId || null,
      classroomName: req.dbUser.classroomName || "",
      camera: normalizeText(req.body.camera) || "warning",
      microphone: normalizeText(req.body.microphone) || "warning",
      internet: normalizeText(req.body.internet) || "warning",
      browser: normalizeText(req.body.browser) || "warning",
      device: normalizeText(req.body.device) || "warning",
      speedMbps,
      latencyMs,
      batteryPercent: Number(req.body.batteryPercent || 0),
      screenWidth: Number(req.body.screenWidth || 0),
      screenHeight: Number(req.body.screenHeight || 0),
      userAgent: normalizeText(req.body.userAgent),
      diagnostics: req.body.diagnostics || {},
      notes: normalizeText(req.body.notes),
    });

    res.status(201).json(check);
  } catch (err) {
    console.log("SYSTEM CHECK SAVE ERROR:", err);
    res.status(500).json({ message: "Failed to save system check." });
  }
});

app.get("/api/system-checks/my", verifyToken, verifyApprovedStudent, async (req, res) => {
  try {
    const checks = await SystemCheck.find({ studentId: req.dbUser._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    res.json(checks);
  } catch (err) {
    console.log("SYSTEM CHECK FETCH ERROR:", err);
    res.status(500).json({ message: "Failed to load system checks." });
  }
});

app.get("/api/admin/overview", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [
      users,
      classrooms,
      exams,
      questions,
      results,
      assignments,
      submissions,
      notifications,
      studyResources,
      systemChecks,
    ] = await Promise.all([
      User.find()
        .select("-password")
        .sort({ createdAt: -1 })
        .lean(),
      Classroom.find().sort({ createdAt: -1 }).lean(),
      Exam.find().sort({ createdAt: -1 }).lean(),
      Question.find().sort({ createdAt: -1 }).lean(),
      Result.find().sort({ createdAt: -1 }).lean(),
      Assignment.find().sort({ createdAt: -1 }).lean(),
      Submission.find().sort({ submittedAt: -1 }).lean(),
      Notification.find().sort({ createdAt: -1 }).lean(),
      StudyResource.find().sort({ createdAt: -1 }).lean(),
      SystemCheck.find().sort({ createdAt: -1 }).lean(),
    ]);

    const teachers = users.filter((user) => user.role === "teacher");
    const students = users.filter((user) => user.role === "student");
    const aiExams = exams.filter((exam) => (exam.assessmentType || "exam") !== "quiz");
    const quizzes = exams.filter((exam) => (exam.assessmentType || "exam") === "quiz");
    const aiExamResults = results.filter((result) => (result.assessmentType || "exam") !== "quiz");
    const quizResults = results.filter((result) => (result.assessmentType || "exam") === "quiz");

    res.json({
      metrics: {
        users: users.length,
        teachers: teachers.length,
        students: students.length,
        pendingStudents: students.filter((student) => student.approvalStatus === "pending").length,
        classrooms: classrooms.length,
        aiExams: aiExams.length,
        quizzes: quizzes.length,
        aiExamResults: aiExamResults.length,
        quizResults: quizResults.length,
        assignments: assignments.length,
        submissions: submissions.length,
        notifications: notifications.length,
        studyResources: studyResources.length,
        systemChecks: systemChecks.length,
      },
      users,
      teachers,
      students,
      classrooms,
      exams,
      aiExams,
      quizzes,
      questions,
      results,
      aiExamResults,
      quizResults,
      assignments,
      submissions,
      notifications,
      studyResources,
      systemChecks,
    });
  } catch (err) {
    console.log("ADMIN OVERVIEW ERROR:", err);
    res.status(500).json({ message: "Failed to load admin overview." });
  }
});

app.post("/api/admin/impersonate/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === "admin") {
      return res.status(404).json({ message: "User account not found." });
    }

    const managedClassrooms =
      user.role === "teacher" ? await ensureTeacherWorkspace(user) : [];
    res.json({
      token: signToken(user),
      user: buildUserPayload(user, managedClassrooms),
      message: `Admin access opened for ${user.role} portal.`,
    });
  } catch (err) {
    console.log("ADMIN IMPERSONATE ERROR:", err);
    res.status(500).json({ message: "Failed to open user portal access." });
  }
});

app.post("/api/admin/notifications", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const title = normalizeText(req.body.title);
    const message = normalizeText(req.body.message);
    const audience = normalizeText(req.body.audience) || "all";
    const classroomId = normalizeText(req.body.classroomId);
    const classroom = classroomId ? await Classroom.findById(classroomId) : null;

    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required." });
    }

    const notification = await Notification.create({
      title,
      message,
      type: normalizeText(req.body.type) || "general",
      priority: normalizeText(req.body.priority) || "normal",
      audience,
      classroomId: classroom?._id || null,
      classroomName: classroom ? buildClassroomLabel(classroom) : "",
      teacherId: classroom?.teacherId || null,
      sender: req.dbUser.name || "System Admin",
    });

    res.status(201).json(notification);
  } catch (err) {
    console.log("ADMIN NOTICE CREATE ERROR:", err);
    res.status(500).json({ message: "Failed to publish announcement." });
  }
});

app.delete("/api/admin/users/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === "admin") {
      return res.status(404).json({ message: "User account not found." });
    }

    await User.deleteOne({ _id: user._id });
    if (user.role === "student") {
      await Submission.deleteMany({ studentId: user._id });
      await Result.deleteMany({ userId: user._id });
      await SystemCheck.deleteMany({ studentId: user._id });
    }

    res.json({ message: "User removed successfully." });
  } catch (err) {
    console.log("ADMIN USER DELETE ERROR:", err);
    res.status(500).json({ message: "Failed to remove user." });
  }
});

app.delete("/api/admin/notifications/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Announcement not found." });
    }

    res.json({ message: "Announcement removed." });
  } catch (err) {
    console.log("ADMIN NOTICE DELETE ERROR:", err);
    res.status(500).json({ message: "Failed to remove announcement." });
  }
});

app.delete("/api/admin/assignments/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    const submissions = await Submission.find({ assignmentId: assignment._id });
    submissions.forEach((submission) => removeFileIfExists(submission.fileUrl));
    await Submission.deleteMany({ assignmentId: assignment._id });
    removeFileIfExists(assignment.fileUrl);

    res.json({ message: "Assignment removed." });
  } catch (err) {
    console.log("ADMIN ASSIGNMENT DELETE ERROR:", err);
    res.status(500).json({ message: "Failed to remove assignment." });
  }
});

app.delete("/api/admin/results/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Result not found." });
    }

    removeFileIfExists(result.writtenFileUrl);
    res.json({ message: "Result removed." });
  } catch (err) {
    console.log("ADMIN RESULT DELETE ERROR:", err);
    res.status(500).json({ message: "Failed to remove result." });
  }
});

app.post("/api/admin/teachers", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const name = normalizeText(req.body.name);
    const email = normalizeText(req.body.email).toLowerCase();
    const password = String(req.body.password || "Teacher-12345");
    const department = normalizeText(req.body.department) || "General Department";

    if (!name || !email) {
      return res.status(400).json({ message: "Teacher name and email are required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "A user with this email already exists." });
    }

    const teacher = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role: "teacher",
      approvalStatus: "approved",
      department,
    });

    res.status(201).json({ message: "Teacher created.", user: buildUserPayload(teacher) });
  } catch (err) {
    console.log("ADMIN CREATE TEACHER ERROR:", err);
    res.status(500).json({ message: "Failed to create teacher." });
  }
});

app.post("/api/admin/classrooms", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const teacherId = normalizeText(req.body.teacherId);
    const name = normalizeText(req.body.name);
    const department = normalizeText(req.body.department);
    const program = normalizeText(req.body.program) || name;
    const section = normalizeText(req.body.section) || "A";
    const semester = normalizeText(req.body.semester);
    const description = normalizeText(req.body.description);

    const teacher = await User.findOne({ _id: teacherId, role: "teacher" });
    if (!teacher || !name || !department) {
      return res.status(400).json({ message: "Teacher, classroom name, and department are required." });
    }

    const classroom = await Classroom.create({
      teacherId: teacher._id,
      teacherName: teacher.name,
      name,
      department,
      program,
      section,
      semester,
      description,
      inviteCode: makeInviteCode(),
    });

    teacher.managedClassrooms = [...(teacher.managedClassrooms || []), classroom._id];
    if (!teacher.classroomId) {
      teacher.classroomId = classroom._id;
      teacher.classroomName = buildClassroomLabel(classroom);
    }
    await teacher.save();

    res.status(201).json({ message: "Classroom created.", classroom: buildClassroomPayload(classroom) });
  } catch (err) {
    console.log("ADMIN CREATE CLASSROOM ERROR:", err);
    res.status(500).json({ message: "Failed to create classroom." });
  }
});

app.delete("/api/admin/exams/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: "Assessment not found." });
    }

    await Question.deleteMany({ examId: exam._id });
    res.json({ message: "Assessment and linked questions removed." });
  } catch (err) {
    console.log("ADMIN EXAM DELETE ERROR:", err);
    res.status(500).json({ message: "Failed to remove assessment." });
  }
});

app.put("/api/admin/users/:id/status", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const approvalStatus = normalizeText(req.body.approvalStatus).toLowerCase();
    if (!["pending", "approved", "rejected"].includes(approvalStatus)) {
      return res.status(400).json({ message: "Invalid approval status." });
    }

    const user = await User.findById(req.params.id);
    if (!user || user.role !== "student") {
      return res.status(404).json({ message: "Student not found." });
    }

    user.approvalStatus = approvalStatus;
    await user.save();

    res.json({ message: "Student status updated.", user: buildUserPayload(user) });
  } catch (err) {
    console.log("ADMIN USER STATUS ERROR:", err);
    res.status(500).json({ message: "Failed to update student status." });
  }
});

app.put("/api/admin/exams/:id/status", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: "Assessment not found." });
    }

    if (req.body.status !== undefined) {
      exam.status = req.body.status;
    }

    if (typeof req.body.accessGranted === "boolean") {
      exam.accessGranted = req.body.accessGranted;
    }

    await exam.save();
    res.json({ message: "Assessment status updated.", exam: buildExamPayload(exam) });
  } catch (err) {
    console.log("ADMIN EXAM STATUS ERROR:", err);
    res.status(500).json({ message: "Failed to update assessment status." });
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
