// =============== UNIFIED ASSESSMENT ROUTES ===============
// This file contains new unified routes for both Quiz and Exam AI
// To integrate: Import and use these routes in the main index.js file

/**
 * POST /api/assessments/create
 * Create a new assessment (quiz or exam)
 * Body: {
 *   assessmentType: "quiz" | "exam",
 *   title, subject, category, difficulty,
 *   duration, totalMarks, passingMarks,
 *   isGenerated (for generated quizzes),
 *   ...other fields based on type
 * }
 */
export const createAssessment = async (req, res, {
  Assessment, User, Classroom, GeneratedQuestion,
  verifyToken, verifyTeacher, getDbUser, normalizeText,
  buildClassroomLabel, findTeacherClassroom, callOpenAiQuizGenerator
}) => {
  try {
    const user = await getDbUser(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    const assessmentType = normalizeText(req.body.assessmentType || "exam").toLowerCase();
    if (!["quiz", "exam"].includes(assessmentType)) {
      return res.status(400).json({ message: "Assessment type must be 'quiz' or 'exam'." });
    }

    const title = normalizeText(req.body.title);
    if (!title) {
      return res.status(400).json({ message: "Assessment title is required." });
    }

    const subject = normalizeText(req.body.subject) || "General";
    const category = normalizeText(req.body.category) || subject;
    const difficulty = normalizeText(req.body.difficulty) || "medium";
    const duration = Number(req.body.duration) || 30;
    const totalMarks = Number(req.body.totalMarks) || 100;
    const passingMarks = Number(req.body.passingMarks) || 50;

    // Get classroom for teacher-created assessments
    let classroom = null;
    if (user.role === "teacher") {
      classroom = await findTeacherClassroom(
        user._id,
        normalizeText(req.body.classroomId) || user.classroomId
      );
      if (!classroom && assessmentType === "exam") {
        return res.status(400).json({ message: "Valid classroom is required for exams." });
      }
    }

    const assessment = new Assessment({
      title,
      subject,
      category,
      difficulty,
      duration,
      totalMarks,
      passingMarks,
      assessmentType,
      isGenerated: req.body.isGenerated === true || req.body.isGenerated === "true",
      createdBy: user._id,
      classroom: classroom?._id || null,
      
      // Timing
      startTime: req.body.startTime || null,
      endTime: req.body.endTime || null,
      
      // Security (for exams)
      securitySettings: assessmentType === "exam" ? {
        forceFullscreen: req.body.forceFullscreen !== false,
        detectTabSwitch: req.body.detectTabSwitch !== false,
        detectScreenShare: req.body.detectScreenShare !== false,
        detectCopyPaste: req.body.detectCopyPaste !== false,
        detectInspectElement: req.body.detectInspectElement !== false,
        requireWebcam: req.body.requireWebcam !== false,
        requireMicrophone: req.body.requireMicrophone === true,
        allowedViolations: Number(req.body.allowedViolations) || 3,
      } : {},
      
      // AI Monitoring (for exams)
      aiMonitoring: assessmentType === "exam" ? {
        enableFaceDetection: req.body.enableFaceDetection !== false,
        enableEyeTracking: req.body.enableEyeTracking !== false,
        enableHeadTracking: req.body.enableHeadTracking !== false,
        enableVoiceDetection: req.body.enableVoiceDetection === true,
        faceDetectionThreshold: Number(req.body.faceDetectionThreshold) || 0.7,
        multipleTracesThreshold: Number(req.body.multipleTracesThreshold) || 2,
        allowedLookAwayTime: Number(req.body.allowedLookAwayTime) || 5,
      } : {},
      
      // Access Control
      randomize: req.body.randomize !== false,
      showResults: req.body.showResults !== false,
      showCorrectAnswers: assessmentType === "quiz" ? true : (req.body.showCorrectAnswers !== false),
    });

    await assessment.save();

    res.status(201).json({
      message: `${assessmentType === "exam" ? "Exam" : "Quiz"} created successfully.`,
      assessment: {
        id: assessment._id,
        ...assessment.toObject(),
      },
    });
  } catch (err) {
    console.log("CREATE ASSESSMENT ERROR:", err);
    res.status(500).json({ message: "Failed to create assessment." });
  }
};

/**
 * GET /api/assessments
 * Get all assessments for the user
 */
export const getAssessments = async (req, res, {
  Assessment, User, getDbUser, buildClassroomLabel
}) => {
  try {
    const user = await getDbUser(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    let query = {};

    if (user.role === "teacher") {
      // Teachers see their own created assessments
      query = { createdBy: user._id };
    } else if (user.role === "student") {
      // Students see published, active assessments they have access to
      query = {
        isPublished: true,
        isActive: true,
        status: { $in: ["published", "active", "upcoming"] },
        blockedStudents: { $ne: user._id },
        $or: [
          { classroom: user.classroomId || null, showAllClassroomStudents: true },
          { allowedStudents: user._id },
        ],
      };
    }

    const assessments = await Assessment.find(query)
      .populate("questions", "questionText options correctAnswer explanation")
      .sort({ createdAt: -1 })
      .lean();

    res.json(assessments);
  } catch (err) {
    console.log("GET ASSESSMENTS ERROR:", err);
    res.status(500).json({ message: "Failed to load assessments." });
  }
};

/**
 * GET /api/assessments/:id
 * Get a specific assessment
 */
export const getAssessment = async (req, res, {
  Assessment, User, getDbUser
}) => {
  try {
    const user = await getDbUser(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    const assessment = await Assessment.findById(req.params.id)
      .populate("questions")
      .lean();

    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found." });
    }

    // Access control
    if (user.role === "teacher") {
      if (String(assessment.createdBy) !== String(user._id)) {
        return res.status(403).json({ message: "You cannot access this assessment." });
      }
    } else if (user.role === "student") {
      const hasAccess =
        (assessment.showAllClassroomStudents && String(assessment.classroom) === String(user.classroomId)) ||
        (assessment.allowedStudents?.includes(user._id));
      
      if (!hasAccess) {
        return res.status(403).json({ message: "You do not have access to this assessment." });
      }
    }

    res.json(assessment);
  } catch (err) {
    console.log("GET ASSESSMENT ERROR:", err);
    res.status(500).json({ message: "Failed to load assessment." });
  }
};

/**
 * PUT /api/assessments/:id
 * Update an assessment
 */
export const updateAssessment = async (req, res, {
  Assessment, User, getDbUser, normalizeText
}) => {
  try {
    const user = await getDbUser(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    const assessment = await Assessment.findOne({
      _id: req.params.id,
      createdBy: user._id,
    });

    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found." });
    }

    // Update allowed fields
    const allowedFields = [
      "title", "description", "subject", "category", "difficulty",
      "duration", "totalMarks", "passingMarks",
      "startTime", "endTime", "randomize", "showResults", "showCorrectAnswers",
      "securitySettings", "aiMonitoring", "cheatingThresholds"
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        assessment[field] = req.body[field];
      }
    });

    if (req.body.status) {
      assessment.status = normalizeText(req.body.status);
    }

    assessment.updatedAt = new Date();
    await assessment.save();

    res.json({
      message: "Assessment updated successfully.",
      assessment,
    });
  } catch (err) {
    console.log("UPDATE ASSESSMENT ERROR:", err);
    res.status(500).json({ message: "Failed to update assessment." });
  }
};

