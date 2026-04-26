import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    type: { type: String, trim: true },
    message: { type: String, trim: true },
    count: { type: Number, default: 1 },
    severity: { type: String, default: "medium" },
    occurredAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  classroomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Classroom",
    default: null,
  },
  classroomName: { type: String, default: "", trim: true },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exam",
    required: true,
  },
  studentName: { type: String, required: true, trim: true },
  testName: { type: String, required: true, trim: true },
  assessmentType: { type: String, default: "exam", trim: true },
  score: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  answeredCount: { type: Number, default: 0 },
  incorrectAnswers: { type: Number, default: 0 },
  unansweredAnswers: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["PASSED", "FAILED"],
    default: "FAILED",
  },
  warnings: { type: Number, default: 0 },
  eyeWarnings: { type: Number, default: 0 },
  headWarnings: { type: Number, default: 0 },
  soundWarnings: { type: Number, default: 0 },
  tabWarnings: { type: Number, default: 0 },
  fullscreenWarnings: { type: Number, default: 0 },
  copyWarnings: { type: Number, default: 0 },
  pasteWarnings: { type: Number, default: 0 },
  cutWarnings: { type: Number, default: 0 },
  rightClickWarnings: { type: Number, default: 0 },
  shortcutWarnings: { type: Number, default: 0 },
  screenshotWarnings: { type: Number, default: 0 },
  visibilityWarnings: { type: Number, default: 0 },
  focusWarnings: { type: Number, default: 0 },
  exitWarnings: { type: Number, default: 0 },
  faceMissingWarnings: { type: Number, default: 0 },
  multipleFaceWarnings: { type: Number, default: 0 },
  screenShareWarnings: { type: Number, default: 0 },
  cheatingPercent: { type: Number, default: 0 },
  integrityScore: { type: Number, default: 0 },
  academicAccuracy: { type: Number, default: 0 },
  intelligenceScore: { type: Number, default: 0 },
  suspiciousScore: { type: Number, default: 0 },
  trustFactor: { type: String, default: "Reliable", trim: true },
  activityLog: { type: [activityLogSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

resultSchema.index({ teacherId: 1, classroomId: 1, createdAt: -1 });

export default mongoose.model("Result", resultSchema);
