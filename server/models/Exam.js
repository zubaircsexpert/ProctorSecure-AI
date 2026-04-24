import mongoose from "mongoose";

const examSchema = new mongoose.Schema({
  course: { type: String, required: true },
  title: { type: String, required: true },
  syllabus: { type: String },
  duration: { type: Number, required: true },
  examKey: { type: String },
  status: { type: String, default: "live" },
  startTime: { type: Date },
  endTime: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Exam", examSchema);
