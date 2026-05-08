import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subject: { type: String, default: "General", trim: true },
  category: { type: String, default: "General", trim: true },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
  },
  timeLimit: { type: Number, default: 0 },
  randomize: { type: Boolean, default: true },
  negativeMarking: { type: Boolean, default: false },
  sourceType: { type: String, default: "text" },
  sourceText: { type: String, default: "" },
  sourceFile: { type: String, default: "" },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GeneratedQuestion",
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Quiz", quizSchema);
