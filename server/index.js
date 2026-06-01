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
import http from "http";
import { Server as SocketServer } from "socket.io";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import crypto from "crypto";
import nodemailer from "nodemailer";
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
import SystemAccess from "./models/SystemAccess.js";
import Quiz from "./models/Quiz.js";
import GeneratedQuestion from "./models/GeneratedQuestion.js";
import ExamAI from "./models/ExamAI.js";
import Assessment from "./models/Assessment.js";
import ExamAIResult from "./models/ExamAIResult.js";
import ExamViolation from "./models/ExamViolation.js";
import AIReport from "./models/AIReport.js";
import MCQBank from "./models/MCQBank.js";
import QuizTemplate from "./models/QuizTemplate.js";
import QuizSession from "./models/QuizSession.js";
import CheatDetection from "./models/CheatDetection.js";
import QuizAnalytics from "./models/QuizAnalytics.js";
import ChatMessage from "./models/ChatMessage.js";
import ChatSession from "./models/ChatSession.js";
import {
  extractTextFromImage,
  extractTextFromImageWithLanguage,
  processPdfAdvanced,
  normalizeExtractedText,
  extractConceptsFromText,
  chunkTextForAI,
  parseAIMCQResponse,
  sanitizeCompetitiveMCQ,
  generateFallbackMCQs,
  buildEnhancedQuizPrompt,
  enhanceQuizMetadata,
} from "./utils/quizGenerator.js";
import quizRoutes from "./routes/quizRoutes.js";
import quizAssemblyRoutes from "./routes/quizAssemblyRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const TEACHER_ACCESS_KEY =
  process.env.TEACHER_ACCESS_KEY || "Teacher-@9080#$@";
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || "admin@proctor.ai").trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ADMIN-PROCTOR-2026";
const DB_FILE_BACKUP_LIMIT = Number(process.env.DB_FILE_BACKUP_LIMIT || 8 * 1024 * 1024);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");
const paperChecksDir = path.join(uploadsDir, "paper-checks");
const studentCardsDir = path.join(uploadsDir, "student-cards");
const teacherFilesDir = path.join(uploadsDir, "assignment-files");
const studentSubmissionsDir = path.join(uploadsDir, "assignment-submissions");
const studyVaultDir = path.join(uploadsDir, "study-vault");
const tutorUploadsDir = path.join(uploadsDir, "ai-tutor");
const chatUploadsDir = path.join(uploadsDir, "chat");

[uploadsDir, paperChecksDir, studentCardsDir, teacherFilesDir, studentSubmissionsDir, studyVaultDir, tutorUploadsDir, chatUploadsDir].forEach(
  (directory) => fs.mkdirSync(directory, { recursive: true })
);

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(uploadsDir));

const normalizeText = (value) => String(value || "").trim();
const toRelativeUploadPath = (absolutePath) =>
  path.relative(uploadsDir, absolutePath).replace(/\\/g, "/");

const buildDbFileBackup = (file) => {
  if (!file?.path || !fs.existsSync(file.path)) {
    return {
      fileData: "",
      fileMimeType: "",
      originalFileName: "",
    };
  }

  const stats = fs.statSync(file.path);
  if (stats.size > DB_FILE_BACKUP_LIMIT) {
    return {
      fileData: "",
      fileMimeType: file.mimetype || "",
      originalFileName: file.originalname || "",
    };
  }

  return {
    fileData: fs.readFileSync(file.path).toString("base64"),
    fileMimeType: file.mimetype || "application/octet-stream",
    originalFileName: file.originalname || "",
  };
};

const extractTextFromUploadedFile = async (file) => {
  if (!file || !file.path) return "";
  const ext = path.extname(file.originalname || "").toLowerCase();

  try {
    if (ext === ".pdf") {
      const dataBuffer = fs.readFileSync(file.path);
      const pdfResult = await processPdfAdvanced(PDFParse, dataBuffer);
      return normalizeExtractedText(pdfResult.text || "");
    }

    if (ext === ".docx") {
      const result = await mammoth.extractRawText({ path: file.path });
      return normalizeExtractedText(result.value || "");
    }

    if (ext === ".txt") {
      const text = fs.readFileSync(file.path, "utf-8");
      return normalizeExtractedText(text);
    }

    // Image OCR support for PNG, JPG, JPEG, GIF
    if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext)) {
      try {
        const ocrResult = await extractTextFromImageWithLanguage(file.path, ["eng", "urd"]);
        return normalizeExtractedText(ocrResult.text || "");
      } catch (ocrError) {
        console.log("OCR EXTRACTION ERROR:", ocrError.message);
        return "";
      }
    }

    return "";
  } catch (error) {
    console.log("FILE TEXT EXTRACTION ERROR:", error);
    return "";
  }
};

const sanitizeFileName = (name) =>
  normalizeText(name || "file")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");

const hashResetToken = (token) =>
  crypto.createHash("sha256").update(String(token || "")).digest("hex");

const getClientUrl = () =>
  String(process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");

const sendPasswordResetEmail = async ({ email, name, resetUrl }) => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log(`PASSWORD RESET LINK for ${email}: ${resetUrl}`);
    return { sent: false, reason: "SMTP_NOT_CONFIGURED" };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || smtpUser,
    to: email,
    subject: "Reset your ProctorSecure AI password",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2>Password reset request</h2>
        <p>Hello ${name || "there"},</p>
        <p>Use the button below to reset your ProctorSecure AI password. This link expires in 30 minutes.</p>
        <p><a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">Reset password</a></p>
        <p>If the button does not work, open this link:</p>
        <p style="word-break:break-all">${resetUrl}</p>
      </div>
    `,
  });

  return { sent: true };
};

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
const chatUpload = multer({
  storage: createDiskStorage(chatUploadsDir),
  limits: { fileSize: 35 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^(image|video|audio)\//i.test(file.mimetype || "")) {
      cb(null, true);
      return;
    }

    cb(new Error("Only images, videos, and voice notes can be sent in chat."));
  },
});

const safeJsonParse = (value, fallback) => {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeUploadReference = (fileName) => {
  if (!fileName) return "";
  const rawValue = String(fileName).trim();
  let cleanValue = rawValue;

  try {
    const parsedUrl = new URL(rawValue);
    cleanValue = parsedUrl.pathname;
  } catch {
    cleanValue = rawValue;
  }

  cleanValue = cleanValue.replace(/\\/g, "/").replace(/^\/+/, "");
  return cleanValue.replace(/^uploads\//i, "");
};

const removeFileIfExists = (fileName) => {
  if (!fileName) return;

  const absolutePath = resolveUploadPath(fileName);
  if (absolutePath && fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
};

const resolveUploadPath = (fileName) => {
  const uploadReference = normalizeUploadReference(fileName);
  if (!uploadReference) return "";
  const absolutePath = path.resolve(uploadsDir, uploadReference);
  const rootPath = path.resolve(uploadsDir);
  return absolutePath.startsWith(rootPath) ? absolutePath : "";
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const sendAssignmentFallbackPreview = (res, assignment, fileUrl) => {
  const title = escapeHtml(assignment.title || "Assignment");
  const description = escapeHtml(assignment.description || "No assignment description was provided.");
  const dueDate = assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : "No due date";
  const classroomName = escapeHtml(assignment.classroomName || "Classroom");
  const missingFile = escapeHtml(normalizeUploadReference(fileUrl) || "attached file");

  return res
    .status(200)
    .type("html")
    .send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { margin: 0; background: #eef4ff; color: #08111f; font-family: Inter, Arial, sans-serif; }
      main { max-width: 900px; margin: 40px auto; background: #fff; border-radius: 22px; padding: 36px; box-shadow: 0 22px 60px rgba(15, 23, 42, .12); }
      .label { color: #2563eb; font-size: 13px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
      h1 { margin: 12px 0 8px; font-size: clamp(30px, 5vw, 52px); }
      .meta { color: #475569; font-size: 18px; line-height: 1.7; }
      .notice { margin: 28px 0; padding: 18px 20px; border: 1px solid #fed7aa; background: #fff7ed; border-radius: 16px; color: #9a3412; font-weight: 700; }
      .brief { margin-top: 28px; white-space: pre-wrap; font-size: 20px; line-height: 1.8; }
    </style>
  </head>
  <body>
    <main>
      <div class="label">Assignment Preview</div>
      <h1>${title}</h1>
      <div class="meta">${classroomName}<br />Due ${escapeHtml(dueDate)}</div>
      <div class="notice">Original uploaded file is not available on the server right now: ${missingFile}. The assignment brief is shown below so the teacher/student can still view the work.</div>
      <div class="brief">${description}</div>
    </main>
  </body>
</html>`);
};

const buildAssignmentPayload = (assignment) => {
  const item = assignment?.toObject ? assignment.toObject() : assignment;
  if (!item) return item;
  return {
    ...item,
    fileData: undefined,
    downloadUrl: item.fileUrl ? `/api/assignments/file/assignment/${item._id}` : "",
  };
};

