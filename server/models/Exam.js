// File: server/models/Exam.js
import mongoose from "mongoose";

const examSchema = new mongoose.Schema({
  title: String,
  examKey: { type: String, required: true }, // Student isse start karega
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Exam", examSchema);