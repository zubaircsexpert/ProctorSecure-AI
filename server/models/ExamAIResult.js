import mongoose from "mongoose";

const examAIResultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  studentName: { type: String, default: "" },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: "ExamAI", required: true },
  examTitle: { type: String, default: "" },
  score: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  wrongAnswers: { type: Number, default: 0 },
  answers: { type: Array, default: [] },
  cheatingScore: { type: Number, default: 0 },
  integrityScore: { type: Number, default: 100 },
  integrityStatus: {
    type: String,
    enum: ["Passed", "Suspicious", "Failed Integrity Check"],
    default: "Passed",
  },
  submittedAt: { type: Date, default: Date.now },
});

examAIResultSchema.index({ studentId: 1, examId: 1, submittedAt: -1 });

export default mongoose.model("ExamAIResult", examAIResultSchema);
