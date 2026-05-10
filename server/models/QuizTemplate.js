import mongoose from "mongoose";

const quizTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subject: {
    type: String,
    default: "General",
  },
  category: {
    type: String,
    default: "General",
  },
  totalQuestions: {
    type: Number,
    default: 10,
  },
  timeLimit: {
    type: Number,
    default: 0, // in minutes, 0 = no limit
  },
  totalMarks: {
    type: Number,
    default: 10,
  },
  passingMarks: {
    type: Number,
    default: 5,
  },
  negativeMarking: {
    type: Boolean,
    default: false,
  },
  negativeMarkPercentage: {
    type: Number,
    default: 0.25, // 0.25 marks for wrong answer if question is 1 mark
  },
  questionShuffling: {
    type: Boolean,
    default: true,
  },
  optionShuffling: {
    type: Boolean,
    default: true,
  },
  showCorrectAnswers: {
    type: Boolean,
    default: true,
  },
  showExplanations: {
    type: Boolean,
    default: true,
  },
  allowReview: {
    type: Boolean,
    default: true,
  },
  // Distribution settings
  difficultyDistribution: {
    easy: { type: Number, default: 30 },
    medium: { type: Number, default: 40 },
    hard: { type: Number, default: 30 },
  },
  bloomsDistribution: {
    remember: { type: Number, default: 10 },
    understand: { type: Number, default: 30 },
    apply: { type: Number, default: 30 },
    analyze: { type: Number, default: 20 },
    evaluate: { type: Number, default: 10 },
    create: { type: Number, default: 0 },
  },
  mcqTypeDistribution: {
    factual: { type: Number, default: 30 },
    conceptual: { type: Number, default: 40 },
    analytical: { type: Number, default: 20 },
    tricky: { type: Number, default: 10 },
  },
  selectedTopics: {
    type: [String],
    default: [],
  },
  enableTimer: {
    type: Boolean,
    default: true,
  },
  enableCalculator: {
    type: Boolean,
    default: false,
  },
  randomSelection: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["draft", "published", "archived"],
    default: "draft",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

quizTemplateSchema.index({ createdBy: 1, status: 1 });
quizTemplateSchema.index({ subject: 1, category: 1 });

export default mongoose.model("QuizTemplate", quizTemplateSchema);