const buildSubmissionPayload = (submission) => {
  const item = submission?.toObject ? submission.toObject() : submission;
  if (!item) return item;
  return {
    ...item,
    fileData: undefined,
    downloadUrl: item.fileUrl ? `/api/assignments/file/submission/${item._id}` : "",
  };
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

const buildStudentClassroomScope = async (user) => {
  if (!user || user.role !== "student") return {};

  const or = [];
  if (user.classroomId) {
    or.push({ classroomId: user.classroomId });
  }

  const classroomName = normalizeText(user.classroomName);
  if (classroomName) {
    or.push({ classroomName });
  }

  if (user.teacherId) {
    const teacherClassrooms = await Classroom.find({ teacherId: user.teacherId }).select("_id").lean();
    const classroomIds = teacherClassrooms.map((classroom) => classroom._id);
    if (classroomIds.length) {
      or.push({ classroomId: { $in: classroomIds } });
    }
  }

  return or.length ? { $or: or } : { classroomId: user.classroomId || null };
};

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

const shuffleList = (list) =>
  [...list]
    .map((item) => ({ item, rank: Math.random() }))
    .sort((left, right) => left.rank - right.rank)
    .map(({ item }) => item);

const buildStudentQuestionPayload = (question) => {
  const payload = question.toObject ? question.toObject() : { ...question };
  return {
    ...payload,
    options: payload.options || [],
  };
};

const buildStudyResourcePayload = (resource) => {
  const payload = resource.toObject ? resource.toObject() : { ...resource };
  const localFilePath = payload.fileUrl ? resolveUploadPath(payload.fileUrl) : "";
  const localFileAvailable =
    Boolean(localFilePath) && fs.existsSync(localFilePath);
  const databaseFileAvailable = Boolean(payload.fileData && payload.fileMimeType);

  return {
    ...payload,
    fileData: undefined,
    fileAvailable: localFileAvailable || databaseFileAvailable,
    downloadUrl: databaseFileAvailable || localFileAvailable
      ? `/api/study-vault/file/${payload._id}`
      : "",
  };
};

const getSystemAccess = async () =>
  SystemAccess.findOneAndUpdate(
    { key: "global" },
    { $setOnInsert: { key: "global" } },
    { new: true, upsert: true }
  ).lean();

const buildAccessPayload = (access) => ({
  systemAccess: access?.systemAccess !== false,
  studentAccess: access?.studentAccess !== false,
  teacherAccess: access?.teacherAccess !== false,
  updatedBy: access?.updatedBy || "System Admin",
  updatedAt: access?.updatedAt || access?.createdAt || null,
});

const assertPortalAccess = async (role) => {
  if (role === "admin") return null;

  const access = await getSystemAccess();
  const payload = buildAccessPayload(access);

  if (!payload.systemAccess) {
    return "System access is temporarily disabled by admin.";
  }

  if (role === "student" && !payload.studentAccess) {
    return "Student portal access is temporarily disabled by admin.";
  }

  if (role === "teacher" && !payload.teacherAccess) {
    return "Teacher portal access is temporarily disabled by admin.";
  }

  return null;
};

const formatTutorContext = ({ user, assignments, results, resources, exams, questions }) => {
  const assignmentSummary = assignments
    .slice(0, 8)
    .map((assignment) => {
      const submission = assignment.mySubmission || null;
      return `${assignment.title} | due ${assignment.dueDate || "N/A"} | submitted ${
        submission ? "yes" : "no"
      } | status ${
        submission?.status || assignment.status || "Pending"
      } | marks ${submission?.marks ?? "N/A"} | feedback ${submission?.feedback || "none"} | instructions ${
        assignment.description || "none"
      }`;
    })
    .join("\n");
  const resultSummary = results
    .slice(0, 8)
    .map((result) => {
      const wrongAnswers = (result.answerSheet || [])
        .filter((answer) => !answer.isCorrect)
        .slice(0, 4)
        .map(
          (answer) =>
            `${answer.questionText || "Question"} | selected ${answer.selectedAnswer || "blank"} | correct ${
              answer.correctAnswer || "N/A"
            }`
        )
        .join("; ");
      const detectionSummary = [
        ["copy", result.copyWarnings],
        ["paste", result.pasteWarnings],
        ["tab", result.tabWarnings],
        ["focus", result.focusWarnings],
        ["head", result.headWarnings],
        ["eyes", result.eyeWarnings],
        ["screen", result.screenShareWarnings],
      ]
        .filter(([, count]) => Number(count || 0) > 0)
        .map(([label, count]) => `${label}:${count}`)
        .join(", ");

      return `${result.testName || "Assessment"} | ${result.assessmentType || "exam"} | ${
        result.percentage || 0
      }% | score ${result.score || 0}/${result.total || 0} | unanswered ${
        result.unansweredAnswers || 0
      } | suspicious ${result.suspiciousScore || result.cheatingPercent || 0}% | trust ${
        result.trustFactor || "N/A"
      } | detections ${detectionSummary || "none"} | weak answers ${wrongAnswers || "none logged"}`;
    })
    .join("\n");
  const resourceSummary = resources
    .slice(0, 5)
    .map((resource) => `${resource.title} | ${resource.resourceType || "notes"}`)
    .join("\n");
  const examSummary = exams
    .slice(0, 8)
    .map(
      (exam) =>
        `${exam.title} | ${exam.assessmentType || "exam"} | ${exam.status || "scheduled"} | ${
          exam.responseMode || "mcq"
        } | course ${exam.course || "N/A"} | syllabus ${exam.syllabus || "none"}`
    )
    .join("\n");
  const questionSummary = questions
    .slice(0, 10)
    .map(
      (question) =>
        `${question.questionText} | options ${(question.options || []).join(", ")} | correct ${
          question.correctAnswer || "N/A"
        }`
    )
    .join("\n");

  return [
    `Student: ${user.name}`,
    `Classroom: ${user.classroomName || "N/A"}`,
    `Teacher: ${user.teacherName || "N/A"}`,
    `Recent assignments:\n${assignmentSummary || "No assignments found."}`,
    `Recent results:\n${resultSummary || "No results found."}`,
    `Live/scheduled assessments:\n${examSummary || "No active assessments found."}`,
    `Recent classroom questions:\n${questionSummary || "No questions found."}`,
    `Study vault resources:\n${resourceSummary || "No study resources found."}`,
  ].join("\n\n");
};

const parseAiJson = (rawText) => {
  const trimmed = String(rawText || "").trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
};

const callOpenAiQuizGenerator = async ({
  payloadText,
  count,
  difficulty,
  subject,
  category,
  file,
  language = "english",
}) => {
  if (!process.env.OPENAI_API_KEY) return null;

  const textChunks = chunkTextForAI(payloadText || "No text provided.", 6500).slice(0, 24);
  const orderedChunks = textChunks.length ? textChunks : ["No text provided."];
  const allQuestions = [];
  const seenQuestions = new Set();
  const imageContent = [];

  if (file?.mimetype?.startsWith("image/")) {
    try {
      const imageBase64 = fs.readFileSync(file.path).toString("base64");
      imageContent.push({
        type: "image_url",
        image_url: {
          url: `data:${file.mimetype};base64,${imageBase64}`,
        },
      });
    } catch (imageError) {
      console.log("IMAGE ENCODING ERROR:", imageError.message);
    }
  }

  const requestChunk = async (chunkText, targetCount, chunkIndex) => {
    const prompt = `${buildEnhancedQuizPrompt(
      chunkText,
      targetCount,
      difficulty,
      subject,
      language
    )}

RANDOMIZATION SEED: ${Date.now()}-${Math.random()}-${chunkIndex}
Already generated question stems to avoid:
${[...seenQuestions].slice(-40).join("\n") || "None"}

Generate fresh MCQs only from this chunk. Avoid repeating any listed question.`;

    const content = [
      {
        type: "text",
        text: prompt,
      },
      ...imageContent,
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_QUIZ_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert PPSC/FPSC competitive-exam MCQ generator. Generate only short, one-line, grounded questions from the provided content. Use direct, conceptual, analytical, application-based, and tricky exam patterns. Never mention uploaded material, source, passage, or document. Each question must have exactly 4 short realistic options and one correct answer.",
          },
          {
            role: "user",
            content,
          },
        ],
        temperature: 0.72,
        presence_penalty: 0.45,
        frequency_penalty: 0.35,
        max_tokens: Math.min(12000, Math.max(2500, targetCount * 420)),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("OPENAI QUIZ API ERROR:", errorText);
      return [];
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || "";
    const parsedResult = parseAIMCQResponse(responseText);

    if (!parsedResult) {
      console.log("QUIZ GENERATION FAILED: Invalid response format from AI");
      return [];
    }

    return (parsedResult.questions || [])
      .filter((q) => {
        const hasPlaceholders = (q.options || []).some((opt) =>
          /^option\s+[a-d]$/i.test(String(opt).trim())
        );
        return !hasPlaceholders && q.options.length >= 2;
      });
  };

  try {
    for (let index = 0; index < orderedChunks.length && allQuestions.length < count; index += 1) {
      const remaining = count - allQuestions.length;
      const remainingChunks = orderedChunks.length - index;
      const targetForChunk = Math.min(15, Math.max(4, Math.ceil(remaining / remainingChunks) + 3));
      const chunkQuestions = await requestChunk(orderedChunks[index], targetForChunk, index);

      chunkQuestions.forEach((question) => {
        const key = normalizeText(question.questionText || question.question || "").toLowerCase();
        if (key && !seenQuestions.has(key) && allQuestions.length < count) {
          seenQuestions.add(key);
          allQuestions.push(question);
        }
      });
    }

    if (allQuestions.length < count && orderedChunks.length) {
      const retryQuestions = await requestChunk(
        orderedChunks.join("\n\n").slice(0, 12000),
        Math.min(20, count - allQuestions.length + 6),
        999
      );
      retryQuestions.forEach((question) => {
        const key = normalizeText(question.questionText || question.question || "").toLowerCase();
        if (key && !seenQuestions.has(key) && allQuestions.length < count) {
          seenQuestions.add(key);
          allQuestions.push(question);
        }
      });
    }

    if (!allQuestions.length) return null;
    return {
      title: `Quiz on ${subject}`,
      subject,
      category,
      difficulty,
      language,
      questions: allQuestions,
      validCount: allQuestions.length,
    };
  } catch (error) {
    console.log("OPENAI QUIZ GENERATION ERROR:", error.message);
    return null;
  }
};

