/**
 * Analytics and Reporting Utility
 */

/**
 * Calculate statistics from quiz sessions
 */
export const calculateQuizStatistics = (quizSessions) => {
  if (!Array.isArray(quizSessions) || quizSessions.length === 0) {
    return getEmptyStatistics();
  }

  const scores = quizSessions.map((s) => s.score || 0);
  const percentages = quizSessions.map((s) => s.percentage || 0);

  return {
    totalAttempts: quizSessions.length,
    totalStudents: new Set(quizSessions.map((s) => s.studentId)).size,
    averageScore: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
    medianScore: calculateMedian(scores),
    minScore: Math.min(...scores),
    maxScore: Math.max(...scores),
    standardDeviation: calculateStandardDeviation(scores),
    averagePercentage: (
      percentages.reduce((a, b) => a + b, 0) / percentages.length
    ).toFixed(2),
    passFailCount: {
      pass: quizSessions.filter((s) => s.passed).length,
      fail: quizSessions.filter((s) => !s.passed).length,
    },
    passPercentage: (
      (quizSessions.filter((s) => s.passed).length / quizSessions.length) *
      100
    ).toFixed(2),
  };
};

/**
 * Calculate question-wise performance
 */
export const calculateQuestionPerformance = (quizSessions, questions) => {
  const questionStats = {};

  if (!Array.isArray(questions)) {
    return questionStats;
  }

  questions.forEach((question) => {
    const questionId = question._id?.toString() || question.id;
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;
    const timesSpent = [];

    quizSessions.forEach((session) => {
      const answer = session.answers?.find(
        (a) => a.questionId?.toString() === questionId
      );

      if (!answer) {
        skippedCount++;
      } else if (answer.isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }

      if (answer?.timeSpent) {
        timesSpent.push(answer.timeSpent);
      }
    });

    const totalAttempts = correctCount + incorrectCount;

    questionStats[questionId] = {
      questionId,
      question: question.question,
      difficulty: question.difficulty,
      topic: question.topic,
      correctCount,
      incorrectCount,
      skippedCount,
      totalAttempts,
      correctPercentage:
        totalAttempts > 0
          ? ((correctCount / totalAttempts) * 100).toFixed(2)
          : 0,
      incorrectPercentage:
        totalAttempts > 0
          ? ((incorrectCount / totalAttempts) * 100).toFixed(2)
          : 0,
      averageTimeSpent:
        timesSpent.length > 0
          ? (
              timesSpent.reduce((a, b) => a + b, 0) / timesSpent.length
            ).toFixed(2)
          : 0,
    };
  });

  return questionStats;
};

/**
 * Calculate difficulty-wise analysis
 */
export const calculateDifficultyAnalysis = (quizSessions, questions) => {
  const difficultyMap = {
    easy: { attempt: 0, correct: 0 },
    medium: { attempt: 0, correct: 0 },
    hard: { attempt: 0, correct: 0 },
  };

  quizSessions.forEach((session) => {
    session.answers?.forEach((answer) => {
      const question = questions?.find(
        (q) => q._id?.toString() === answer.questionId?.toString()
      );

      if (question) {
        const difficulty = question.difficulty || "medium";
        if (difficultyMap[difficulty]) {
          difficultyMap[difficulty].attempt++;
          if (answer.isCorrect) {
            difficultyMap[difficulty].correct++;
          }
        }
      }
    });
  });

  // Calculate percentages
  const analysis = {};
  for (const [level, data] of Object.entries(difficultyMap)) {
    analysis[level] = {
      ...data,
      percentage:
        data.attempt > 0 ? ((data.correct / data.attempt) * 100).toFixed(2) : 0,
    };
  }

  return analysis;
};

/**
 * Calculate topic-wise analysis
 */
export const calculateTopicAnalysis = (quizSessions, questions) => {
  const topicMap = {};

  quizSessions.forEach((session) => {
    session.answers?.forEach((answer) => {
      const question = questions?.find(
        (q) => q._id?.toString() === answer.questionId?.toString()
      );

      if (question) {
        const topic = question.topic || "General";

        if (!topicMap[topic]) {
          topicMap[topic] = { attempt: 0, correct: 0 };
        }

        topicMap[topic].attempt++;
        if (answer.isCorrect) {
          topicMap[topic].correct++;
        }
      }
    });
  });

  // Convert to array and calculate percentages
  return Object.entries(topicMap)
    .map(([topic, data]) => ({
      topic,
      attemptCount: data.attempt,
      correctCount: data.correct,
      percentage:
        data.attempt > 0 ? ((data.correct / data.attempt) * 100).toFixed(2) : 0,
    }))
    .sort((a, b) => b.attemptCount - a.attemptCount);
};

/**
 * Calculate time-wise analysis
 */
