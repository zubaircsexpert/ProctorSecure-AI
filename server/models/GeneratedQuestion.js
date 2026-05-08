import mongoose from "mongoose";

const generatedQuestionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  questionText: { type: String, required: true, trim: true },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length >= 2,
      message: "At least 2 options are required",
    },
  },
  correctAnswer: { type: String, required: true, trim: true },
  explanation: { type: String, default: "" },
  difficultyTag: { type: String, default: "medium" },
  topic: { type: String, default: "General" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("GeneratedQuestion", generatedQuestionSchema);
