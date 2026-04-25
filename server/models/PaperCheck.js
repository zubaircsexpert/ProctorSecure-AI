import mongoose from "mongoose";

const paperCheckResultSchema = new mongoose.Schema(
  {
    questionNumber: { type: Number, required: true },
    expectedAnswer: { type: String, default: "" },
    studentAnswer: { type: String, default: "" },
    isCorrect: { type: Boolean, default: false },
    confidence: { type: Number, default: 0 },
  },
  { _id: false }
);

const paperCheckSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  examTitle: { type: String, required: true, trim: true },
  course: { type: String, default: "", trim: true },
  candidateName: { type: String, default: "", trim: true },
  processingMode: { type: String, default: "hybrid-ocr", trim: true },
  answerSheetFile: { type: String, default: "" },
  answerKeyFile: { type: String, default: "" },
  totalQuestions: { type: Number, default: 0 },
  parsedQuestions: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  incorrectAnswers: { type: Number, default: 0 },
  unansweredAnswers: { type: Number, default: 0 },
  lowConfidenceCount: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  marksAwarded: { type: Number, default: 0 },
  accuracyPercentage: { type: Number, default: 0 },
  reviewSummary: { type: String, default: "", trim: true },
  manualReviewRequired: { type: Boolean, default: false },
  answerKeyMap: { type: Map, of: String, default: {} },
  studentAnswerMap: { type: Map, of: String, default: {} },
  questionResults: { type: [paperCheckResultSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("PaperCheck", paperCheckSchema);
