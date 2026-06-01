import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderName: { type: String, default: "User", trim: true },
    senderRole: { type: String, enum: ["student", "teacher", "admin"], default: "student" },
    text: { type: String, default: "", trim: true },
    fileUrl: { type: String, default: "" },
    fileType: { type: String, enum: ["", "image", "video"], default: "" },
    originalFileName: { type: String, default: "" },
  },
  { timestamps: true }
);

chatMessageSchema.index({ createdAt: -1 });

export default mongoose.model("ChatMessage", chatMessageSchema);
