import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  assignmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Assignment",
    required: true 
  },

  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },

  fileUrl: { 
    type: String, 
    required: true 
  },

  studentName: {
    type: String,
    default: "",
    trim: true
  },

  rollNumber: {
    type: String,
    default: "",
    trim: true
  },

  marks: { 
    type: Number, 
    default: 0 
  },

  status: { 
    type: String, 
    enum: ["Pending", "Checked", "Late", "Re-submitted"], 
    default: "Pending" 
  },

  feedback: {
    type: String,
    default: ""
  },

  reviewedAt: {
    type: Date,
    default: null
  },

  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

submissionSchema.index({ assignmentId: 1, studentId: 1 });

export default mongoose.model("Submission", submissionSchema);