const callOpenAiTutor = async ({ question, context, mode, file }) => {
  if (!process.env.OPENAI_API_KEY) return null;

  const content = [
    {
      type: "text",
      text: `${context}\n\nTutor mode: ${mode || "general"}\n\nStudent question:\n${question}\n\nAnswer like a complete student portal AI tool. Analyze the available portal context first, then help with exams, quizzes, assignments, question solving, result weaknesses, study planning, and next actions. If an uploaded image is provided, analyze it for the student.`,
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
            "You are ProctorSecure AI Tutor, the default AI tool inside the student portal. Be practical, student-friendly, and grounded in portal data. Give concise analysis, exact next steps, and examples. You may help draft assignments and explain questions, but do not impersonate a student or claim grades are official.",
        },
        { role: "user", content },
      ],
      temperature: 0.45,
      max_tokens: 1200,
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

const buildLocalTutorAnswer = ({ user, question, mode, assignments, results, resources, exams, questions, file }) => {
  const lower = question.toLowerCase();
  const latestAssignment = assignments[0];
  const latestResult = results[0];
  const pendingAssignments = assignments.filter((assignment) => !assignment.mySubmission).slice(0, 5);
  const submittedAssignments = assignments.filter((assignment) => assignment.mySubmission).slice(0, 5);
  
  // Calculate performance metrics
  const avgScore = results.length ? (results.reduce((sum, r) => sum + Number(r.percentage || 0), 0) / results.length).toFixed(1) : 0;
  const improvementTrend = results.length >= 2 ? (Number(results[0].percentage || 0) - Number(results[1].percentage || 0)).toFixed(1) : 0;
  
  const weakResults = results.filter((result) => Number(result.percentage || 0) < 60).slice(0, 3);
  const strongResults = results.filter((result) => Number(result.percentage || 0) >= 80).slice(0, 3);
  
  const detectionTotals = results.reduce(
    (acc, result) => ({
      copy: acc.copy + Number(result.copyWarnings || 0),
      paste: acc.paste + Number(result.pasteWarnings || 0),
      tab: acc.tab + Number(result.tabWarnings || 0) + Number(result.visibilityWarnings || 0),
      head: acc.head + Number(result.headWarnings || 0),
      eyes: acc.eyes + Number(result.eyeWarnings || 0),
      focus: acc.focus + Number(result.focusWarnings || 0) + Number(result.screenShareWarnings || 0),
    }),
    { copy: 0, paste: 0, tab: 0, head: 0, eyes: 0, focus: 0 }
  );
  
  const totalViolations = Object.values(detectionTotals).reduce((a, b) => a + b, 0);
  
  const weakAnswers = results
    .flatMap((result) =>
      (result.answerSheet || [])
        .filter((answer) => !answer.isCorrect)
        .slice(0, 3)
        .map((answer) => answer.questionText || "Unknown question")
    )
    .slice(0, 5);
  
  const relevantResource = resources.find((resource) =>
    lower.includes(String(resource.title || "").toLowerCase().slice(0, 8))
  );
  const activeExam = exams.find((exam) => ["live", "scheduled"].includes(exam.status)) || exams[0];
  const sampleQuestion = questions.find((item) =>
    lower.includes(String(item.questionText || "").toLowerCase().slice(0, 12))
  ) || questions[0];

  const lines = [];

  // Welcome message based on performance
  if (results.length === 0) {
    lines.push(`Hi ${user.name || "there"}! 👋 Welcome to your personalized AI tutor. I can see you're just getting started. Let me help you prepare strategically for your upcoming exams and assignments.`);
  } else if (avgScore >= 80) {
    lines.push(`Hi ${user.name || "there"}! 🌟 You're performing well with an average score of ${avgScore}%. Let's build on this momentum and tackle any remaining challenges.`);
  } else if (avgScore >= 60) {
    lines.push(`Hi ${user.name || "there"}! 📈 You're at ${avgScore}% average. There's room for improvement, and I'm here to help you identify weak areas and build a stronger study strategy.`);
  } else {
    lines.push(`Hi ${user.name || "there"}! 💪 I can see you're working hard. Your current average is ${avgScore}%. Let's work together to turn things around with targeted practice and focused studying.`);
  }

  // Handle file uploads
  if (file) {
    lines.push(
      file.mimetype?.startsWith("image/")
        ? `📸 I see you've uploaded an image. Please describe which question or topic you need help with, and I'll provide a step-by-step explanation.`
        : `📄 I received: ${file.originalname}. Walk me through the specific concept or question you find challenging, and I'll break it down for you.`
    );
  }

  // Mode-specific detailed analysis
  if (mode === "results" || lower.includes("result") || lower.includes("analyze")) {
    lines.push("📊 **PERFORMANCE ANALYSIS**");
    
    if (latestResult) {
      lines.push(
        `Latest Assessment: ${latestResult.testName || "Test"} - ${latestResult.percentage || 0}%`,
        `Average Score: ${avgScore}%`,
        improvementTrend > 0 ? `📈 Progress: +${improvementTrend}% improvement from last attempt` : `📉 Trend: ${improvementTrend}% change from last attempt`
      );
    }

    if (strongResults.length) {
      lines.push(
        `✅ **Your Strengths:**`,
        strongResults.map(r => `• ${r.testName || "Assessment"} (${r.percentage}%)`).join("\n")
      );
    }

    if (weakResults.length) {
      lines.push(
        `⚠️ **Areas to Focus:**`,
        weakResults.map(r => `• ${r.testName || "Assessment"} (${r.percentage}%) - Needs attention`).join("\n"),
        "Strategy: Review the concepts from these tests, redo practice questions, and ask me for explanations of tricky topics."
      );
    }

    if (weakAnswers.length) {
      lines.push(
        `❓ **Commonly Missed Questions:**`,
        weakAnswers.slice(0, 4).map(q => `• ${q}`).join("\n"),
        "Action: Send me these questions one by one, and I'll explain the reasoning behind each correct answer."
      );
    }

    if (totalViolations > 0) {
      lines.push(
        `⚡ **Proctoring Summary:** ${totalViolations} total signals detected`,
        `Breakdown: Copy/Paste (${detectionTotals.copy + detectionTotals.paste}), Tab switches (${detectionTotals.tab}), Gaze issues (${detectionTotals.eyes}), Focus loss (${detectionTotals.focus})`,
        "Tip: Minimize these by minimizing browser tabs, staying focused on the exam window, and maintaining good posture."
      );
    }
  }

  if (mode === "assignment" || lower.includes("assignment") || lower.includes("homework")) {
    lines.push("📝 **ASSIGNMENT GUIDANCE**");
    
    if (pendingAssignments.length > 0) {
      lines.push(
        `⏰ **Pending (${pendingAssignments.length}):**`,
        pendingAssignments.map(a => `• ${a.title} (Due: ${a.dueDate || 'TBD'})`).join("\n")
      );
    }

    if (submittedAssignments.length > 0) {
      lines.push(
        `✅ **Completed (${submittedAssignments.length}):**`,
        submittedAssignments.map(a => `• ${a.title}`).join("\n")
      );
    }

    lines.push(
      `🎯 **How to Excel at Assignments:**`,
      `1. **Understand** - Read the requirements twice. Note key instructions and submission format.`,
      `2. **Plan** - Create an outline before writing. This saves time and keeps you organized.`,
      `3. **Draft** - Write your answer, include examples, calculations, or evidence as needed.`,
      `4. **Review** - Check for spelling, grammar, completeness, and adherence to guidelines.`,
      `5. **Submit** - Save in correct format and upload before the deadline.`,
      `💡 Pro tip: Start assignments 3-4 days early. This gives you time to revise and ask for clarification if needed.`
    );

    if (latestAssignment) {
      lines.push(`Current Focus: ${latestAssignment.title || "Your latest assignment"}. Send me the specific topic, and I'll help you structure your answer.`);
    }
  }

  if (mode === "quiz" || mode === "results" || lower.includes("quiz") || lower.includes("exam")) {
    lines.push("🧠 **QUIZ & EXAM STRATEGY**");
    
    if (latestResult) {
      lines.push(
        `Last Attempt: ${latestResult.testName} - ${latestResult.percentage}%`,
        `Target: Aim for 80%+ by focusing on weak topics and practicing similar questions.`
      );
    }

    if (activeExam) {
      lines.push(`📅 Upcoming: ${activeExam.title || "Assessment"} - ${activeExam.examDate || 'Schedule pending'}`);
    }

    lines.push(
      `🎓 **Proven Quiz Success Method:**`,
      `1. **Before** - Review notes on key topics, skim practice questions, be well-rested.`,
      `2. **During** - Read each question carefully, eliminate wrong options, manage time (don't rush).`,
      `3. **After** - Review wrong answers, understand the correct reasoning, note patterns.`,
      `💪 **Build Confidence:**`,
      `- Practice 10-15 random MCQs from your weak areas each day`,
      `- Time yourself to match exam conditions`,
      `- Ask me to explain any tricky concept`
    );
  }

  if (mode === "question" || lower.includes("question") || lower.includes("explain")) {
    lines.push("🔍 **QUESTION SOLVING GUIDE**");
    
    if (sampleQuestion) {
      lines.push(
        `Question: "${sampleQuestion.questionText || 'Unknown'}"`,
        `Correct Answer: ${sampleQuestion.correctAnswer || 'TBD'}`,
        `🧠 **Step-by-Step Approach:**`,
        `1. **Identify** - What concept is this testing?`,
        `2. **Recall** - What do I know about this topic?`,
        `3. **Analyze** - Eliminate obviously wrong options.`,
        `4. **Compare** - Evaluate remaining options logically.`,
        `5. **Justify** - Why is this answer correct?`
      );
    } else {
      lines.push(
        `📤 **Send me a question** - Copy/paste the question or upload an image, and I'll explain:`,
        `• What the question is asking`,
        `• Key concepts involved`,
        `• How to eliminate wrong answers`,
        `• Why the correct answer is right`
      );
    }
  }

  if (mode === "study" || lower.includes("study plan") || lower.includes("preparation")) {
    lines.push("📚 **PERSONALIZED STUDY PLAN**");
    
    const totalPending = pendingAssignments.length;
    const totalResults = results.length;
    
    lines.push(
      `📋 **Your Current Status:**`,
      `• Pending Assignments: ${totalPending}`,
      `• Completed Assessments: ${totalResults}`,
      `• Study Resources Available: ${resources.length}`,
      `• Avg Performance: ${avgScore}%`,
      `\n🎯 **Recommended Weekly Schedule:**`,
      `Monday/Wednesday/Friday: Practice 20 MCQs from weak topics (1 hour)`,
      `Tuesday/Thursday: Review notes and assignments (1 hour each)`,
      `Weekend: Full practice test + error review (2-3 hours)`,
      `\n✅ **Action Items This Week:**`,
      `1. Complete ${totalPending} pending assignment(s)`,
      `2. Review ${weakResults.length} weak assessment(s) for patterns`,
      `3. Practice 5 questions from weak areas daily`,
      `4. Ask me to explain any concept you're uncertain about`
    );

    if (resources.length > 0) {
      lines.push(
        `📖 **Study Resources:**`,
        resources.slice(0, 3).map(r => `• ${r.title}`).join("\n")
      );
    }
  }

  if (mode === "general") {
    lines.push("📌 **TODAY'S FOCUS**");
    
    if (pendingAssignments.length > 0 || activeExam) {
      lines.push(
        `⚡ Priority Tasks:`,
        pendingAssignments.length > 0 ? `1. Submit ${pendingAssignments.length} pending assignment(s)` : ``,
        activeExam ? `${pendingAssignments.length > 0 ? '2' : '1'}. Prepare for ${activeExam.title}` : ``,
        latestResult && avgScore < 70 ? `\n2. Review weak areas (current avg: ${avgScore}%)` : ``
      ).filter(Boolean);
    } else {
      lines.push(`No urgent deadlines. This is a good time to:\n• Review notes from recent classes\n• Practice previous exam questions\n• Ask me about difficult concepts`);
    }
  }

  // Closing with next steps
  lines.push(
    `\n✨ **Next Step:** Choose a mode above or ask me a specific question about any assignment, exam, or topic you need help with.`
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

const getSocketUser = async (socket) => {
  const authToken = socket.handshake.auth?.token || "";
  const headerToken = socket.handshake.headers?.authorization?.split(" ")[1] || "";
  const token = authToken || headerToken;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return getDbUser(decoded.userId);
  } catch {
    return null;
  }
};

const emitCallError = (socket, message) => {
  socket.emit("call:error", { message });
};

const connectedChatUsers = new Map();
const chatUserRoom = (userId) => `user:${String(userId)}`;

const emitPresenceUpdate = async (userId, online) => {
  const chatLastSeenAt = new Date();
  await User.updateOne({ _id: userId }, { chatLastSeenAt, chatIsOnline: online });
  io.emit("presence:update", {
    userId: String(userId),
    online,
    lastSeenAt: chatLastSeenAt,
  });
};

io.use(async (socket, next) => {
  const user = await getSocketUser(socket);
  if (!user || !["student", "teacher", "admin"].includes(user.role)) {
    return next(new Error("Unauthorized chat socket."));
  }

  socket.dbUser = user;
  next();
});

io.on("connection", (socket) => {
  const user = socket.dbUser;
  const userId = String(user._id);
  const currentCount = connectedChatUsers.get(userId) || 0;
  connectedChatUsers.set(userId, currentCount + 1);
  socket.join(chatUserRoom(userId));
  emitPresenceUpdate(userId, true).catch((err) => console.log("SOCKET PRESENCE ONLINE ERROR:", err));

  socket.on("call:start", async ({ recipientId, type, callId } = {}) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(recipientId) || !["audio", "video"].includes(type)) {
        emitCallError(socket, "Select a valid contact before calling.");
        return;
      }

      const recipient = await User.findById(recipientId);
      if (!(await canChatWith(user, recipient))) {
        emitCallError(socket, "You cannot call this user.");
        return;
      }

      io.to(chatUserRoom(recipient._id)).emit("call:incoming", {
        callId,
        type,
        from: {
          id: user._id,
          name: user.name || user.email || "Portal User",
          role: user.role,
        },
      });
    } catch (err) {
      console.log("CALL START ERROR:", err);
      emitCallError(socket, "Call could not be started.");
    }
  });

  socket.on("call:accept", ({ recipientId, callId } = {}) => {
    if (!mongoose.Types.ObjectId.isValid(recipientId)) return;
    io.to(chatUserRoom(recipientId)).emit("call:accepted", { callId, fromId: user._id });
  });

  socket.on("call:reject", ({ recipientId, callId } = {}) => {
    if (!mongoose.Types.ObjectId.isValid(recipientId)) return;
    io.to(chatUserRoom(recipientId)).emit("call:rejected", { callId, fromId: user._id });
  });

  socket.on("call:end", ({ recipientId, callId } = {}) => {
    if (!mongoose.Types.ObjectId.isValid(recipientId)) return;
    io.to(chatUserRoom(recipientId)).emit("call:ended", { callId, fromId: user._id });
  });

  socket.on("webrtc:offer", ({ recipientId, callId, description } = {}) => {
    if (!mongoose.Types.ObjectId.isValid(recipientId) || !description) return;
    io.to(chatUserRoom(recipientId)).emit("webrtc:offer", { callId, fromId: user._id, description });
  });

  socket.on("webrtc:answer", ({ recipientId, callId, description } = {}) => {
    if (!mongoose.Types.ObjectId.isValid(recipientId) || !description) return;
    io.to(chatUserRoom(recipientId)).emit("webrtc:answer", { callId, fromId: user._id, description });
  });

  socket.on("webrtc:ice-candidate", ({ recipientId, callId, candidate } = {}) => {
    if (!mongoose.Types.ObjectId.isValid(recipientId) || !candidate) return;
    io.to(chatUserRoom(recipientId)).emit("webrtc:ice-candidate", { callId, fromId: user._id, candidate });
  });

  socket.on("disconnect", () => {
    const nextCount = Math.max((connectedChatUsers.get(userId) || 1) - 1, 0);
    if (nextCount > 0) {
      connectedChatUsers.set(userId, nextCount);
      return;
    }

    connectedChatUsers.delete(userId);
    emitPresenceUpdate(userId, false).catch((err) => console.log("SOCKET PRESENCE OFFLINE ERROR:", err));
  });
});

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

    const accessMessage = await assertPortalAccess("teacher");
    if (accessMessage) {
      return res.status(403).json({ message: accessMessage });
    }

    if (user.approvalStatus !== "approved") {
      return res.status(403).json({
        message: "This teacher account access is currently restricted by admin.",
      });
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

    if (user.role === "teacher") {
      const accessMessage = await assertPortalAccess("teacher");
      if (accessMessage) {
        return res.status(403).json({ message: accessMessage });
      }

      if (user.approvalStatus !== "approved") {
        return res.status(403).json({
          message: "This teacher account access is currently restricted by admin.",
        });
      }
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

    const accessMessage = await assertPortalAccess("student");
    if (accessMessage) {
      return res.status(403).json({ message: accessMessage });
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

const verifyChatUser = async (req, res, next) => {
  try {
    const user = await getDbUser(req.user?.userId);

    if (!user || !["student", "teacher", "admin"].includes(user.role)) {
      return res.status(403).json({ message: "Only portal users can open chat." });
    }

    if (user.role !== "admin") {
      const accessMessage = await assertPortalAccess(user.role);
      if (accessMessage) {
        return res.status(403).json({ message: accessMessage });
      }

      if (user.approvalStatus !== "approved") {
        return res.status(403).json({ message: "Your account is not approved for portal chat yet." });
      }
    }

    req.dbUser = user;
    next();
  } catch (err) {
    console.log("VERIFY CHAT USER ERROR:", err);
    res.status(500).json({ message: "Chat access check failed." });
  }
};

const buildChatPayload = (message) => {
  const item = message?.toObject ? message.toObject() : message;
  return {
    ...item,
    fileData: undefined,
    fileUrl: item.fileUrl ? `/uploads/${item.fileUrl}` : "",
  };
};

const CHAT_ONLINE_WINDOW_MS = 90 * 1000;

const buildChatStatus = (lastSeenAt, chatIsOnline = false) => {
  const seenAt = lastSeenAt ? new Date(lastSeenAt) : null;
  const online = Boolean(chatIsOnline && seenAt && Date.now() - seenAt.getTime() < CHAT_ONLINE_WINDOW_MS);
  return {
    online,
    lastSeenAt: seenAt,
  };
};

const buildChatContactPayload = (user) => ({
  id: user._id,
  name: user.name || user.email || "Portal User",
  email: user.email || "",
  role: user.role,
  classroomName: user.classroomName || "",
  rollNumber: user.rollNumber || "",
  ...buildChatStatus(user.chatLastSeenAt, user.chatIsOnline),
});

const getConversationParticipants = (userId, recipientId) => {
  const ids = [String(userId), String(recipientId)].sort();
  return {
    participantA: ids[0],
    participantB: ids[1],
    conversationKey: `${ids[0]}:${ids[1]}`,
  };
};

const normalizeChatCode = (value) => normalizeText(value);

const hashChatCode = (code, conversationKey) =>
  crypto.createHash("sha256").update(`${conversationKey}:${code}:${JWT_SECRET}`).digest("hex");

const secureCompare = (left, right) => {
  const leftBuffer = Buffer.from(String(left || ""), "hex");
  const rightBuffer = Buffer.from(String(right || ""), "hex");
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const ensureChatSession = async (userId, recipientId, rawCode, { create = false } = {}) => {
  const code = normalizeChatCode(rawCode);
  if (code.length < 4) {
    const error = new Error("Enter the private chat code. It must be at least 4 characters.");
    error.statusCode = 400;
    throw error;
  }

  const participants = getConversationParticipants(userId, recipientId);
  const expectedHash = hashChatCode(code, participants.conversationKey);
  let session = await ChatSession.findOne({
    participantA: participants.participantA,
    participantB: participants.participantB,
  }).select("+codeHash");

  if (!session) {
    if (!create) {
      const error = new Error("This chat is locked. Enter the same code first.");
      error.statusCode = 403;
      throw error;
    }

    session = await ChatSession.create({
      participantA: participants.participantA,
      participantB: participants.participantB,
      codeHash: expectedHash,
    });
    session.codeHash = expectedHash;
    return session;
  }

  if (!secureCompare(session.codeHash, expectedHash)) {
    const error = new Error("Wrong chat code for this conversation.");
    error.statusCode = 403;
    throw error;
  }

  return session;
};

const getChatFileType = (file) => {
  if (!file) return "";
  if (/^video\//i.test(file.mimetype || "")) return "video";
  if (/^audio\//i.test(file.mimetype || "")) return "audio";
  return "image";
};

const getChatContacts = async (user) => {
  if (user.role === "admin") {
    return User.find({ _id: { $ne: user._id }, role: { $in: ["student", "teacher"] } })
      .select("name email role classroomName rollNumber chatLastSeenAt chatIsOnline")
      .sort({ role: 1, name: 1 })
      .lean();
  }

  if (user.role === "teacher") {
    const teacherClassrooms = await Classroom.find({ teacherId: user._id }).select("_id").lean();
    const classroomIds = teacherClassrooms.map((classroom) => classroom._id);
    return User.find({
      role: "student",
      approvalStatus: "approved",
      $or: [
        { teacherId: user._id },
        { classroomId: { $in: classroomIds } },
      ],
    })
      .select("name email role classroomName rollNumber chatLastSeenAt chatIsOnline")
      .sort({ classroomName: 1, name: 1 })
      .lean();
  }

  const teacherIds = [];
  if (user.teacherId) teacherIds.push(user.teacherId);

  if (user.classroomId) {
    const classroom = await Classroom.findById(user.classroomId).select("teacherId").lean();
    if (classroom?.teacherId) teacherIds.push(classroom.teacherId);
  }

  return User.find({
    _id: { $in: [...new Set(teacherIds.map(String))] },
    role: "teacher",
    approvalStatus: "approved",
  })
    .select("name email role classroomName rollNumber chatLastSeenAt chatIsOnline")
    .sort({ name: 1 })
    .lean();
};

const canChatWith = async (user, recipient) => {
  if (!recipient || String(user._id) === String(recipient._id)) return false;
  if (user.role === "admin") return ["student", "teacher"].includes(recipient.role);
  if (user.role === "teacher") {
    if (recipient.role !== "student" || recipient.approvalStatus !== "approved") return false;
    if (String(recipient.teacherId || "") === String(user._id)) return true;
    const teacherClassroom = recipient.classroomId
      ? await Classroom.exists({ _id: recipient.classroomId, teacherId: user._id })
      : null;
    return Boolean(teacherClassroom);
  }

  if (user.role === "student") {
    if (recipient.role !== "teacher" || recipient.approvalStatus !== "approved") return false;
    if (String(user.teacherId || "") === String(recipient._id)) return true;
    const classroom = user.classroomId
      ? await Classroom.exists({ _id: user.classroomId, teacherId: recipient._id })
      : null;
    return Boolean(classroom);
  }

  return false;
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

app.get("/api/chat/contacts", verifyToken, verifyChatUser, async (req, res) => {
  try {
    await User.updateOne({ _id: req.dbUser._id }, { chatLastSeenAt: new Date(), chatIsOnline: true });
    const contacts = await getChatContacts(req.dbUser);
    res.json(contacts.map(buildChatContactPayload));
  } catch (err) {
    console.log("CHAT CONTACTS ERROR:", err);
    res.status(500).json({ message: "Failed to load chat contacts." });
  }
});

app.post("/api/chat/heartbeat", verifyToken, verifyChatUser, async (req, res) => {
  try {
    const chatLastSeenAt = new Date();
    await User.updateOne({ _id: req.dbUser._id }, { chatLastSeenAt, chatIsOnline: true });
    res.json({ ...buildChatStatus(chatLastSeenAt, true), lastSeenAt: chatLastSeenAt });
  } catch (err) {
    console.log("CHAT HEARTBEAT ERROR:", err);
    res.status(500).json({ message: "Failed to update chat status." });
  }
});

app.post("/api/chat/offline", verifyToken, verifyChatUser, async (req, res) => {
  try {
    const chatLastSeenAt = new Date();
    await User.updateOne({ _id: req.dbUser._id }, { chatLastSeenAt, chatIsOnline: false });
    res.json({ ...buildChatStatus(chatLastSeenAt, false), lastSeenAt: chatLastSeenAt });
  } catch (err) {
    console.log("CHAT OFFLINE ERROR:", err);
    res.status(500).json({ message: "Failed to update chat status." });
  }
});

app.post("/api/chat/session", verifyToken, verifyChatUser, async (req, res) => {
  try {
    const recipientId = normalizeText(req.body.recipientId);
    const chatCode = normalizeChatCode(req.body.chatCode);

    if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ message: "Select a student or teacher first." });
    }

    const recipient = await User.findById(recipientId);
    if (!(await canChatWith(req.dbUser, recipient))) {
      return res.status(403).json({ message: "You cannot open this chat." });
    }

    const session = await ensureChatSession(req.dbUser._id, recipient._id, chatCode, { create: true });
    res.json({
      unlocked: true,
      sessionId: session._id,
      message: "Secure chat unlocked.",
    });
  } catch (err) {
    console.log("CHAT SESSION ERROR:", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Chat code verification failed." });
  }
});

app.get("/api/chat/messages", verifyToken, verifyChatUser, async (req, res) => {
  try {
    const recipientId = normalizeText(req.query.recipientId);
    const chatCode = normalizeChatCode(req.query.chatCode);
    if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ message: "Select a student or teacher first." });
    }

    const recipient = await User.findById(recipientId);
    if (!(await canChatWith(req.dbUser, recipient))) {
      return res.status(403).json({ message: "You cannot open this chat." });
    }

    await ensureChatSession(req.dbUser._id, recipient._id, chatCode);

    await ChatMessage.updateMany(
      { senderId: recipientId, recipientId: req.dbUser._id, readAt: null },
      { readAt: new Date() }
    );

    const messages = await ChatMessage.find({})
      .or([
        { senderId: req.dbUser._id, recipientId },
        { senderId: recipientId, recipientId: req.dbUser._id },
      ])
      .sort({ createdAt: -1 })
      .limit(120)
      .lean();

    res.json(messages.reverse().map(buildChatPayload));
  } catch (err) {
    console.log("CHAT FETCH ERROR:", err);
    res.status(500).json({ message: "Failed to load chat messages." });
  }
});

app.post(
  "/api/chat/messages",
  verifyToken,
  verifyChatUser,
  chatUpload.single("file"),
  async (req, res) => {
    try {
      const text = normalizeText(req.body.text);
      const fileUrl = req.file ? toRelativeUploadPath(req.file.path) : "";
      const recipientId = normalizeText(req.body.recipientId);
      const chatCode = normalizeChatCode(req.body.chatCode);

      if (!text && !fileUrl) {
        return res.status(400).json({ message: "Type a message or attach a picture/video/voice note." });
      }

      if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
        return res.status(400).json({ message: "Select a student or teacher first." });
      }

      const recipient = await User.findById(recipientId);
      if (!(await canChatWith(req.dbUser, recipient))) {
        return res.status(403).json({ message: "You cannot send a message to this user." });
      }

      const session = await ensureChatSession(req.dbUser._id, recipient._id, chatCode, { create: true });

      const message = await ChatMessage.create({
        senderId: req.dbUser._id,
        senderName: req.dbUser.name || req.dbUser.email || "Portal User",
        senderRole: req.dbUser.role,
        recipientId: recipient._id,
        recipientName: recipient.name || recipient.email || "Portal User",
        recipientRole: recipient.role,
        text,
        fileUrl,
        fileType: getChatFileType(req.file),
        originalFileName: req.file?.originalname || "",
      });
      session.lastMessageAt = new Date();
      await session.save();

      res.status(201).json(buildChatPayload(message));
    } catch (err) {
      console.log("CHAT SEND ERROR:", err);
      res.status(500).json({ message: err.message || "Failed to send chat message." });
    }
  }
);

app.delete("/api/chat/messages", verifyToken, verifyChatUser, async (req, res) => {
  try {
    const recipientId = normalizeText(req.query.recipientId);
    const chatCode = normalizeChatCode(req.query.chatCode);
    if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ message: "Select a chat before clearing it." });
    }

    const recipient = await User.findById(recipientId);
    if (!(await canChatWith(req.dbUser, recipient))) {
      return res.status(403).json({ message: "You cannot clear this chat." });
    }

    await ensureChatSession(req.dbUser._id, recipient._id, chatCode);

    const conversationQuery = {
      $or: [
        { senderId: req.dbUser._id, recipientId },
        { senderId: recipientId, recipientId: req.dbUser._id },
      ],
    };
    const messages = await ChatMessage.find({ ...conversationQuery, fileUrl: { $ne: "" } }).select("fileUrl").lean();
    messages.forEach((message) => removeFileIfExists(message.fileUrl));
    await ChatMessage.deleteMany(conversationQuery);
    await ChatSession.deleteOne({
      participantA: getConversationParticipants(req.dbUser._id, recipientId).participantA,
      participantB: getConversationParticipants(req.dbUser._id, recipientId).participantB,
    });

    res.json({ message: "Chat cleared for both users. A new code will be required next time." });
  } catch (err) {
    console.log("CHAT CLEAR ERROR:", err);
    res.status(500).json({ message: "Failed to clear chat." });
  }
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

    const accessMessage = await assertPortalAccess(user.role);
    if (accessMessage) {
      return res.status(403).json({ message: accessMessage });
    }

    if (["student", "teacher"].includes(user.role) && user.approvalStatus !== "approved") {
      return res.status(403).json({
        message:
          user.role === "student" && user.approvalStatus === "pending"
            ? "Teacher approval is still pending for this student account."
            : `This ${user.role} account access is currently restricted by admin.`,
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

app.put("/api/auth/profile", verifyToken, async (req, res) => {
  try {
    const user = await getDbUser(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const name = normalizeText(req.body.name);
    const email = normalizeText(req.body.email).toLowerCase();
    const department = normalizeText(req.body.department);
    const rollNumber = normalizeText(req.body.rollNumber);

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required." });
    }

    const existing = await User.findOne({ email, _id: { $ne: user._id } });
    if (existing) {
      return res.status(400).json({ message: "This email is already in use." });
    }

    user.name = name;
    user.email = email;
    if (user.role === "teacher" || user.role === "admin") {
      user.department = department;
    }
    if (user.role === "student") {
      user.rollNumber = rollNumber;
    }

    await user.save();
    const managedClassrooms = user.role === "teacher" ? await ensureTeacherWorkspace(user) : [];

    res.json({
      message: "Profile updated successfully.",
      user: buildUserPayload(user, managedClassrooms),
    });
  } catch (err) {
    console.log("PROFILE UPDATE ERROR:", err);
    res.status(500).json({ message: "Failed to update profile." });
  }
});

app.put("/api/auth/change-password", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = "";
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: "Password changed successfully." });
  } catch (err) {
    console.log("CHANGE PASSWORD ERROR:", err);
    res.status(500).json({ message: "Failed to change password." });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const email = normalizeText(req.body.email).toLowerCase();
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email }).select("+resetPasswordToken +resetPasswordExpires");
    const genericMessage = "If an account exists for this email, a password reset link has been sent.";

    if (!user) {
      return res.json({ message: genericMessage });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = hashResetToken(rawToken);
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const resetUrl = `${getClientUrl()}/reset-password?token=${rawToken}`;
    const emailResult = await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl,
    });

    res.json({
      message: genericMessage,
      resetPreviewUrl: !emailResult.sent ? resetUrl : undefined,
    });
  } catch (err) {
    console.log("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ message: "Failed to start password reset." });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const token = normalizeText(req.body.token);
    const newPassword = String(req.body.newPassword || "");

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Reset token and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    const user = await User.findOne({
      resetPasswordToken: hashResetToken(token),
      resetPasswordExpires: { $gt: new Date() },
    }).select("+password +resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or expired." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = "";
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: "Password reset successfully. You can now sign in." });
  } catch (err) {
    console.log("RESET PASSWORD ERROR:", err);
    res.status(500).json({ message: "Failed to reset password." });
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

    res.json(user.role === "teacher" ? questions : questions.map(buildStudentQuestionPayload));
  } catch (err) {
    console.log("FETCH EXAM QUESTIONS ERROR:", err);
    res.status(500).json({ message: "Failed to load questions" });
  }
});

