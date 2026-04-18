import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide your name"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true, // Aik email se do account nahi banenge
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 6 // Security ke liye minimum length
  },
  role: {
    type: String,
    enum: ["student", "teacher"], // Sirf ye do options allowed hain
    default: "student" // Naya user by default student banega
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Model export
const User = mongoose.model("User", userSchema);
export default User;