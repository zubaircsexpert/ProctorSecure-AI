import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderName: { type: String, default: "User", trim: true },
    senderRole: { type: String, enum: ["student", "teacher", "admin"], default: "student" },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipientName: { type: String, default: "User", trim: true },
    recipientRole: { type: String, enum: ["student", "teacher", "admin"], default: "student" },
    text: { type: String, default: "", trim: true },
    fileUrl: { type: String, default: "" },
    fileType: { type: String, enum: ["", "image", "video", "audio"], default: "" },
    originalFileName: { type: String, default: "" },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

chatMessageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });

export default mongoose.model("ChatMessage", chatMessageSchema);
