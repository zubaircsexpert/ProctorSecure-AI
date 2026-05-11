import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema({
  // =============== BASIC INFORMATION ===============
  title: {
    type: String,
    required: [true, "Assessment title is required"],
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
  category: {
    type: String,
    default: "General",
    trim: true,
  },

  // =============== ASSESSMENT TYPE & SOURCE ===============
  assessmentType: {
    type: String,
    enum: ["quiz", "exam"],
    default: "exam",
    // "quiz" = AI-generated or student-created
    // "exam" = teacher-created proctored exam
  },
  isGenerated: {
    type: Boolean,
    default: false,
    // true = auto-generated from content, false = teacher-created
  },
  sourceType: {
    type: String,
    default: "text",
    // "text", "file", "manual"
  },
  sourceText: {
    type: String,
    default: "",
  },
  sourceFile: {
    type: String,
    default: "",
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard", "mixed"],
    default: "medium",
  },

  // =============== TIMING & DURATION ===============
  duration: {
    // in minutes
    type: Number,
    required: [true, "Duration is required"],
    min: 5,
    max: 480, // 8 hours max
  },
  timeLimit: {
    // For backward compatibility with Quiz
    type: Number,
    default: 0,
  },
  startTime: {
    type: Date,
    default: null,
  },
  endTime: {
    type: Date,
    default: null,
  },
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

  // =============== SCORING ===============
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
  negativemarking: {
    type: Number,
    default: 0, // percentage of correct answer marks
  },
  negativeMarking: {
    // For backward compatibility
    type: Boolean,
    default: false,
  },

  // =============== QUESTIONS ===============
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

  // =============== CREATOR & ACCESS ===============
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

  // =============== PUBLICATION & STATUS ===============
  isPublished: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  isVisible: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: [
      "draft",
      "published",
      "active",
      "upcoming",
      "completed",
      "expired",
      "stopped",
      "disabled",
      "archived",
    ],
    default: "draft",
  },

  // =============== RANDOMIZATION & SHUFFLING ===============
  randomize: {
    type: Boolean,
    default: true,
  },
  randomizeQuestions: {
    type: Boolean,
    default: false,
  },
  randomizeOptions: {
    type: Boolean,
    default: false,
  },

  // =============== STUDENT ACCESS CONTROL ===============
  blockedStudents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  allowedStudents: [
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
  showAllClassroomStudents: {
    type: Boolean,
    default: true,
  },

  // =============== RESULTS VISIBILITY ===============
  showResults: {
    type: Boolean,
    default: true,
  },
  showCorrectAnswers: {
    type: Boolean,
    default: true,
  },

  // =============== EXAM CONTROL (for proctored exams) ===============
  stoppedAt: {
    type: Date,
    default: null,
  },
  stoppedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
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

  // =============== SECURITY & PROCTORING SETTINGS ===============
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
      default: 3,
    },
  },

  // =============== AI MONITORING ===============
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

  // =============== CHEATING DETECTION ===============
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

  // =============== ANALYTICS ===============
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

  // =============== TIMESTAMPS ===============
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Assessment", assessmentSchema);
