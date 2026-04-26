import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide your name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ["student", "teacher"],
    default: "student",
  },
  approvalStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "approved",
  },
  department: {
    type: String,
    default: "",
    trim: true,
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
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  teacherName: {
    type: String,
    default: "",
    trim: true,
  },
  managedClassrooms: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Classroom" }],
    default: [],
  },
  rollNumber: {
    type: String,
    default: "",
    trim: true,
  },
  studentIdCardUrl: {
    type: String,
    default: "",
    trim: true,
  },
  rejectedReason: {
    type: String,
    default: "",
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.index({ role: 1, approvalStatus: 1, classroomId: 1 });

const User = mongoose.model("User", userSchema);
export default User;
