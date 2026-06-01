import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema(
  {
    participantA: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    participantB: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    codeHash: { type: String, required: true, select: false },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true }
);

chatSessionSchema.index({ participantA: 1, participantB: 1 }, { unique: true });

export default mongoose.model("ChatSession", chatSessionSchema);