app.delete("/api/questions/delete/:id", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const teacherExams = await Exam.find({ teacherId: req.dbUser._id }).select("_id");
    const examIds = teacherExams.map((exam) => exam._id);
    const deletedQuestion = await Question.findOneAndDelete({
      _id: req.params.id,
      examId: { $in: examIds },
    });

    if (!deletedQuestion) {
      return res.status(404).json({ message: "Question not found." });
    }

    res.json({ message: "Question deleted." });
  } catch (err) {
    console.log("DELETE QUESTION ERROR:", err);
    res.status(500).json({ message: "Failed to delete question." });
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

app.delete("/api/results/my/:id", verifyToken, verifyApprovedStudent, async (req, res) => {
  try {
    const deletedResult = await Result.findOneAndDelete({
      _id: req.params.id,
      userId: req.dbUser._id,
      assessmentType: "quiz",
    });

    if (!deletedResult) {
      return res.status(404).json({ message: "Quiz attempt not found." });
    }

    res.json({ message: "Quiz attempt deleted successfully." });
  } catch (err) {
    console.log("STUDENT RESULT DELETE ERROR:", err);
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

      const payload = assignments.map((assignment) => {
        const submissionsForAssignment = (grouped[String(assignment._id)] || []).map(buildSubmissionPayload);
        return {
          ...buildAssignmentPayload(assignment),
          submissions: submissionsForAssignment,
          submissionCount: submissionsForAssignment.length,
        };
      });

      return res.json(payload);
    }

    const assignments = await Assignment.find(await buildStudentClassroomScope(user)).sort({ createdAt: -1 });
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
        ...buildAssignmentPayload(assignment),
        mySubmission: mySubmission ? buildSubmissionPayload(mySubmission) : null,
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

app.get("/api/assignments/file/:kind/:id", verifyToken, async (req, res) => {
  try {
    const user = await getDbUser(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const kind = normalizeText(req.params.kind);
    const id = normalizeText(req.params.id);
    let fileUrl = "";
    let fileName = "assignment-file";
    let assignmentRecord = null;

    if (kind === "assignment") {
      const assignment = await Assignment.findById(id);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found." });
      }
      assignmentRecord = assignment;

      const studentScope = user.role === "student" ? await buildStudentClassroomScope(user) : null;
      const studentCanAccess = user.role === "student"
        ? Boolean(await Assignment.exists({ _id: assignment._id, ...studentScope }))
        : false;
      const canAccess =
        user.role === "admin" ||
        (user.role === "teacher" && String(assignment.teacherId) === String(user._id)) ||
        studentCanAccess;

      if (!canAccess) {
        return res.status(403).json({ message: "You cannot access this assignment file." });
      }

      fileUrl = assignment.fileUrl;
      fileName = assignment.title || "assignment-file";
    } else if (kind === "submission") {
      const submission = await Submission.findById(id);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found." });
      }

      const assignment = await Assignment.findById(submission.assignmentId);
      const canAccess =
        user.role === "admin" ||
        (user.role === "student" && String(submission.studentId) === String(user._id)) ||
        (user.role === "teacher" && assignment && String(assignment.teacherId) === String(user._id));

      if (!canAccess) {
        return res.status(403).json({ message: "You cannot access this submission file." });
      }

      fileUrl = submission.fileUrl;
      fileName = `${submission.studentName || "student"}-submission`;
    } else {
      return res.status(400).json({ message: "Invalid assignment file type." });
    }

    const fileRecord =
      kind === "assignment"
        ? await Assignment.findById(id).select("fileData fileMimeType originalFileName")
        : await Submission.findById(id).select("fileData fileMimeType originalFileName");

    if (fileRecord?.fileData) {
      const buffer = Buffer.from(fileRecord.fileData, "base64");
      res.setHeader("Content-Type", fileRecord.fileMimeType || "application/octet-stream");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${sanitizeFileName(fileRecord.originalFileName || fileName)}"`
      );
      return res.send(buffer);
    }

    if (!fileUrl || String(fileUrl).trim() === "") {
      console.log(`ASSIGNMENT FILE: No fileUrl found for ${kind}/${id}`);
      return res.status(404).json({ message: "No file attached to this assignment." });
    }

    const absolutePath = resolveUploadPath(fileUrl);
    
    if (!absolutePath) {
      console.log(`ASSIGNMENT FILE: resolveUploadPath returned empty for fileUrl="${fileUrl}"`);
      return res.status(404).json({ message: "Invalid file path on server." });
    }

    if (!fs.existsSync(absolutePath)) {
      console.log(`ASSIGNMENT FILE: File does not exist at path="${absolutePath}" (fileUrl="${fileUrl}")`);
      console.log(`  uploadsDir="${uploadsDir}"`);
      console.log(`  Checking directory contents:`, fs.readdirSync(uploadsDir).slice(0, 5));
      if (kind === "assignment" && assignmentRecord) {
        return sendAssignmentFallbackPreview(res, assignmentRecord, fileUrl);
      }

      return res.status(404).json({
        message: "Submitted file is not available on the server. Please ask the student to upload it again.",
      });
    }

    return res.sendFile(absolutePath, {
      headers: {
        "Content-Disposition": `inline; filename="${sanitizeFileName(fileName)}${path.extname(absolutePath)}"`,
      },
    });
  } catch (err) {
    console.log("ASSIGNMENT FILE ERROR:", err);
    res.status(500).json({ message: `Failed to load assignment file: ${err.message}` });
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

      let fileUrl = "";
      if (req.file) {
        fileUrl = toRelativeUploadPath(req.file.path);
        console.log("✅ ASSIGNMENT FILE UPLOAD:", {
          originalName: req.file.originalname,
          absolutePath: req.file.path,
          relativePath: fileUrl,
          fileExists: fs.existsSync(req.file.path),
        });
      } else {
        console.log("⚠️ ASSIGNMENT: No file provided");
      }

      const assignment = await Assignment.create({
        teacherId: req.dbUser._id,
        classroomId: classroom._id,
        classroomName: buildClassroomLabel(classroom),
        title,
        description,
        dueDate,
        fileUrl,
        ...buildDbFileBackup(req.file),
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

      res.status(201).json(buildAssignmentPayload(assignment));
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
  ["/api/assignments/upload", "/api/assignments/submit"],
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
        ...buildDbFileBackup(req.file),
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

      res.json({ message: "Assignment submitted successfully.", submission: buildSubmissionPayload(submission) });
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

    res.json({ message: "Marks added successfully", submission: buildSubmissionPayload(submission) });
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
    const mode = normalizeText(req.body.mode) || "general";
    if (!question) {
      return res.status(400).json({ message: "Question is required." });
    }

    const [assignmentsRaw, submissions, results, resources, exams] = await Promise.all([
      Assignment.find({ classroomId: user.classroomId || null }).sort({ createdAt: -1 }).limit(12).lean(),
      Submission.find({ studentId: user._id }).sort({ submittedAt: -1 }).limit(20).lean(),
      Result.find({ userId: user._id }).sort({ createdAt: -1 }).limit(12).lean(),
      StudyResource.find({ classroomId: user.classroomId || null }).sort({ createdAt: -1 }).limit(12).lean(),
      Exam.find({ classroomId: user.classroomId || null }).sort({ createdAt: -1 }).limit(12).lean(),
    ]);
    const submissionMap = submissions.reduce((acc, submission) => {
      acc[String(submission.assignmentId)] = submission;
      return acc;
    }, {});
    const assignments = assignmentsRaw.map((assignment) => ({
      ...assignment,
      mySubmission: submissionMap[String(assignment._id)] || null,
    }));
    const examIds = exams.map((exam) => exam._id);
    const scopedQuestions = examIds.length
      ? await Question.find({ examId: { $in: examIds } }).sort({ createdAt: -1 }).limit(30).lean()
      : [];
    const context = formatTutorContext({
      user,
      assignments,
      results,
      resources,
      exams,
      questions: scopedQuestions,
    });
    const openAiAnswer = await callOpenAiTutor({ question, context, mode, file: req.file });
    const answer =
      openAiAnswer ||
      buildLocalTutorAnswer({
        user,
        question,
        mode,
        assignments,
        results,
        resources,
        exams,
        questions: scopedQuestions,
        file: req.file,
      });

    res.json({
      answer,
      mode: openAiAnswer ? "ai" : "contextual-fallback",
      tutorMode: mode,
      contextSummary: {
        assignments: assignments.length,
        pendingAssignments: assignments.filter((assignment) => !assignment.mySubmission).length,
        results: results.length,
        resources: resources.length,
        assessments: exams.length,
        questions: scopedQuestions.length,
      },
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

app.post(
  "/api/quiz-generator",
  verifyToken,
  tutorUpload.single("file"),
  async (req, res) => {
    try {
      const user = await getDbUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      const title = normalizeText(req.body.title);
      const subject = normalizeText(req.body.subject) || "General";
      const category = normalizeText(req.body.category) || subject;
      const difficulty = normalizeText(req.body.difficulty) || "medium";
      const language = normalizeText(req.body.language) || "english";
      const timeLimit = Number(req.body.timeLimit) || 0;
      const randomize = String(req.body.randomize) === "true";
      const negativeMarking = String(req.body.negativeMarking) === "false" ? false : true;

      if (!title) {
        return res.status(400).json({ message: "Quiz title is required." });
      }

      // Extract text from file with enhanced OCR and PDF support
      let extractedText = "";
      let extractionConfidence = 0;
      let sourceType = "text";
      const fileIsImage = Boolean(req.file?.mimetype?.startsWith("image/"));
      const canUseVisionModel = Boolean(process.env.OPENAI_API_KEY && fileIsImage);

      if (req.file) {
        sourceType = "file";
        console.log(`Analyzing ${req.file.originalname}...`);
        extractedText = await extractTextFromUploadedFile(req.file);

        if (!extractedText && !canUseVisionModel) {
          return res.status(400).json({
            message:
              "Could not extract readable text from the uploaded file. For images, upload a clearer picture with visible text. For scanned PDFs, paste the text or upload the page as an image.",
          });
        }
      }

      // Use provided text or fall back to extracted text
      const payloadText =
        normalizeText(req.body.text) ||
        extractedText ||
        (canUseVisionModel
          ? "Generate MCQs by visually analyzing the uploaded image. Use only readable content visible in the image."
          : "");

      if ((!payloadText || payloadText.length < 50) && !canUseVisionModel) {
        return res.status(400).json({
          message:
            "Insufficient content provided. Please provide at least 50 characters of educational material.",
        });
      }

      // Normalize and clean the extracted text
      const cleanedText = normalizeExtractedText(payloadText);

      // Extract concepts to inform AI
      const concepts = extractConceptsFromText(cleanedText);

      // Calculate question count. Keep 100 as the production ceiling to avoid runaway jobs.
      const questionCount = Math.max(Math.min(Number(req.body.count) || 6, 100), 3);

      // Call enhanced AI quiz generator with new prompt
      console.log(
        `Generating ${questionCount} ${difficulty} MCQs in ${language}...`
      );

      let generated = await callOpenAiQuizGenerator({
        payloadText: cleanedText,
        count: questionCount,
        difficulty,
        subject,
        category,
        language,
        file: req.file,
      });

      if (!generated?.questions?.length && cleanedText.length >= 50) {
        const fallbackQuestions = generateFallbackMCQs(
          cleanedText,
          questionCount,
          difficulty,
          subject
        );
        if (fallbackQuestions.length) {
          generated = {
            title: `Quiz on ${subject}`,
            subject,
            category,
            difficulty,
            language,
            questions: fallbackQuestions,
          };
        }
      }

      if (!generated || !generated.questions || generated.questions.length === 0) {
        return res.status(500).json({
          message:
            "AI quiz generation failed. The uploaded image/PDF did not provide enough readable material for real MCQs. Please upload a clearer file or paste the study text.",
          details: {
            contentLength: cleanedText.length,
            conceptsFound: concepts.conceptCount,
            requestedCount: questionCount,
          },
        });
      }

      // Validate and compact generated questions into PPSC/FPSC-style MCQs.
      let validatedQuestions = (generated.questions || [])
        .map((q) =>
          sanitizeCompetitiveMCQ(
            q,
            difficulty,
            subject,
            (generated.questions || []).flatMap((item) => item.options || [])
          )
        )
        .filter(Boolean)
        .slice(0, questionCount);

      if (validatedQuestions.length < questionCount && cleanedText.length >= 50) {
        const existingStems = new Set(
          validatedQuestions.map((item) => normalizeText(item.questionText).toLowerCase())
        );
        const fallbackPool = generateFallbackMCQs(
          cleanedText,
          questionCount * 2,
          difficulty,
          subject
        );

        fallbackPool.forEach((item) => {
          const key = normalizeText(item.questionText).toLowerCase();
          if (key && !existingStems.has(key) && validatedQuestions.length < questionCount) {
            existingStems.add(key);
            validatedQuestions.push(item);
          }
        });
      }

      if (validatedQuestions.length === 0) {
        return res.status(500).json({
          message:
            "Generated questions did not meet quality standards. Please try again with different content.",
        });
      }

      if (validatedQuestions.length < questionCount) {
        return res.status(422).json({
          message: `Only ${validatedQuestions.length} quality MCQs could be generated from the uploaded content. Please upload more readable study material or reduce the requested MCQ count.`,
          details: {
            generatedCount: validatedQuestions.length,
            requestedCount: questionCount,
            contentLength: cleanedText.length,
            conceptsFound: concepts.conceptCount,
          },
        });
      }

      // Create quiz document
      const quiz = new Quiz({
        title,
        subject,
        category,
        difficulty,
        timeLimit,
        randomize,
        negativeMarking,
        sourceType,
        sourceText: cleanedText,
        sourceFile: req.file ? toRelativeUploadPath(req.file.path) : "",
        createdBy: user._id,
      });

      await quiz.save();

      // Save generated questions with enhanced metadata
      const questionDocs = await GeneratedQuestion.insertMany(
        validatedQuestions.map((item, idx) => ({
          quizId: quiz._id,
          questionText: normalizeText(item.questionText || item.question || ""),
          options: (item.options || [])
            .map((opt) => normalizeText(opt || ""))
            .filter(Boolean),
          correctAnswer: normalizeText(
            item.correctAnswer || item.answer || ""
          ),
          explanation: normalizeText(item.explanation || ""),
          difficultyTag: normalizeText(
            item.difficultyTag || difficulty || "medium"
          ),
          topic: normalizeText(
            item.topic || item.topicName || category || "General"
          ),
          conceptsInvolved: item.conceptsInvolved || [],
          order: idx + 1,
        }))
      );

      quiz.questions = questionDocs.map((question) => question._id);
      await quiz.save();

      // Populate and return the complete quiz
      const responseQuiz = await Quiz.findById(quiz._id)
        .populate("questions")
        .lean();

      // Add metadata about generation
      const enhancedQuiz = enhanceQuizMetadata(responseQuiz, {
        sourceType,
        sourceFile: req.file?.originalname || null,
        textLength: cleanedText.length,
        confidence: extractionConfidence,
      });

      res.json({
        message: "AI Quiz generated successfully with real, meaningful questions!",
        quiz: enhancedQuiz,
        generationStats: {
          questionsGenerated: validatedQuestions.length,
          difficulty,
          language,
          sourceType,
          contentAnalysis: {
            contentLength: cleanedText.length,
            conceptsIdentified: concepts.conceptCount,
            topicsCovered: concepts.concepts.slice(0, 5),
          },
        },
      });
    } catch (err) {
      console.log("QUIZ GENERATOR ERROR:", err);
      res.status(500).json({
        message: "Quiz generation encountered an error. Please try again.",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }
);

app.get("/api/quiz-generator/my", verifyToken, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user.userId })
      .sort({ createdAt: -1 })
      .populate("questions")
      .lean();

    res.json(quizzes);
  } catch (err) {
    console.log("QUIZ FETCH ERROR:", err);
    res.status(500).json({ message: "Failed to load saved quizzes." });
  }
});

app.delete("/api/quiz-generator/:id", verifyToken, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      createdBy: req.user.userId,
    });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    await GeneratedQuestion.deleteMany({ quizId: quiz._id });

    if (quiz.sourceFile) {
      const absolutePath = path.resolve(uploadsDir, quiz.sourceFile);
      if (absolutePath.startsWith(path.resolve(uploadsDir)) && fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }

    await quiz.deleteOne();
    res.json({ message: "Quiz deleted successfully." });
  } catch (err) {
    console.log("QUIZ DELETE ERROR:", err);
    res.status(500).json({ message: "Failed to delete quiz." });
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
      query = await buildStudentClassroomScope(user);
    }

    const resources = await StudyResource.find(query).sort({ createdAt: -1 }).lean();
    res.json(resources.map(buildStudyResourcePayload));
  } catch (err) {
    console.log("STUDY VAULT FETCH ERROR:", err);
    res.status(500).json({ message: "Failed to load study vault." });
  }
});

app.get("/api/study-vault/file/:id", verifyToken, async (req, res) => {
  try {
    const user = await getDbUser(req.user.userId);
    const resource = await StudyResource.findById(req.params.id);

    if (!user || !resource) {
      return res.status(404).send("Study resource file not found.");
    }

    const isAdmin = user.role === "admin";
    const isTeacher = user.role === "teacher" && String(resource.teacherId || "") === String(user._id);
    const studentScope = user.role === "student" ? await buildStudentClassroomScope(user) : null;
    const isStudent =
      user.role === "student" && Boolean(await StudyResource.exists({ _id: resource._id, ...studentScope }));

    if (!isAdmin && !isTeacher && !isStudent) {
      return res.status(403).send("You do not have access to this study resource.");
    }

    if (resource.fileData && resource.fileMimeType) {
      const buffer = Buffer.from(resource.fileData, "base64");
      res.setHeader("Content-Type", resource.fileMimeType);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${sanitizeFileName(resource.originalFileName || resource.title || "study-resource")}"`
      );
      return res.send(buffer);
    }

    if (resource.fileUrl) {
      const absolutePath = resolveUploadPath(resource.fileUrl);
      if (absolutePath && fs.existsSync(absolutePath)) {
        return res.sendFile(absolutePath);
      }
    }

    res.status(404).send("This uploaded file is no longer available. Please upload it again.");
  } catch (err) {
    console.log("STUDY VAULT FILE ERROR:", err);
    res.status(500).send("Failed to open study resource file.");
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
        fileData: req.file ? fs.readFileSync(req.file.path).toString("base64") : "",
        fileMimeType: req.file?.mimetype || "",
        originalFileName: req.file?.originalname || "",
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

      res.status(201).json(buildStudyResourcePayload(resource));
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
      accessControl,
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
      getSystemAccess(),
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
        blockedStudents: students.filter((student) => student.approvalStatus === "rejected").length,
        blockedTeachers: teachers.filter((teacher) => teacher.approvalStatus === "rejected").length,
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
      accessControl: buildAccessPayload(accessControl),
      classrooms,
      exams,
      aiExams,
      quizzes,
      questions,
      results,
      aiExamResults,
      quizResults,
      assignments: assignments.map(buildAssignmentPayload),
      submissions: submissions.map(buildSubmissionPayload),
      notifications,
      studyResources: studyResources.map(buildStudyResourcePayload),
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

app.put("/api/admin/access-control", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const update = {};

    ["systemAccess", "studentAccess", "teacherAccess"].forEach((key) => {
      if (typeof req.body[key] === "boolean") {
        update[key] = req.body[key];
      }
    });

    update.updatedBy = req.dbUser.name || "System Admin";

    const access = await SystemAccess.findOneAndUpdate(
      { key: "global" },
      { $set: update, $setOnInsert: { key: "global" } },
      { new: true, upsert: true }
    ).lean();

    res.json({
      message: "System access controls updated.",
      accessControl: buildAccessPayload(access),
    });
  } catch (err) {
    console.log("ADMIN ACCESS CONTROL ERROR:", err);
    res.status(500).json({ message: "Failed to update system access controls." });
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
    if (!user || !["student", "teacher"].includes(user.role)) {
      return res.status(404).json({ message: "User account not found." });
    }

    user.approvalStatus = approvalStatus;
    await user.save();

    res.json({ message: `${user.role} status updated.`, user: buildUserPayload(user) });
  } catch (err) {
    console.log("ADMIN USER STATUS ERROR:", err);
    res.status(500).json({ message: "Failed to update user status." });
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

const violationWeights = {
  tab_switch: 10,
  focus_loss: 10,
  fullscreen_exit: 15,
  copy: 25,
  paste: 25,
  cut: 20,
  right_click: 12,
  text_selection: 8,
  inspect_element: 40,
  keyboard_shortcut: 20,
  print_screen: 30,
  browser_resize: 8,
  inactivity: 10,
  no_face: 25,
  multiple_faces: 50,
  looking_away: 20,
  head_movement: 15,
  voice_detected: 20,
  camera_disabled: 35,
  microphone_disabled: 15,
};

const getIntegrityStatus = (score) => {
  if (score >= 150) return "Failed Integrity Check";
  if (score >= 70) return "Suspicious";
  return "Passed";
};

const buildExamAIPayload = (exam) => ({
  id: exam._id,
  title: exam.title,
  description: exam.description || "",
  subject: exam.subject,
  duration: exam.duration,
  totalMarks: exam.totalMarks,
  passingMarks: exam.passingMarks,
  isPublished: exam.isPublished,
  status: exam.status,
  securitySettings: exam.securitySettings || {},
  aiMonitoring: exam.aiMonitoring || {},
  cheatingThresholds: exam.cheatingThresholds || {},
  questionCount: exam.questions?.length || exam.questionCount || 0,
  questions: (exam.questions || []).map((question) => ({
    id: question._id,
    questionText: question.questionText,
    options: question.options || [],
    correctAnswer: question.correctAnswer,
    explanation: question.explanation || "",
    topic: question.topic || exam.subject,
  })),
  createdAt: exam.createdAt,
});

app.get("/api/exam-ai", verifyToken, async (req, res) => {
  try {
    const user = await getDbUser(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    let query = {};
    let exams = [];

    if (user.role === "teacher") {
      // Teachers see only their own exams
      query = { createdBy: user._id };
    } else if (user.role === "student") {
      // Students see only published, active exams
      const now = new Date();
      
      query = {
        isPublished: true,
        isActive: true,
        status: { $in: ["published", "active"] },
        blockedStudents: { $ne: user._id }, // Not in blocked list
        
        $or: [
          // Assigned to their classroom
          {
            showAllClassroomStudents: true,
            classroom: user.classroomId || null,
          },
          // Explicitly allowed
          { allowedStudents: user._id },
        ],
      };

      // Time window check will be done in application logic
    } else if (user.role === "admin" || user.role === "staff") {
      // Admin/staff see all exams
      query = {};
    }

    exams = await ExamAI.find(query)
      .sort({ createdAt: -1 })
      .populate("questions")
      .lean();

    // Additional filtering for students based on time windows
    if (user.role === "student") {
      const now = new Date();
      exams = exams.filter((exam) => {
        const isWithinTime = (!exam.startTime || now >= exam.startTime) && 
                            (!exam.endTime || now <= exam.endTime);
        return isWithinTime;
      });
    }

    res.json(exams.map(buildExamAIPayload));
  } catch (err) {
    console.log("EXAM AI LIST ERROR:", err);
    res.status(500).json({ message: "Failed to load Exam AI workspace." });
  }
});

app.post("/api/exam-ai", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const title = normalizeText(req.body.title);
    const subject = normalizeText(req.body.subject) || "General";
    const duration = Number(req.body.duration) || 30;
    const passingMarks = Number(req.body.passingMarks) || 1;
    const questions = Array.isArray(req.body.questions) ? req.body.questions : [];

    if (!title || questions.length < 1) {
      return res.status(400).json({ message: "Title and at least one MCQ are required." });
    }

    const questionDocs = await GeneratedQuestion.insertMany(
      questions.map((question, index) => ({
        quizId: null,
        questionText: normalizeText(question.questionText),
        options: (question.options || []).map((option) => normalizeText(option)).filter(Boolean).slice(0, 4),
        correctAnswer: normalizeText(question.correctAnswer),
        explanation: normalizeText(question.explanation || ""),
        difficultyTag: normalizeText(question.difficultyTag || "medium"),
        topic: normalizeText(question.topic || subject),
        conceptsInvolved: question.conceptsInvolved || [],
        order: index + 1,
      }))
    );

    const exam = await ExamAI.create({
      title,
      description: normalizeText(req.body.description),
      subject,
      duration,
      totalMarks: questions.length,
      passingMarks,
      questions: questionDocs.map((question) => question._id),
      questionCount: questionDocs.length,
      createdBy: req.user.userId,
      classroom: req.body.classroom || null,
      isPublished: Boolean(req.body.isPublished),
      status: req.body.isPublished ? "published" : "draft",
      securitySettings: req.body.securitySettings || {},
      aiMonitoring: req.body.aiMonitoring || {},
    });

    const responseExam = await ExamAI.findById(exam._id).populate("questions").lean();
    res.status(201).json({ message: "Exam AI created.", exam: buildExamAIPayload(responseExam) });
  } catch (err) {
    console.log("EXAM AI CREATE ERROR:", err);
    res.status(500).json({ message: "Failed to create Exam AI." });
  }
});

app.put("/api/exam-ai/:id/status", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const exam = await ExamAI.findOne({ _id: req.params.id, createdBy: req.user.userId });
    if (!exam) return res.status(404).json({ message: "Exam AI not found." });

    exam.isPublished = Boolean(req.body.isPublished);
    exam.status = exam.isPublished ? "published" : "draft";
    await exam.save();
    res.json({ message: "Exam AI status updated." });
  } catch (err) {
    console.log("EXAM AI STATUS ERROR:", err);
    res.status(500).json({ message: "Failed to update Exam AI status." });
  }
});

app.delete("/api/exam-ai/:id", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const exam = await ExamAI.findOne({ _id: req.params.id, createdBy: req.user.userId });
    if (!exam) return res.status(404).json({ message: "Exam AI not found." });

    await GeneratedQuestion.deleteMany({ _id: { $in: exam.questions || [] } });
    await ExamViolation.deleteMany({ examId: exam._id });
    await ExamAIResult.deleteMany({ examId: exam._id });
    await AIReport.deleteMany({ examId: exam._id });
    await exam.deleteOne();
    res.json({ message: "Exam AI deleted." });
  } catch (err) {
    console.log("EXAM AI DELETE ERROR:", err);
    res.status(500).json({ message: "Failed to delete Exam AI." });
  }
});

// =============== NEW EXAM MANAGEMENT APIs ===============

// UPDATE EXAM (edit title, description, settings)
app.put("/api/exam-ai/:id", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const exam = await ExamAI.findOne({ _id: req.params.id, createdBy: req.user.userId });
    if (!exam) return res.status(404).json({ message: "Exam not found." });

    // Update allowed fields
    if (req.body.title) exam.title = normalizeText(req.body.title);
    if (req.body.description !== undefined) exam.description = normalizeText(req.body.description);
    if (req.body.duration) exam.duration = Number(req.body.duration);
    if (req.body.passingMarks) exam.passingMarks = Number(req.body.passingMarks);
    if (req.body.securitySettings) exam.securitySettings = req.body.securitySettings;
    if (req.body.aiMonitoring) exam.aiMonitoring = req.body.aiMonitoring;
    if (req.body.showResults !== undefined) exam.showResults = Boolean(req.body.showResults);
    if (req.body.showCorrectAnswers !== undefined) exam.showCorrectAnswers = Boolean(req.body.showCorrectAnswers);
    if (req.body.maxAttempts !== undefined) exam.maxAttempts = req.body.maxAttempts ? Number(req.body.maxAttempts) : null;

    exam.updatedAt = new Date();
    await exam.save();

    const updated = await ExamAI.findById(exam._id).populate("questions").lean();
    res.json({ message: "Exam updated successfully.", exam: buildExamAIPayload(updated) });
  } catch (err) {
    console.log("EXAM AI UPDATE ERROR:", err);
    res.status(500).json({ message: "Failed to update exam." });
  }
});

