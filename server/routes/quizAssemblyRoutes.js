import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

// Models
import Quiz from "../models/Quiz.js";
import QuizTemplate from "../models/QuizTemplate.js";
import QuizSession from "../models/QuizSession.js";
import CheatDetection from "../models/CheatDetection.js";
import QuizAnalytics from "../models/QuizAnalytics.js";
import MCQBank from "../models/MCQBank.js";
import User from "../models/User.js";

// Utilities
import {
  detectSimilarAnswers,
  detectImpossibleTiming,
  calculateCheatingRiskScore,
  generateCheatDetectionReport,
  detectAIGeneratedAnswers,
} from "../utils/cheatDetection.js";
import {
  calculateQuizStatistics,
  calculateQuestionPerformance,
  calculateDifficultyAnalysis,
  calculateTopicAnalysis,
  calculateTimeAnalysis,
  identifyWeakQuestions,
  generateStudentPerformanceReport,
} from "../utils/analyticsCalculator.js";

const router = express.Router();

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const verifyTeacher = (req, res, next) => {
  if (req.userRole !== "teacher" && req.userRole !== "admin") {
    return res.status(403).json({ message: "Only teachers can access this" });
  }
  next();
};

const verifyStudent = (req, res, next) => {
  if (req.userRole !== "student" && req.userRole !== "admin") {
    return res.status(403).json({ message: "Only students can access this" });
  }
  next();
};

/**
 * Create quiz template
 * POST /api/quiz-assembly/templates
 */
