import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teacherName: {
      type: String,
      required: true,
    },
    verificationCode: {
      type: String,
      required: true,
      unique: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    studentLastSeen: {
      type: Date,
      default: null,
    },
    teacherLastSeen: {
      type: Date,
      default: null,
    },
    studentLastOnline: {
      type: Date,
      default: null,
    },
    teacherLastOnline: {
      type: Date,
      default: null,
    },
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageTime: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