// PUBLISH EXAM (make visible to students)
app.put("/api/exam-ai/:id/publish", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const exam = await ExamAI.findOne({ _id: req.params.id, createdBy: req.user.userId });
    if (!exam) return res.status(404).json({ message: "Exam not found." });

    exam.isPublished = true;
    exam.isActive = true;
    exam.status = "published";
    exam.startTime = req.body.startTime ? new Date(req.body.startTime) : new Date();
    exam.endTime = req.body.endTime ? new Date(req.body.endTime) : null;
    exam.updatedAt = new Date();
    await exam.save();

    const updated = await ExamAI.findById(exam._id).populate("questions").lean();
    res.json({ message: "Exam published successfully.", exam: buildExamAIPayload(updated) });
  } catch (err) {
    console.log("EXAM AI PUBLISH ERROR:", err);
    res.status(500).json({ message: "Failed to publish exam." });
  }
});

// STOP EXAM (disable student access)
app.put("/api/exam-ai/:id/stop", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const exam = await ExamAI.findOne({ _id: req.params.id, createdBy: req.user.userId });
    if (!exam) return res.status(404).json({ message: "Exam not found." });

    exam.isActive = false;
    exam.status = "stopped";
    exam.stoppedAt = new Date();
    exam.stoppedBy = req.user.userId;
    exam.updatedAt = new Date();
    await exam.save();

    const updated = await ExamAI.findById(exam._id).populate("questions").lean();
    res.json({ message: "Exam stopped successfully.", exam: buildExamAIPayload(updated) });
  } catch (err) {
    console.log("EXAM AI STOP ERROR:", err);
    res.status(500).json({ message: "Failed to stop exam." });
  }
});

