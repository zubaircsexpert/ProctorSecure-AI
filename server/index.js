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

dns.setServers(["8.8.8.8", "1.1.1.1"]);
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const TEACHER_ACCESS_KEY =
  process.env.TEACHER_ACCESS_KEY || "PROCTOR-TEACHER-2026";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");
const paperChecksDir = path.join(uploadsDir, "paper-checks");
const studentCardsDir = path.join(uploadsDir, "student-cards");
const teacherFilesDir = path.join(uploadsDir, "assignment-files");
const studentSubmissionsDir = path.join(uploadsDir, "assignment-submissions");

[uploadsDir, paperChecksDir, studentCardsDir, teacherFilesDir, studentSubmissionsDir].forEach(
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
    });

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
    });
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

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (portalRole && portalRole !== user.role) {
      return res.status(403).json({
        message:
          user.role === "teacher"
            ? "This account belongs to the teacher portal."
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
    const startTime = req.body.startTime || null;
    const endTime = req.body.endTime || null;

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
      instructions,
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
    exam.instructions = normalizeText(req.body.instructions || exam.instructions);
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
