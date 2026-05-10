/**
 * Plagiarism and Cheating Detection Utility
 */

/**
 * Detect similar answers among students
 */
export const detectSimilarAnswers = (quizSessions, threshold = 0.75) => {
  const suspiciousPairs = [];

  for (let i = 0; i < quizSessions.length; i++) {
    for (let j = i + 1; j < quizSessions.length; j++) {
      const session1 = quizSessions[i];
      const session2 = quizSessions[j];

      // Compare answers
      let matchingAnswers = 0;
      let commonAnswers = 0;

      if (
        Array.isArray(session1.answers) &&
        Array.isArray(session2.answers)
      ) {
        for (let k = 0; k < session1.answers.length; k++) {
          if (
            session1.answers[k]?.selectedOption ===
            session2.answers[k]?.selectedOption
          ) {
            matchingAnswers++;
            if (session1.answers[k]?.isCorrect) {
              commonAnswers++;
            }
          }
        }
      }

      const matchPercentage = matchingAnswers / session1.answers.length;

      if (matchPercentage >= threshold) {
        suspiciousPairs.push({
          student1Id: session1.studentId,
          student2Id: session2.studentId,
          matchPercentage: Math.round(matchPercentage * 100),
          commonAnswers,
          totalQuestions: session1.answers.length,
          riskScore: calculateRiskScore(matchPercentage, commonAnswers, session1.answers.length),
        });
      }
    }
  }

  return suspiciousPairs;
};

/**
 * Detect impossible timing patterns
 */
export const detectImpossibleTiming = (quizSession, averageTimePerQuestion) => {
  const suspiciousQuestions = [];

  if (!Array.isArray(quizSession.answers)) {
    return suspiciousQuestions;
  }

  quizSession.answers.forEach((answer, index) => {
    const timeSpent = answer.timeSpent || 0;
    const expectedMinTime = averageTimePerQuestion * 0.2; // 20% of average
    const expectedMaxTime = averageTimePerQuestion * 3; // 300% of average

    // Flag very quick answers on difficult questions
    if (timeSpent < expectedMinTime) {
      suspiciousQuestions.push({
        questionIndex: index,
        timeSpent,
        expectedMinTime,
        suspicion: "Answered too quickly (possible guessing or pre-planned answer)",
        severity: "low",
      });
    }

    // Flag extremely slow answers
    if (timeSpent > expectedMaxTime * 2) {
      suspiciousQuestions.push({
        questionIndex: index,
        timeSpent,
        expectedMaxTime,
        suspicion: "Answered unusually slow (possible external help or distraction)",
        severity: "medium",
      });
    }
  });

  return suspiciousQuestions;
};

/**
 * Detect pattern-based cheating
 */
export const detectCheatingPatterns = (answer, questionIndex, quizSession) => {
  const patterns = [];

  // Check if student always chooses same position (A, B, C, D)
  const selectedPositions = quizSession.answers?.map((ans) => {
    const option = ans.selectedOption;
    const optionIndex = quizSession.currentQuestion?.options?.indexOf(option);
    return optionIndex;
  });

  if (selectedPositions && new Set(selectedPositions).size === 1) {
    patterns.push({
      type: "same-option-pattern",
      description: "Student always selects the same option position",
      severity: "high",
    });
  }

  // Check for alternating patterns
  if (
    selectedPositions &&
    selectedPositions.length > 3
  ) {
    let isAlternating = true;
    for (let i = 1; i < selectedPositions.length; i++) {
      if (selectedPositions[i] === selectedPositions[i - 1]) {
        isAlternating = false;
        break;
      }
    }
    if (isAlternating) {
      patterns.push({
        type: "alternating-pattern",
        description: "Student answers in alternating pattern",
        severity: "medium",
      });
    }
  }

  // Check for copy-paste detection
  if (answer.selectedOption && typeof answer.selectedOption === "string") {
    const optionWords = answer.selectedOption.split(/\s+/);
    if (optionWords.length > 5) {
      patterns.push({
        type: "copy-paste-detection",
        description: "Answer option appears to be copy-pasted",
        severity: "medium",
      });
    }
  }

  return patterns;
};

/**
 * Calculate overall cheat risk score
 */
