import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title lazmi hai"],
    trim: true,
  },
  message: {
    type: String,
    required: [true, "Message lazmi hai"],
  },
  type: {
    type: String,
    enum: ["test", "vacation", "general", "assignment", "approval"],
    default: "general",
  },
  priority: {
    type: String,
    enum: ["low", "normal", "high"],
    default: "normal",
  },
  audience: {
    type: String,
    enum: ["all", "all-students", "teachers", "classroom"],
    default: "classroom",
  },
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
  classroomName: {
    type: String,
    default: "",
    trim: true,
  },
  sender: {
    type: String,
    default: "Admin/Faculty",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

notificationSchema.index({ audience: 1, classroomId: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