/**
 * DELETE /api/assessments/:id
 * Delete an assessment
 */
export const deleteAssessment = async (req, res, {
  Assessment, GeneratedQuestion, User, getDbUser
}) => {
  try {
    const user = await getDbUser(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    const assessment = await Assessment.findOneAndDelete({
      _id: req.params.id,
      createdBy: user._id,
    });

    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found." });
    }

    // Delete associated questions
    await GeneratedQuestion.deleteMany({ quizId: assessment._id });

    res.json({ message: "Assessment deleted successfully." });
  } catch (err) {
    console.log("DELETE ASSESSMENT ERROR:", err);
    res.status(500).json({ message: "Failed to delete assessment." });
  }
};

/**
 * POST /api/assessments/:id/submit
 * Submit an assessment (student taking quiz/exam)
 */
export const submitAssessment = async (req, res, {
  Assessment, ExamAIResult, User, getDbUser, normalizeText
}) => {
  try {
    const user = await getDbUser(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    const assessment = await Assessment.findById(req.params.id)
      .populate("questions");

    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found." });
    }

    // Verify access
    const hasAccess = 
      (assessment.showAllClassroomStudents && String(assessment.classroom) === String(user.classroomId)) ||
      (assessment.allowedStudents?.includes(user._id));

    if (!hasAccess) {
      return res.status(403).json({ message: "You do not have access to this assessment." });
    }

    // Calculate score
    const answers = req.body.answers || {};
    let score = 0;
    let correct = 0;
    const totalQuestions = assessment.questions.length;

    assessment.questions.forEach((question) => {
      const studentAnswer = answers[question._id];
      if (studentAnswer === question.correctAnswer) {
        score += (assessment.totalMarks / totalQuestions);
        correct++;
      }
    });

    // Store result
    const result = new ExamAIResult({
      assessmentId: assessment._id,
      assessmentTitle: assessment.title,
      assessmentType: assessment.assessmentType,
      studentId: user._id,
      studentName: user.name,
      score: Math.round(score),
      percentage: Math.round((score / assessment.totalMarks) * 100),
      totalQuestions,
      correctAnswers: correct,
      answers,
      passed: score >= assessment.passingMarks,
      submittedAt: new Date(),
    });

    await result.save();

    // Update assessment statistics
    assessment.totalAttempts += 1;
    assessment.averageScore = 
      (assessment.averageScore * (assessment.totalAttempts - 1) + score) / assessment.totalAttempts;
    
    if (score >= assessment.passingMarks) {
      assessment.passPercentage = 
        ((assessment.passPercentage * (assessment.totalAttempts - 1)) + 1) / assessment.totalAttempts * 100;
    }

    await assessment.save();

    res.json({
      message: "Assessment submitted successfully.",
      result: {
        id: result._id,
        score: result.score,
        percentage: result.percentage,
        passed: result.passed,
        feedback: result.percentage >= 80 ? "Excellent!" : result.percentage >= 60 ? "Good!" : "Try again!",
      },
    });
  } catch (err) {
    console.log("SUBMIT ASSESSMENT ERROR:", err);
    res.status(500).json({ message: "Failed to submit assessment." });
  }
};

/**
 * GET /api/assessments/:id/results
 * Get results for an assessment (teacher view)
 */
export const getAssessmentResults = async (req, res, {
  Assessment, ExamAIResult, User, getDbUser
}) => {
  try {
    const user = await getDbUser(req.user.userId);
    if (!user || user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can view results." });
    }

    const assessment = await Assessment.findOne({
      _id: req.params.id,
      createdBy: user._id,
    });

    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found." });
    }

    const results = await ExamAIResult.find({
      assessmentId: assessment._id,
    }).sort({ submittedAt: -1 });

    res.json({
      assessment: {
        id: assessment._id,
        title: assessment.title,
        totalAttempts: assessment.totalAttempts,
        averageScore: Math.round(assessment.averageScore),
        passPercentage: Math.round(assessment.passPercentage),
      },
      results,
    });
  } catch (err) {
    console.log("GET ASSESSMENT RESULTS ERROR:", err);
    res.status(500).json({ message: "Failed to load assessment results." });
  }
};
