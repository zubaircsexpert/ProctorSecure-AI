import mongoose from "mongoose";

const studyResourceSchema = new mongoose.Schema({
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
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  resourceType: {
    type: String,
    enum: ["notes", "pdf", "slides", "lecture", "link", "other"],
    default: "notes",
  },
  fileUrl: { type: String, default: "" },
  externalUrl: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

studyResourceSchema.index({ classroomId: 1, createdAt: -1 });
studyResourceSchema.index({ teacherId: 1, createdAt: -1 });

export default mongoose.model("StudyResource", studyResourceSchema);
