import mongoose from "mongoose";

const examSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  teacherName: { type: String, default: "", trim: true },
  classroomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Classroom",
    default: null,
  },
  classroomName: { type: String, default: "", trim: true },
  course: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  syllabus: { type: String, default: "" },
  duration: { type: Number, required: true },
  assessmentType: {
    type: String,
    enum: ["exam", "quiz", "practice", "test"],
    default: "exam",
  },
  responseMode: {
    type: String,
    enum: ["mcq", "written"],
    default: "mcq",
  },
  instructions: { type: String, default: "" },
  submissionPrompt: { type: String, default: "" },
  requiresCamera: { type: Boolean, default: true },
  requiresMicrophone: { type: Boolean, default: true },
  requiresScreenShare: { type: Boolean, default: true },
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

examSchema.index({ teacherId: 1, classroomId: 1, status: 1 });

export default mongoose.model("Exam", examSchema);
