import mongoose from "mongoose";

const aiReportSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  studentName: { type: String, default: "" },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: "ExamAI", required: true },
  examTitle: { type: String, default: "" },
  resultId: { type: mongoose.Schema.Types.ObjectId, ref: "ExamAIResult", default: null },
  totalViolations: { type: Number, default: 0 },
  cheatingScore: { type: Number, default: 0 },
  integrityScore: { type: Number, default: 100 },
  integrityStatus: {
    type: String,
    enum: ["Passed", "Suspicious", "Failed Integrity Check"],
    default: "Passed",
  },
  violationSummary: { type: Object, default: {} },
  academicSummary: { type: Object, default: {} },
  voiceActivityAnalysis: { type: Object, default: {} },
  eyeMovementAnalysis: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
});

aiReportSchema.index({ examId: 1, studentId: 1, createdAt: -1 });

export default mongoose.model("AIReport", aiReportSchema);
