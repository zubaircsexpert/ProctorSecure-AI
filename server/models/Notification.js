import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, "Title lazmi hai"], 
    trim: true 
  },
  message: { 
    type: String, 
    required: [true, "Message lazmi hai"] 
  },
  type: { 
    type: String, 
    enum: ['test', 'vacation', 'general', 'assignment'], 
    default: 'general' 
  },
  // Optional: Agar aap dikhana chahte hain ke ye kisne bheji (Admin/Teacher)
  sender: {
    type: String,
    default: "Admin/Faculty"
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Model creation
const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;