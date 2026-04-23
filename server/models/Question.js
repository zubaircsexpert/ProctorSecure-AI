// File: server/models/Question.js
import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  examId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Exam", 
    required: true 
  },
  questionText: { 
    type: String, 
    required: true 
  },
  options: { 
    type: [String], 
    required: true 
  },
  correctAnswer: { 
    type: String, 
    required: true 
  },
  timer: { 
    type: Number, 
    default: 60 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model("Question", questionSchema);