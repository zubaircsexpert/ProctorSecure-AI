import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  questionText: String,
  options: [String],
  correctAnswer: String,
  // Timer field added (default 60 seconds)
  timer: { 
    type: Number, 
    default: 60 
  },
});

export default mongoose.model("Question", questionSchema);