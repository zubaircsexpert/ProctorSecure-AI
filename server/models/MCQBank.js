import mongoose from "mongoose";

const mcqBankSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  questionText: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length === 4,
      message: "Exactly 4 options required",
    },
  },
  correctAnswer: {
    type: String,
    required: true,
    trim: true,
  },
  explanation: {
    type: String,
    default: "",
    trim: true,
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
    index: true,
  },
  topic: {
    type: String,
    default: "General",
    trim: true,
    index: true,
  },
  category: {
    type: String,
    default: "General",
    trim: true,
  },
  conceptsInvolved: {
    type: [String],
    default: [],
  },
  bloomsLevel: {
    type: String,
    enum: ["remember", "understand", "apply", "analyze", "evaluate", "create"],
    default: "understand",
  },
  mcqType: {
    type: String,
    enum: ["factual", "conceptual", "analytical", "tricky"],
    default: "factual",
  },
  marks: {
    type: Number,
    default: 1,
  },
  sourceFile: {
    type: String,
    default: "",
  },
  sourceType: {
    type: String,
    enum: ["manual", "generated", "imported"],
    default: "generated",
  },
  status: {
    type: String,
    enum: ["draft", "approved", "rejected"],
    default: "draft",
  },
  flagged: {
    type: Boolean,
    default: false,
  },
  flagReason: {
    type: String,
    default: "",
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  averageScore: {
    type: Number,
    default: 0,
  },
  metadata: {
    subject: String,
    examType: String,
    difficulty_percentage: Number,
    creation_method: String,
  },
  similarQuestions: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "MCQBank",
    default: [],
  },
  aiGenerated: {
    type: Boolean,
    default: true,
  },
  generationPrompt: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for efficient filtering
mcqBankSchema.index({ createdBy: 1, difficulty: 1, topic: 1 });
mcqBankSchema.index({ quizId: 1, status: 1 });

export default mongoose.model("MCQBank", mcqBankSchema);
