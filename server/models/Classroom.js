import mongoose from "mongoose";

const classroomSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  teacherName: { type: String, default: "", trim: true },
  name: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
  program: { type: String, default: "", trim: true },
  section: { type: String, default: "", trim: true },
  semester: { type: String, default: "", trim: true },
  description: { type: String, default: "", trim: true },
  inviteCode: { type: String, required: true, trim: true, unique: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

classroomSchema.index({ teacherId: 1, name: 1, section: 1 });

export default mongoose.model("Classroom", classroomSchema);