// RESUME EXAM (re-enable access)
app.put("/api/exam-ai/:id/resume", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const exam = await ExamAI.findOne({ _id: req.params.id, createdBy: req.user.userId });
    if (!exam) return res.status(404).json({ message: "Exam not found." });

    exam.isActive = true;
    exam.status = "published";
    exam.stoppedAt = null;
    exam.stoppedBy = null;
    exam.updatedAt = new Date();
    await exam.save();

    const updated = await ExamAI.findById(exam._id).populate("questions").lean();
    res.json({ message: "Exam resumed successfully.", exam: buildExamAIPayload(updated) });
  } catch (err) {
    console.log("EXAM AI RESUME ERROR:", err);
    res.status(500).json({ message: "Failed to resume exam." });
  }
});

// ALLOW STUDENT ACCESS
app.put("/api/exam-ai/:id/allow/:studentId", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const exam = await ExamAI.findOne({ _id: req.params.id, createdBy: req.user.userId });
    if (!exam) return res.status(404).json({ message: "Exam not found." });

    // Remove from blocked list if present
    exam.blockedStudents = (exam.blockedStudents || []).filter((id) => id.toString() !== req.params.studentId);
    
    // Add to allowed list if not present
    if (!exam.allowedStudents.some((id) => id.toString() === req.params.studentId)) {
      exam.allowedStudents.push(req.params.studentId);
    }

    // Log the action
    if (!exam.accessControlChanges) exam.accessControlChanges = [];
    exam.accessControlChanges.push({
      action: "allowed",
      studentId: req.params.studentId,
      changedBy: req.user.userId,
      timestamp: new Date(),
    });

    exam.updatedAt = new Date();
    await exam.save();

    res.json({ message: "Student access allowed." });
  } catch (err) {
    console.log("EXAM AI ALLOW ERROR:", err);
    res.status(500).json({ message: "Failed to allow access." });
  }
});

