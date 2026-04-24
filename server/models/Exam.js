import mongoose from "mongoose";

const examSchema = new mongoose.Schema({
  course: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  syllabus: { type: String, default: "" },
  duration: { type: Number, required: true },
  examKey: { type: String, default: "" },
  status: {
    type: String,
    enum: ["scheduled", "live", "closed"],
    default: "scheduled",
  },
  accessGranted: { type: Boolean, default: false },
  startTime: { type: Date, default: null },
  endTime: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Exam", examSchema);
