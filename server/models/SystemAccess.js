import mongoose from "mongoose";

const systemAccessSchema = new mongoose.Schema(
  {
    key: { type: String, default: "global", unique: true },
    systemAccess: { type: Boolean, default: true },
    studentAccess: { type: Boolean, default: true },
    teacherAccess: { type: Boolean, default: true },
    updatedBy: { type: String, default: "System Admin", trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("SystemAccess", systemAccessSchema);