// BLOCK STUDENT ACCESS
app.put("/api/exam-ai/:id/block/:studentId", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const exam = await ExamAI.findOne({ _id: req.params.id, createdBy: req.user.userId });
    if (!exam) return res.status(404).json({ message: "Exam not found." });

    // Remove from allowed list if present
    exam.allowedStudents = (exam.allowedStudents || []).filter((id) => id.toString() !== req.params.studentId);
    
    // Add to blocked list if not present
    if (!exam.blockedStudents.some((id) => id.toString() === req.params.studentId)) {
      exam.blockedStudents.push(req.params.studentId);
    }

    // Log the action
    if (!exam.accessControlChanges) exam.accessControlChanges = [];
    exam.accessControlChanges.push({
      action: "blocked",
      studentId: req.params.studentId,
      changedBy: req.user.userId,
      timestamp: new Date(),
    });

    exam.updatedAt = new Date();
    await exam.save();

    res.json({ message: "Student access blocked." });
  } catch (err) {
    console.log("EXAM AI BLOCK ERROR:", err);
    res.status(500).json({ message: "Failed to block access." });
  }
});

// GET STUDENT ACCESS STATUS
app.get("/api/exam-ai/:id/access/:studentId", verifyToken, async (req, res) => {
  try {
    const exam = await ExamAI.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found." });

    const isBlocked = (exam.blockedStudents || []).some((id) => id.toString() === req.params.studentId);
    const isAllowed = (exam.allowedStudents || []).some((id) => id.toString() === req.params.studentId);
    const now = new Date();
    const isWithinTimeWindow = (!exam.startTime || now >= exam.startTime) && (!exam.endTime || now <= exam.endTime);
    const canAccess = exam.isActive && exam.isPublished && !isBlocked && isWithinTimeWindow;

    res.json({
      canAccess,
      isBlocked,
      isAllowed,
      isPublished: exam.isPublished,
      isActive: exam.isActive,
      isWithinTimeWindow,
      reason: !canAccess
        ? isBlocked
          ? "You are blocked from accessing this exam."
          : !exam.isActive
          ? "Exam is currently stopped."
          : !exam.isPublished
          ? "Exam is not published yet."
          : !isWithinTimeWindow
          ? "Exam is outside the available time window."
          : "Unknown error."
        : "Access granted",
    });
  } catch (err) {
    console.log("EXAM AI ACCESS CHECK ERROR:", err);
    res.status(500).json({ message: "Failed to check access." });
  }
});

