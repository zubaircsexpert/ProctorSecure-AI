import mongoose from "mongoose";

const quizSessionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
    default: null,
  },
  duration: {
    type: Number,
    default: 0, // in seconds
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  answeredQuestions: {
    type: Number,
    default: 0,
  },
  skippedQuestions: {
    type: Number,
    default: 0,
  },
  markedForReview: {
    type: Number,
    default: 0,
  },
  score: {
    type: Number,
    default: 0,
  },
  totalMarks: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
    default: 0,
  },
  passed: {
    type: Boolean,
    default: false,
  },
  answers: [
    {
      questionId: mongoose.Schema.Types.ObjectId,
      selectedOption: String,
      isCorrect: Boolean,
      markedForReview: Boolean,
      timeSpent: Number, // in seconds
    },
  ],
  status: {
    type: String,
    enum: ["in-progress", "completed", "abandoned"],
    default: "in-progress",
  },
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    screenResolution: String,
  },
  submittedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

quizSessionSchema.index({ quizId: 1, studentId: 1, createdAt: -1 });
quizSessionSchema.index({ teacherId: 1, createdAt: -1 });

export default mongoose.model("QuizSession", quizSessionSchema);
