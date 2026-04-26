import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      default: null,
    },
    classroomName: { type: String, default: "", trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    dueDate: { type: String, required: true },
    fileUrl: { type: String, default: "" },
    allowResubmission: { type: Boolean, default: true },
  },
  { timestamps: true }
);

assignmentSchema.index({ teacherId: 1, classroomId: 1, createdAt: -1 });

export default mongoose.model("Assignment", assignmentSchema);