// GET EXAM FULL DETAILS (teacher view)
app.get("/api/exam-ai/:id/details", verifyToken, async (req, res) => {
  try {
    const exam = await ExamAI.findById(req.params.id)
      .populate("createdBy", "name email role")
      .populate("allowedStudents", "name email")
      .populate("blockedStudents", "name email")
      .populate("questions")
      .lean();

    if (!exam) return res.status(404).json({ message: "Exam not found." });

    // Only teacher can see all details
    if (exam.createdBy._id.toString() !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    // Get attempt statistics
    const attempts = await ExamAIResult.find({ examId: exam._id })
      .select("studentId studentName score percentage integrityStatus createdAt")
      .lean();

    res.json({
      ...exam,
      attempts: attempts || [],
      attemptCount: attempts?.length || 0,
    });
  } catch (err) {
    console.log("EXAM AI DETAILS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch exam details." });
  }
});

app.post("/api/exam-ai/:id/violations", verifyToken, verifyApprovedStudent, async (req, res) => {
  try {
    const user = await getDbUser(req.user.userId);
    const exam = await ExamAI.findById(req.params.id);
    if (!user || !exam) return res.status(404).json({ message: "Exam AI not found." });

    const violationType = normalizeText(req.body.violationType || req.body.type || "unknown");
    const weight = Number(req.body.weight ?? violationWeights[violationType] ?? 5);

    const violation = await ExamViolation.create({
      studentId: user._id,
      studentName: user.name,
      examId: exam._id,
      violationType,
      message: normalizeText(req.body.message),
      confidenceScore: Number(req.body.confidenceScore || 1),
      weight,
      metadata: req.body.metadata || {},
    });

    res.status(201).json({ violation, weight });
  } catch (err) {
    console.log("EXAM AI VIOLATION ERROR:", err);
    res.status(500).json({ message: "Failed to store violation." });
  }
});

app.post("/api/exam-ai/:id/submit", verifyToken, verifyApprovedStudent, async (req, res) => {
  try {
    const user = await getDbUser(req.user.userId);
    const exam = await ExamAI.findById(req.params.id).populate("questions");
    if (!user || !exam) return res.status(404).json({ message: "Exam AI not found." });

    const submittedAnswers = req.body.answers || {};
    let correctAnswers = 0;
    const answers = (exam.questions || []).map((question, index) => {
      const selected = submittedAnswers[question._id] ?? submittedAnswers[index] ?? "";
      const isCorrect = normalizeText(selected) === normalizeText(question.correctAnswer);
      if (isCorrect) correctAnswers += 1;
      return {
        questionId: question._id,
        questionText: question.questionText,
        selectedAnswer: selected,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation || "",
      };
    });

    const storedViolations = await ExamViolation.find({ examId: exam._id, studentId: user._id }).lean();
    const incomingViolations = Array.isArray(req.body.violations) ? req.body.violations : [];
    const incomingScore = incomingViolations.reduce(
      (sum, item) => sum + Number(item.weight ?? violationWeights[item.violationType] ?? 0),
      0
    );
    const cheatingScore =
      storedViolations.reduce((sum, item) => sum + Number(item.weight || 0), 0) + incomingScore;
    const totalMarks = exam.questions.length || 1;
    const percentage = Math.round((correctAnswers / totalMarks) * 100);
    const integrityScore = Math.max(0, 100 - cheatingScore);
    const integrityStatus = getIntegrityStatus(cheatingScore);

    const result = await ExamAIResult.create({
      studentId: user._id,
      studentName: user.name,
      examId: exam._id,
      examTitle: exam.title,
      score: correctAnswers,
      totalMarks,
      percentage,
      correctAnswers,
      wrongAnswers: totalMarks - correctAnswers,
      answers,
      cheatingScore,
      integrityScore,
      integrityStatus,
    });

    const violationSummary = [...storedViolations, ...incomingViolations].reduce((acc, item) => {
      const key = item.violationType || "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const report = await AIReport.create({
      studentId: user._id,
      studentName: user.name,
      examId: exam._id,
      examTitle: exam.title,
      resultId: result._id,
      totalViolations: storedViolations.length + incomingViolations.length,
      cheatingScore,
      integrityScore,
      integrityStatus,
      violationSummary,
      academicSummary: { score: correctAnswers, totalMarks, percentage },
      voiceActivityAnalysis: { events: violationSummary.voice_detected || 0 },
      eyeMovementAnalysis: { lookingAway: violationSummary.looking_away || 0 },
    });

    exam.totalAttempts += 1;
    await exam.save();

    res.status(201).json({ message: "Exam submitted.", result, report });
  } catch (err) {
    console.log("EXAM AI SUBMIT ERROR:", err);
    res.status(500).json({ message: "Failed to submit Exam AI." });
  }
});

app.get("/api/exam-ai/reports/all", verifyToken, verifyStaff, async (req, res) => {
  try {
    const reports = await AIReport.find().sort({ createdAt: -1 }).lean();
    res.json(reports);
  } catch (err) {
    console.log("EXAM AI REPORTS ERROR:", err);
    res.status(500).json({ message: "Failed to load AI reports." });
  }
});

// Mount quiz routes
app.use("/api/quiz", quizRoutes);
app.use("/api/quiz-assembly", quizAssemblyRoutes);
app.use("/api/chat", chatRoutes);

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    server.listen(port, () => {
      console.log(`Server Running on ${port}`);
    });
  } catch (err) {
    console.log("DB Error", err);
  }
};

startServer();
