import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },

  // ✅ SAME rakha (String) taake tumhara existing code break na ho
  dueDate: { type: String, required: true },

  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  
  // --- Teacher Upload Field ---
  fileUrl: { type: String, default: "" },

  // --- Student Submission Fields ---
  status: { 
    type: String, 
    enum: ["Pending", "Submitted", "Checked"], // ✅ sirf ye values allowed
    default: "Pending" 
  },

  marks: { type: String, default: "-" },

  submissionUrl: { type: String, default: "" },

  studentName: { type: String, default: "" }

}, { timestamps: true });

export default mongoose.model("Assignment", assignmentSchema);