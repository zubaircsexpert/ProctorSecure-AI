import mongoose from "mongoose";

const systemCheckSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  studentName: { type: String, default: "", trim: true },
  classroomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Classroom",
    default: null,
  },
  classroomName: { type: String, default: "", trim: true },
  camera: { type: String, enum: ["pass", "warning", "fail"], default: "warning" },
  microphone: { type: String, enum: ["pass", "warning", "fail"], default: "warning" },
  internet: { type: String, enum: ["pass", "warning", "fail"], default: "warning" },
  browser: { type: String, enum: ["pass", "warning", "fail"], default: "warning" },
  device: { type: String, enum: ["pass", "warning", "fail"], default: "warning" },
  speedMbps: { type: Number, default: 0 },
  latencyMs: { type: Number, default: 0 },
  batteryPercent: { type: Number, default: 0 },
  screenWidth: { type: Number, default: 0 },
  screenHeight: { type: Number, default: 0 },
  userAgent: { type: String, default: "" },
  diagnostics: { type: mongoose.Schema.Types.Mixed, default: {} },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

systemCheckSchema.index({ studentId: 1, createdAt: -1 });
systemCheckSchema.index({ classroomId: 1, createdAt: -1 });

export default mongoose.model("SystemCheck", systemCheckSchema);
