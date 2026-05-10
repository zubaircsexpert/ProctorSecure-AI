import mongoose from "mongoose";

const cheatDetectionSchema = new mongoose.Schema({
  quizSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "QuizSession",
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  detectionType: {
    type: String,
    enum: [
      "copy-paste",
      "similar-answer",
      "impossible-timing",
      "pattern-matching",
      "answer-reuse",
      "ai-generated-answer",
      "unusual-behavior",
    ],
    required: true,
  },
  severity: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "medium",
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50,
  },
  details: {
    flaggedQuestions: [mongoose.Schema.Types.ObjectId],
    matchedStudents: [
      {
        studentId: mongoose.Schema.Types.ObjectId,
        matchPercentage: Number,
        commonAnswers: Number,
      },
    ],
    suspiciousPatterns: [String],
    unusualTimings: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        timeSpent: Number,
        expectedTime: Number,
      },
    ],
    plagiarismScore: Number,
    aiGenerationProbability: Number,
  },
  reportedAt: {
    type: Date,
    default: Date.now,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
  reviewNotes: {
    type: String,
    default: "",
  },
  actionTaken: {
    type: String,
    enum: ["none", "warning", "retest", "zero-mark", "investigate"],
    default: "none",
  },
  status: {
    type: String,
    enum: ["flagged", "under-review", "resolved", "dismissed"],
    default: "flagged",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

cheatDetectionSchema.index({ studentId: 1, severity: 1 });
cheatDetectionSchema.index({ quizSessionId: 1 });
cheatDetectionSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("CheatDetection", cheatDetectionSchema);
