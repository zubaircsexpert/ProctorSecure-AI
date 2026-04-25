import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exam",
    required: true,
  },
  studentName: { type: String, required: true, trim: true },
  testName: { type: String, required: true, trim: true },
  score: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
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
  rightClickWarnings: { type: Number, default: 0 },
  cheatingPercent: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Result", resultSchema);