export const calculateCheatingRiskScore = (detectionData) => {
  let riskScore = 0;
  const factors = [];

  // Similarity score (0-40 points)
  if (detectionData.matchPercentage >= 0.9) {
    riskScore += 40;
    factors.push({ factor: "Very high answer similarity", points: 40 });
  } else if (detectionData.matchPercentage >= 0.8) {
    riskScore += 30;
    factors.push({ factor: "High answer similarity", points: 30 });
  } else if (detectionData.matchPercentage >= 0.7) {
    riskScore += 20;
    factors.push({ factor: "Moderate answer similarity", points: 20 });
  }

  // Timing anomalies (0-30 points)
  if (detectionData.suspiciousTimings?.length > 0) {
    const timingScore = Math.min(
      30,
      detectionData.suspiciousTimings.length * 5
    );
    riskScore += timingScore;
    factors.push({
      factor: `${detectionData.suspiciousTimings.length} timing anomalies`,
      points: timingScore,
    });
  }

  // Pattern detection (0-20 points)
  if (detectionData.suspiciousPatterns?.length > 0) {
    const patternScore = Math.min(
      20,
      detectionData.suspiciousPatterns.length * 5
    );
    riskScore += patternScore;
    factors.push({
      factor: `${detectionData.suspiciousPatterns.length} suspicious patterns`,
      points: patternScore,
    });
  }

  // Device/IP anomalies (0-10 points)
  if (detectionData.multipleDevicesDetected) {
    riskScore += 10;
    factors.push({
      factor: "Multiple devices/IPs detected",
      points: 10,
    });
  }

  return {
    riskScore: Math.min(100, riskScore),
    factors,
    severity:
      riskScore >= 70 ? "critical" : riskScore >= 50 ? "high" : riskScore >= 30 ? "medium" : "low",
  };
};

/**
 * Detect AI-generated answers
 */
export const detectAIGeneratedAnswers = (studentResponses, explanations) => {
  const aiIndicators = [];
  const suspiciousResponses = [];

  const aiMarkers = [
    /\b(however|furthermore|moreover|consequently|therefore|thus)\b/gi, // Formal connectors
    /\b(as per|in accordance with|in light of|given that)\b/gi, // Formal language
    /\b(comprehensive|thorough|systematic|meticulous)\b/gi, // Adjectives commonly used by AI
    /\b(one could argue|it could be argued|it is widely believed)\b/gi, // AI hedging language
  ];

  studentResponses.forEach((response, index) => {
    let indicatorCount = 0;

    for (const marker of aiMarkers) {
      const matches = response.match(marker);
      if (matches) {
        indicatorCount += matches.length;
      }
    }

    // Check for suspiciously perfect grammar
    const wordCount = response.split(/\s+/).length;
    if (wordCount > 20 && indicatorCount > 3) {
      suspiciousResponses.push({
        responseIndex: index,
        indicators: indicatorCount,
        riskScore: Math.min(75, indicatorCount * 10),
        suspicion: "Response may be AI-generated",
      });
      aiIndicators.push({
        type: "formal-language-overuse",
        count: indicatorCount,
      });
    }
  });

  return {
    suspiciousResponses,
    aiProbability: Math.min(
      100,
      (suspiciousResponses.length / studentResponses.length) * 100
    ),
    indicators: aiIndicators,
  };
};

/**
 * Calculate risk score for similar answers
 */
const calculateRiskScore = (matchPercentage, correctAnswers, totalQuestions) => {
  let score = matchPercentage * 60; // Base score from match percentage

  // Bonus if many correct answers match (higher probability of cheating)
  const correctPercentage = correctAnswers / totalQuestions;
  if (correctPercentage > 0.7) {
    score += 20; // Add 20 points for high correct percentage
  }

  return Math.min(100, score);
};

/**
 * Generate cheating report
 */
export const generateCheatDetectionReport = (detectionResults) => {
  const report = {
    totalStudents: detectionResults.sessions?.length || 0,
    flaggedStudents: [],
    suspiciousPairs: detectionResults.similarAnswers || [],
    highRiskStudents: [],
    recommendations: [],
  };

  // Identify high-risk students
  detectionResults.sessions?.forEach((session) => {
    if (session.riskScore >= 70) {
      report.highRiskStudents.push({
        studentId: session.studentId,
        riskScore: session.riskScore,
        severity: session.riskScore >= 90 ? "critical" : "high",
        reasons: session.detectionReasons || [],
      });
    }
  });

  // Generate recommendations
  if (report.suspiciousPairs.length > 0) {
    report.recommendations.push(
      `Review ${report.suspiciousPairs.length} pairs of students with suspicious answer patterns`
    );
  }

  if (report.highRiskStudents.length > 0) {
    report.recommendations.push(
      `${report.highRiskStudents.length} students require further investigation`
    );
  }

  if (report.suspiciousPairs.length === 0 && report.highRiskStudents.length === 0) {
    report.recommendations.push("Quiz appears to have normal answer distribution");
  }

  return report;
};

export default {
  detectSimilarAnswers,
  detectImpossibleTiming,
  detectCheatingPatterns,
  calculateCheatingRiskScore,
  detectAIGeneratedAnswers,
  generateCheatDetectionReport,
};
