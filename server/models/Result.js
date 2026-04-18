import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
  // Student ki ID (Referencing User model)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // Student ka Naam (Teacher Panel mein display ke liye)
  studentName: {
    type: String,
    required: true
  },

  // Test ka Title (e.g., Mid-Term, Quiz 1)
  testName: {
    type: String,
    required: true,
    default: "ProctorSecure AI Assessment"
  },

  score: {
    type: Number,
    default: 0
  },

  total: {
    type: Number,
    default: 0
  },

  percentage: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    // Humne Exam.jsx mein "PASSED" aur "FAILED" use kiya hai
    enum: ["PASSED", "FAILED", "PASS", "FAIL"], 
    default: "FAILED"
  },

  // ProctorSecure AI Violations (Matches Exam.jsx states)
  warnings: { type: Number, default: 0 },
  eyeWarnings: { type: Number, default: 0 },
  headWarnings: { type: Number, default: 0 },
  soundWarnings: { type: Number, default: 0 },
  tabWarnings: { type: Number, default: 0 },
  fullscreenWarnings: { type: Number, default: 0 },
  copyWarnings: { type: Number, default: 0 },
  rightClickWarnings: { type: Number, default: 0 },
  
  // Trust Factor Calculation
  cheatingPercent: { 
    type: Number, 
    default: 0 
  },

  date: {
    type: Date,
    default: Date.now
  }
});

// Middleware to ensure status is uppercase before saving
resultSchema.pre('save', function(next) {
  if (this.status) {
    this.status = this.status.toUpperCase();
  }
  next();
});

export default mongoose.model("Result", resultSchema);