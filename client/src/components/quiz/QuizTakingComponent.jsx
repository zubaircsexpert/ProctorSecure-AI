import React, { useState, useEffect } from "react";
import { Clock, ChevronRight, ChevronLeft, Flag, SkipForward } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const QuizTakingComponent = ({ quizId, sessionId }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [quizInfo, setQuizInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [quizId, sessionId]);

  // Timer effect
  useEffect(() => {
    if (!timeRemaining || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const fetchQuiz = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/quiz-assembly/take-quiz/${quizId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setQuizInfo({
        sessionId: response.data.sessionId,
        quizTitle: response.data.quizTitle,
        totalQuestions: response.data.totalQuestions,
        timeLimit: response.data.timeLimit,
      });

      setQuestions(response.data.questions);
      setTimeRemaining(response.data.timeLimit * 60 || null);
      setIsLoading(false);
    } catch (error) {
      console.error("Fetch quiz error:", error);
      toast.error("Failed to load quiz");
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];

  const handleSelectOption = (option) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: option,
    }));

    // Remove from marked for review if answering a marked question
    const newMarked = new Set(markedForReview);
    newMarked.delete(currentQuestionIndex);
    setMarkedForReview(newMarked);
  };

  const handleMarkForReview = () => {
    const newMarked = new Set(markedForReview);
    if (newMarked.has(currentQuestionIndex)) {
      newMarked.delete(currentQuestionIndex);
    } else {
      newMarked.add(currentQuestionIndex);
    }
    setMarkedForReview(newMarked);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const startTime = sessionStorage.getItem(`quiz_start_${quizId}`);
      const timeSpent = startTime
        ? Math.floor((Date.now() - parseInt(startTime)) / 1000)
        : 0;

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/quiz-assembly/submit-quiz/${quizInfo.sessionId}`,
        {
          answers: questions.map((q, idx) => ({
            questionId: q._id,
            selectedOption: answers[idx] || null,
            isCorrect: false,
          })),
          timeSpent,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Quiz submitted successfully");
      // Redirect to results
      window.location.href = `/quiz-results/${quizInfo.sessionId}`;
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to submit quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).length;
  const skippedCount = questions.length - answeredCount;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-100 min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white p-4 rounded-lg mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {quizInfo?.quizTitle}
            </h1>
            <p className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="flex items-center gap-2 text-lg font-bold">
                <Clock className="w-5 h-5" />
                {formatTime(timeRemaining)}
              </div>
              <p className="text-xs text-gray-600">Time Remaining</p>
            </div>

            <div className="text-center">
              <div className="text-lg font-bold">{answeredCount}</div>
              <p className="text-xs text-gray-600">Answered</p>
            </div>

            <div className="text-center">
              <div className="text-lg font-bold">{skippedCount}</div>
              <p className="text-xs text-gray-600">Skipped</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Left Sidebar - Question Navigator */}
          <div className="w-32 hidden lg:block">
            <div className="bg-white rounded-lg p-4 sticky top-4">
              <p className="text-sm font-bold mb-3">Questions</p>
              <div className="grid grid-cols-4 gap-2">
                {questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-full aspect-square rounded text-xs font-medium transition ${
                      currentQuestionIndex === idx
                        ? "bg-blue-600 text-white"
                        : markedForReview.has(idx)
                          ? "bg-yellow-100 text-yellow-900 border border-yellow-300"
                          : answers[idx]
                            ? "bg-green-100 text-green-900"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-4">
            {/* Question */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-lg font-bold mb-6 text-gray-900">
                {currentQuestion?.question}
              </h2>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {currentQuestion?.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(option)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition ${
                      currentAnswer === option
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <span className="font-bold mr-3">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    {option}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={handleMarkForReview}
                  className={`px-4 py-2 rounded font-medium flex items-center gap-2 ${
                    markedForReview.has(currentQuestionIndex)
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Flag className="w-4 h-4" /> Mark for Review
                </button>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-2">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 bg-white border rounded font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <button
                onClick={handleNext}
                disabled={currentQuestionIndex === questions.length - 1}
                className="px-4 py-2 bg-white border rounded font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
                className="ml-auto px-6 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Quiz"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizTakingComponent;