router.post("/templates", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const templateData = {
      ...req.body,
      createdBy: req.userId,
    };

    const template = new QuizTemplate(templateData);
    await template.save();

    res.json({
      success: true,
      template,
      message: "Quiz template created successfully",
    });
  } catch (error) {
    console.error("Create template error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get templates
 * GET /api/quiz-assembly/templates?page=1&limit=10
 */
router.get("/templates", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const templates = await QuizTemplate.find({ createdBy: req.userId })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await QuizTemplate.countDocuments({ createdBy: req.userId });

    res.json({
      success: true,
      templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get templates error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Create quiz from template and MCQs
 * POST /api/quiz-assembly/create-quiz
 */
router.post("/create-quiz", verifyToken, verifyTeacher, async (req, res) => {
  try {
    const { quizName, description, mcqIds, templateId, totalMarks = 10 } =
      req.body;

    if (!quizName || (!Array.isArray(mcqIds) && !templateId)) {
      return res.status(400).json({
        message: "Quiz name and either MCQs or template ID required",
      });
    }

    let selectedMCQIds = mcqIds;

    // If template provided, select MCQs according to template
    if (templateId && !mcqIds) {
      const template = await QuizTemplate.findById(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Select MCQs based on difficulty distribution
      const allMCQs = await MCQBank.find({ createdBy: req.userId });

      selectedMCQIds = smartSelectMCQs(allMCQs, template);
    }

    if (!selectedMCQIds || selectedMCQIds.length === 0) {
      return res.status(400).json({
        message: "No MCQs selected for quiz",
      });
    }

    // Create quiz
    const quiz = new Quiz({
      title: quizName,
      description,
      createdBy: req.userId,
      questions: selectedMCQIds.map((id) => new mongoose.Types.ObjectId(id)),
      sourceType: "generated",
    });

    await quiz.save();

    // Create analytics record
    const analytics = new QuizAnalytics({
      quizId: quiz._id,
      teacherId: req.userId,
      totalQuestions: selectedMCQIds.length,
      totalMarks,
    });

    await analytics.save();

    res.json({
      success: true,
      quiz,
      quizId: quiz._id,
      questionsCount: selectedMCQIds.length,
      message: "Quiz created successfully",
    });
  } catch (error) {
    console.error("Create quiz error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get quiz for taking (student view)
 * GET /api/quiz-assembly/take-quiz/:quizId
 */
router.get("/take-quiz/:quizId", verifyToken, verifyStudent, async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId).populate(
      "questions",
      "questionText options difficulty topic"
    );

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Create quiz session
    const session = new QuizSession({
      quizId,
      studentId: req.userId,
      teacherId: quiz.createdBy,
      totalQuestions: quiz.questions.length,
      totalMarks: 10, // Default, should be fetched from template/quiz config
      answers: quiz.questions.map((q) => ({
        questionId: q._id,
        selectedOption: null,
        isCorrect: false,
        markedForReview: false,
        timeSpent: 0,
      })),
    });

    const savedSession = await session.save();

    // Return quiz questions without correct answers
    const questions = quiz.questions.map((q) => ({
      _id: q._id,
      question: q.questionText,
      options: q.options,
      difficulty: q.difficulty,
      topic: q.topic,
    }));

    res.json({
      success: true,
      sessionId: savedSession._id,
      quizTitle: quiz.title,
      totalQuestions: questions.length,
      questions,
      timeLimit: quiz.timeLimit || 0,
    });
  } catch (error) {
    console.error("Take quiz error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Submit quiz answers
 * POST /api/quiz-assembly/submit-quiz/:sessionId
 */
router.post(
  "/submit-quiz/:sessionId",
  verifyToken,
  verifyStudent,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { answers, timeSpent } = req.body;

      const session = await QuizSession.findById(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Quiz session not found" });
      }

      // Get quiz and questions
      const quiz = await Quiz.findById(session.quizId).populate("questions");
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Calculate score
      let score = 0;
      let correctCount = 0;

      const processedAnswers = answers.map((answer, index) => {
        const question = quiz.questions[index];

        if (!question) {
          return answer;
        }

        const isCorrect = answer.selectedOption === question.correctAnswer;
        if (isCorrect) {
          score += 1;
          correctCount++;
        }

        return {
          ...answer,
          isCorrect,
        };
      });

      const percentage = (correctCount / quiz.questions.length) * 100;
      const passed = percentage >= 40; // Default passing percentage

      // Update session
      session.answers = processedAnswers;
      session.score = score;
      session.percentage = parseFloat(percentage.toFixed(2));
      session.passed = passed;
      session.status = "completed";
      session.duration = timeSpent || 0;
      session.submittedAt = new Date();
      session.endTime = new Date();
      session.answeredQuestions = answers.filter(
        (a) => a.selectedOption !== null
      ).length;

      await session.save();

      // Update analytics
      await updateQuizAnalytics(session.quizId, session);

      res.json({
        success: true,
        score,
        percentage: parseFloat(percentage.toFixed(2)),
        passed,
        message: "Quiz submitted successfully",
      });
    } catch (error) {
      console.error("Submit quiz error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * Get quiz results
 * GET /api/quiz-assembly/results/:sessionId
 */
router.get("/results/:sessionId", verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await QuizSession.findById(sessionId)
      .populate("quizId", "title")
      .populate({
        path: "answers.questionId",
        select: "questionText options correctAnswer explanation",
      });

    if (!session) {
      return res.status(404).json({ message: "Quiz session not found" });
    }

    // Verify access
    if (
      session.studentId.toString() !== req.userId &&
      session.teacherId.toString() !== req.userId
    ) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    res.json({
      success: true,
      session,
      results: {
        score: session.score,
        percentage: session.percentage,
        passed: session.passed,
        totalQuestions: session.totalQuestions,
        answeredQuestions: session.answeredQuestions,
        skippedQuestions: session.skippedQuestions,
      },
    });
  } catch (error) {
    console.error("Get results error:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get analytics dashboard
 * GET /api/quiz-assembly/analytics/:quizId
 */
router.get(
  "/analytics/:quizId",
  verifyToken,
  verifyTeacher,
  async (req, res) => {
    try {
      const { quizId } = req.params;

      // Get quiz and all sessions
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Verify ownership
      if (quiz.createdBy.toString() !== req.userId) {
        return res.status(403).json({ message: "Unauthorized access" });
      }

      const sessions = await QuizSession.find({ quizId }).populate(
        "answers.questionId"
      );

      const questions = await Promise.all(
        quiz.questions.map((id) =>
          MCQBank.findById(id)
        )
      );

      // Calculate statistics
      const statistics = calculateQuizStatistics(sessions);
      const questionPerformance = calculateQuestionPerformance(sessions, questions);
      const difficultyAnalysis = calculateDifficultyAnalysis(sessions, questions);
      const topicAnalysis = calculateTopicAnalysis(sessions, questions);
      const timeAnalysis = calculateTimeAnalysis(sessions, questions);
      const weakQuestions = identifyWeakQuestions(questionPerformance);

      // Get analytics record
      let analytics = await QuizAnalytics.findOne({ quizId });
      if (!analytics) {
        analytics = new QuizAnalytics({
          quizId,
          teacherId: req.userId,
        });
      }

      // Update analytics
      analytics.totalAttempts = statistics.totalAttempts;
      analytics.totalStudents = statistics.totalStudents;
      analytics.averageScore = parseFloat(statistics.averageScore);
      analytics.medianScore = parseFloat(statistics.medianScore);
      analytics.minScore = statistics.minScore;
      analytics.maxScore = statistics.maxScore;
      analytics.standardDeviation = parseFloat(statistics.standardDeviation);
      analytics.passPercentage = parseFloat(statistics.passPercentage);
      analytics.passFailCount = statistics.passFailCount;
      analytics.questionPerformance = Object.values(questionPerformance);
      analytics.difficultyAnalysis = difficultyAnalysis;
      analytics.topicAnalysis = topicAnalysis;
      analytics.timeAnalysis = timeAnalysis;
      analytics.lastUpdated = new Date();

      await analytics.save();

      res.json({
        success: true,
        statistics,
        questionPerformance: Object.values(questionPerformance),
        difficultyAnalysis,
        topicAnalysis,
        timeAnalysis,
        weakQuestions: weakQuestions.slice(0, 5), // Top 5 weak questions
        totalSessions: sessions.length,
      });
    } catch (error) {
      console.error("Get analytics error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * Detect cheating in quiz
 * POST /api/quiz-assembly/detect-cheating/:quizId
 */
router.post(
  "/detect-cheating/:quizId",
  verifyToken,
  verifyTeacher,
  async (req, res) => {
    try {
      const { quizId } = req.params;

      // Get all sessions for quiz
      const sessions = await QuizSession.find({ quizId }).populate(
        "answers.questionId"
      );

      if (sessions.length < 2) {
        return res.json({
          success: true,
          message: "Need at least 2 attempts to detect cheating",
          results: {
            similarAnswers: [],
            suspiciousStudents: [],
            report: null,
          },
        });
      }

      // Run cheating detection
      const similarAnswers = detectSimilarAnswers(sessions, 0.75);

      // Check for timing anomalies
      const avgTimePerQuestion = 30; // Default
      const suspiciousStudents = [];

      sessions.forEach((session) => {
        const timingIssues = detectImpossibleTiming(
          session,
          avgTimePerQuestion
        );

        if (timingIssues.length > 0) {
          suspiciousStudents.push({
            studentId: session.studentId,
            sessionId: session._id,
            timingIssues,
            riskScore: Math.min(100, timingIssues.length * 10),
          });
        }
      });

      // Create detection records
      const detectionRecords = [];

      similarAnswers.forEach((pair) => {
        detectionRecords.push(
          new CheatDetection({
            quizSessionId: sessions.find((s) =>
              s.studentId.equals(pair.student1Id)
            )?._id,
            studentId: pair.student1Id,
            detectionType: "similar-answer",
            severity:
              pair.matchPercentage > 0.9
                ? "critical"
                : pair.matchPercentage > 0.8
                  ? "high"
                  : "medium",
            riskScore: pair.riskScore,
            details: {
              matchedStudents: [
                {
                  studentId: pair.student2Id,
                  matchPercentage: pair.matchPercentage,
                },
              ],
              commonAnswers: pair.commonAnswers,
            },
            status: "flagged",
          })
        );
      });

      if (detectionRecords.length > 0) {
        await CheatDetection.insertMany(detectionRecords);
      }

      // Generate report
      const report = generateCheatDetectionReport({
        sessions,
        similarAnswers,
      });

      res.json({
        success: true,
        results: {
          similarAnswers,
          suspiciousStudents,
          report,
        },
        message: `Detected ${similarAnswers.length} suspicious answer pairs`,
      });
    } catch (error) {
      console.error("Detect cheating error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * Get student performance report
 * GET /api/quiz-assembly/student-performance/:studentId
 */
router.get(
  "/student-performance/:studentId",
  verifyToken,
  verifyTeacher,
  async (req, res) => {
    try {
      const { studentId } = req.params;

      const sessions = await QuizSession.find({ studentId })
        .populate("quizId", "title")
        .sort({ createdAt: -1 });

      if (sessions.length === 0) {
        return res.json({
          success: true,
          message: "No quiz attempts found",
          report: null,
        });
      }

      const report = generateStudentPerformanceReport(sessions);

      res.json({
        success: true,
        report,
        sessions: sessions.map((s) => ({
          quizTitle: s.quizId?.title,
          score: s.score,
          percentage: s.percentage,
          passed: s.passed,
          attemptDate: s.submittedAt,
        })),
      });
    } catch (error) {
      console.error("Student performance error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * Helper function to smart select MCQs based on template
 */
function smartSelectMCQs(allMCQs, template) {
  const selected = [];

  // Group by difficulty
  const byDifficulty = {
    easy: allMCQs.filter((m) => m.difficulty === "easy"),
    medium: allMCQs.filter((m) => m.difficulty === "medium"),
    hard: allMCQs.filter((m) => m.difficulty === "hard"),
  };

  // Calculate distribution
  const easy = Math.floor(
    (template.totalQuestions *
      template.difficultyDistribution.easy) /
    100
  );
  const medium = Math.floor(
    (template.totalQuestions *
      template.difficultyDistribution.medium) /
    100
  );
  const hard =
    template.totalQuestions - easy - medium;

  // Select random MCQs
  selected.push(
    ...getRandomElements(byDifficulty.easy, easy).map((m) => m._id)
  );
  selected.push(
    ...getRandomElements(byDifficulty.medium, medium).map((m) => m._id)
  );
  selected.push(...getRandomElements(byDifficulty.hard, hard).map((m) => m._id));

  return selected;
}

function getRandomElements(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

/**
 * Helper function to update quiz analytics after submission
 */
async function updateQuizAnalytics(quizId, session) {
  try {
    let analytics = await QuizAnalytics.findOne({ quizId });

    if (!analytics) {
      analytics = new QuizAnalytics({
        quizId,
        teacherId: session.teacherId,
      });
    }

    analytics.totalAttempts = (analytics.totalAttempts || 0) + 1;

    if (session.passed) {
      analytics.passFailCount.pass++;
    } else {
      analytics.passFailCount.fail++;
    }

    analytics.lastUpdated = new Date();
    await analytics.save();
  } catch (error) {
    console.error("Update analytics error:", error);
  }
}

export default router;
