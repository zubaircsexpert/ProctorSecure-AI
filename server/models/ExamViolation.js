import mongoose from "mongoose";

const examViolationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  studentName: { type: String, default: "" },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: "ExamAI", required: true },
  violationType: { type: String, required: true, trim: true },
  message: { type: String, default: "" },
  confidenceScore: { type: Number, default: 1 },
  weight: { type: Number, default: 0 },
  metadata: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now },
});

examViolationSchema.index({ examId: 1, studentId: 1, timestamp: -1 });

export default mongoose.model("ExamViolation", examViolationSchema);
