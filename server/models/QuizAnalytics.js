import mongoose from "mongoose";

const quizAnalyticsSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
    index: true,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  totalAttempts: {
    type: Number,
    default: 0,
  },
  totalStudents: {
    type: Number,
    default: 0,
  },
  uniqueStudents: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: [],
  },
  averageScore: {
    type: Number,
    default: 0,
  },
  medianScore: {
    type: Number,
    default: 0,
  },
  minScore: {
    type: Number,
    default: 0,
  },
  maxScore: {
    type: Number,
    default: 0,
  },
  standardDeviation: {
    type: Number,
    default: 0,
  },
  passPercentage: {
    type: Number,
    default: 0,
  },
  passFailCount: {
    pass: { type: Number, default: 0 },
    fail: { type: Number, default: 0 },
  },
  scoreDistribution: {
    type: Map,
    of: Number,
    default: {}, // 0-10: count, 11-20: count, etc.
  },
  questionPerformance: [
    {
      questionId: mongoose.Schema.Types.ObjectId,
      correctCount: Number,
      incorrectCount: Number,
      skippedCount: Number,
      correctPercentage: Number,
      difficulty: String,
      averageTimeSpent: Number, // in seconds
    },
  ],
  difficultyAnalysis: {
    easy: {
      attempt: Number,
      correct: Number,
      percentage: Number,
    },
    medium: {
      attempt: Number,
      correct: Number,
      percentage: Number,
    },
    hard: {
      attempt: Number,
      correct: Number,
      percentage: Number,
    },
  },
  topicAnalysis: [
    {
      topic: String,
      attemptCount: Number,
      correctCount: Number,
      percentage: Number,
    },
  ],
  bloomsAnalysis: [
    {
      level: String,
      attemptCount: Number,
      correctCount: Number,
      percentage: Number,
    },
  ],
  mcqTypeAnalysis: [
    {
      type: String,
      attemptCount: Number,
      correctCount: Number,
      percentage: Number,
    },
  ],
  timeAnalysis: {
    averageTimePerQuestion: Number,
    medianTimePerQuestion: Number,
    minTimePerQuestion: Number,
    maxTimePerQuestion: Number,
    totalTimeSpent: Number,
  },
  commonMistakes: [
    {
      questionId: mongoose.Schema.Types.ObjectId,
      mistakeCount: Number,
      commonlySelectedOption: String,
    },
  ],
  studentPerformanceMetrics: [
    {
      studentId: mongoose.Schema.Types.ObjectId,
      attempts: Number,
      bestScore: Number,
      latestScore: Number,
      trend: String, // "improving", "declining", "stable"
    },
  ],
  cheatingAlerts: {
    totalCasesFlagged: Number,
    caseResolved: Number,
    caseUnderReview: Number,
    caseDismissed: Number,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

quizAnalyticsSchema.index({ quizId: 1, teacherId: 1 });

export default mongoose.model("QuizAnalytics", quizAnalyticsSchema);