export const calculateTimeAnalysis = (quizSessions, questions) => {
  const timesPerQuestion = [];
  let totalTimeSpent = 0;

  quizSessions.forEach((session) => {
    session.answers?.forEach((answer) => {
      if (answer.timeSpent) {
        timesPerQuestion.push(answer.timeSpent);
        totalTimeSpent += answer.timeSpent;
      }
    });
  });

  if (timesPerQuestion.length === 0) {
    return {
      averageTimePerQuestion: 0,
      medianTimePerQuestion: 0,
      minTimePerQuestion: 0,
      maxTimePerQuestion: 0,
      totalTimeSpent: 0,
    };
  }

  return {
    averageTimePerQuestion: (
      timesPerQuestion.reduce((a, b) => a + b, 0) / timesPerQuestion.length
    ).toFixed(2),
    medianTimePerQuestion: calculateMedian(timesPerQuestion),
    minTimePerQuestion: Math.min(...timesPerQuestion),
    maxTimePerQuestion: Math.max(...timesPerQuestion),
    totalTimeSpent,
  };
};

/**
 * Identify weak/difficult questions
 */
export const identifyWeakQuestions = (questionPerformance, threshold = 0.4) => {
  return Object.values(questionPerformance)
    .filter(
      (q) =>
        parseFloat(q.correctPercentage) < threshold && q.totalAttempts > 0
    )
    .sort((a, b) => a.correctPercentage - b.correctPercentage);
};

/**
 * Generate student performance report
 */
export const generateStudentPerformanceReport = (
  studentSessions,
  quizzes
) => {
  const report = {
    studentId: studentSessions[0]?.studentId,
    totalQuizzesAttempted: studentSessions.length,
    totalScore: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: Number.MAX_VALUE,
    passedQuizzes: 0,
    failedQuizzes: 0,
    improvementTrend: [],
    strongTopics: [],
    weakTopics: [],
    recommendedPracticeAreas: [],
  };

  let totalScore = 0;
  let highestScore = 0;
  let lowestScore = Number.MAX_VALUE;
  const topicPerformance = {};

  studentSessions.forEach((session) => {
    totalScore += session.score || 0;
    highestScore = Math.max(highestScore, session.score || 0);
    lowestScore = Math.min(lowestScore, session.score || 0);

    if (session.passed) report.passedQuizzes++;
    else report.failedQuizzes++;

    // Track topic performance
    session.answers?.forEach((answer) => {
      // This would need question data to determine topic
    });
  });

  report.totalScore = totalScore;
  report.averageScore = (totalScore / studentSessions.length).toFixed(2);
  report.highestScore = highestScore;
  report.lowestScore = lowestScore === Number.MAX_VALUE ? 0 : lowestScore;

  // Analyze trends (improvement or decline)
  const scores = studentSessions.map((s) => s.score || 0);
  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));

  if (firstHalf.length > 0 && secondHalf.length > 0) {
    const avgFirstHalf =
      firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecondHalf =
      secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    report.improvementTrend = {
      firstHalfAverage: avgFirstHalf.toFixed(2),
      secondHalfAverage: avgSecondHalf.toFixed(2),
      trend: avgSecondHalf > avgFirstHalf ? "improving" : "declining",
      percentage: (
        ((avgSecondHalf - avgFirstHalf) / avgFirstHalf) *
        100
      ).toFixed(2),
    };
  }

  // Identify recommendations
  if (report.averageScore < 50) {
    report.recommendedPracticeAreas.push("Overall concept revision needed");
  }

  if (report.failedQuizzes > report.passedQuizzes) {
    report.recommendedPracticeAreas.push("Increase practice frequency");
  }

  return report;
};

/**
 * Calculate median
 */
const calculateMedian = (arr) => {
  if (arr.length === 0) return 0;

  const sorted = [...arr].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return ((sorted[middle - 1] + sorted[middle]) / 2).toFixed(2);
  }

  return sorted[middle];
};

/**
 * Calculate standard deviation
 */
const calculateStandardDeviation = (arr) => {
  if (arr.length === 0) return 0;

  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance =
    arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;

  return Math.sqrt(variance).toFixed(2);
};

/**
 * Empty statistics object
 */
const getEmptyStatistics = () => ({
  totalAttempts: 0,
  totalStudents: 0,
  averageScore: 0,
  medianScore: 0,
  minScore: 0,
  maxScore: 0,
  standardDeviation: 0,
  averagePercentage: 0,
  passFailCount: { pass: 0, fail: 0 },
  passPercentage: 0,
});

export default {
  calculateQuizStatistics,
  calculateQuestionPerformance,
  calculateDifficultyAnalysis,
  calculateTopicAnalysis,
  calculateTimeAnalysis,
  identifyWeakQuestions,
  generateStudentPerformanceReport,
};
