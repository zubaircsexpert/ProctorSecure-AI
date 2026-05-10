import mongoose from "mongoose";

const examAISchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Exam title is required"],
    trim: true,
  },
  description: {
    type: String,
    default: "",
    trim: true,
  },
  subject: {
    type: String,
    required: [true, "Subject is required"],
    trim: true,
  },
  duration: {
    type: Number,
    required: [true, "Duration is required"],
    min: 5,
    max: 480, // 8 hours max
  },
  totalMarks: {
    type: Number,
    required: [true, "Total marks is required"],
    min: 1,
  },
  passingMarks: {
    type: Number,
    required: [true, "Passing marks is required"],
    min: 1,
  },
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GeneratedQuestion",
    },
  ],
  questionCount: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Classroom",
    default: null,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: false, // Can be published but inactive
  },
  status: {
    type: String,
    enum: ["draft", "published", "active", "upcoming", "completed", "expired", "stopped", "disabled", "archived"],
    default: "draft",
  },

  // =============== TEACHER CONTROL FIELDS ===============
  
  // Access Management
  blockedStudents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  maxAttempts: {
    type: Number,
    default: null, // null = unlimited
    min: 1,
  },
  allowedBatches: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
    },
  ],
  
  // Timing Control
  startTime: {
    type: Date,
    default: null,
  },
  endTime: {
    type: Date,
    default: null,
  },
  
  // Visibility & Availability
  isVisible: {
    type: Boolean,
    default: true,
  },
  showResults: {
    type: Boolean,
    default: true,
  },
  showCorrectAnswers: {
    type: Boolean,
    default: true,
  },
  
  // Stop/Resume Control
  stoppedAt: {
    type: Date,
    default: null,
  },
  stoppedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  
  // Access Control Logs
  accessControlChanges: [
    {
      action: String, // "allowed", "blocked", "stop", "resume"
      studentId: mongoose.Schema.Types.ObjectId,
      changedBy: mongoose.Schema.Types.ObjectId,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  
  // =============== EXAM SETTINGS ===============
  
  // Security & Proctoring Settings
  securitySettings: {
    forceFullscreen: {
      type: Boolean,
      default: true,
    },
    detectTabSwitch: {
      type: Boolean,
      default: true,
    },
    detectScreenShare: {
      type: Boolean,
      default: true,
    },
    detectCopyPaste: {
      type: Boolean,
      default: true,
    },
    detectInspectElement: {
      type: Boolean,
      default: true,
    },
    requireWebcam: {
      type: Boolean,
      default: true,
    },
    requireMicrophone: {
      type: Boolean,
      default: false,
    },
    allowedViolations: {
      type: Number,
      default: 3, // warnings before auto-submit
    },
  },
  
  // AI Monitoring
  aiMonitoring: {
    enableFaceDetection: {
      type: Boolean,
      default: true,
    },
    enableEyeTracking: {
      type: Boolean,
      default: true,
    },
    enableHeadTracking: {
      type: Boolean,
      default: true,
    },
    enableVoiceDetection: {
      type: Boolean,
      default: false,
    },
    faceDetectionThreshold: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 1,
    },
    multipleTracesThreshold: {
      type: Number,
      default: 2,
    },
    allowedLookAwayTime: {
      type: Number,
      default: 5, // seconds
    },
  },

  // Cheating Score Thresholds
  cheatingThresholds: {
    warning: {
      type: Number,
      default: 50,
    },
    suspicious: {
      type: Number,
      default: 100,
    },
    failed: {
      type: Number,
      default: 150,
    },
  },

  // Student Access
  allowedStudents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  showAllClassroomStudents: {
    type: Boolean,
    default: true,
  },

  // Randomization
  randomizeQuestions: {
    type: Boolean,
    default: false,
  },
  randomizeOptions: {
    type: Boolean,
    default: false,
  },
  negativemarking: {
    type: Number,
    default: 0, // percentage of correct answer marks
  },

  // Scheduling
  scheduledStartTime: {
    type: Date,
    default: null,
  },
  scheduledEndTime: {
    type: Date,
    default: null,
  },
  isScheduled: {
    type: Boolean,
    default: false,
  },

  // Analytics
  totalAttempts: {
    type: Number,
    default: 0,
  },
  averageScore: {
    type: Number,
    default: 0,
  },
  passPercentage: {
    type: Number,
    default: 0,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("ExamAI", examAISchema);
