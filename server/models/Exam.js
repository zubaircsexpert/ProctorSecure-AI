// File: server/models/Exam.js
import mongoose from "mongoose";

const examSchema = new mongoose.Schema({
  course: { type: String, required: true },
  title: { type: String, required: true },
  syllabus: { type: String },
  duration: { type: Number, required: true }, // Minutes mein
  examKey: { type: String }, // Agar aap baad mein use karna chahein
  status: { type: String, default: "pending" }, // ✅ Yahi aapka 'Live/Pending' logic control karega
  startTime: { type: Date },
  endTime: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Exam", examSchema);