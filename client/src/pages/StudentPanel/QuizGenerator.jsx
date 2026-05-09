import { useEffect, useState } from "react";
import { Clock, CheckCircle, XCircle, Loader, AlertCircle, FileText, Globe, Trash2 } from "lucide-react";
import API from "../../services/api";

const difficultyOptions = [
  { value: "easy", label: "Easy - Basic definitions" },
  { value: "medium", label: "Medium - Application & analysis" },
  { value: "hard", label: "Hard - Synthesis & evaluation" },
];

const languageOptions = [
  { value: "english", label: "English" },
  { value: "urdu", label: "اردو (Urdu)" },
];

const downloadBlob = (blob, fileName) => {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

function QuizGenerator() {
  const [mode, setMode] = useState("generator"); // generator, quiz, results
  const [quizForm, setQuizForm] = useState({
    title: "",
    subject: "",
    category: "",
    difficulty: "medium",
    language: "english",
    count: 8,
    timeLimit: 30,
    randomize: true,
    negativeMarking: false,
    text: "",
  });

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(""); // Track generation progress
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState(""); // error, success
  const [quiz, setQuiz] = useState(null);
  const [savedQuizzes, setSavedQuizzes] = useState([]);
  const [extractedTextPreview, setExtractedTextPreview] = useState("");
  const [showTextPreview, setShowTextPreview] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, quizId: null, quizTitle: "" });
  const [deleting, setDeleting] = useState(false);

  // Quiz taking state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");

  const loadSavedQuizzes = async () => {
    try {
      const response = await API.get("/api/quiz-generator/my");
      setSavedQuizzes(response.data || []);
    } catch (error) {
      console.error("Load saved quizzes error:", error);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!deleteModal.quizId) return;
    setDeleting(true);
    try {
      await API.delete(`/api/quiz-generator/${deleteModal.quizId}`);
      await loadSavedQuizzes();
      setDeleteModal({ show: false, quizId: null, quizTitle: "" });
      setNotice("Quiz deleted successfully!");
      setNoticeType("success");
    } catch (error) {
      console.error("Delete quiz error:", error);
      setNotice("Failed to delete quiz.");
      setNoticeType("error");
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = (quizId, title) => {
    setDeleteModal({ show: true, quizId, quizTitle: title });
  };

  useEffect(() => {
    loadSavedQuizzes();
  }, []);

  // Timer effect
  useEffect(() => {
    if (!quizStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, timeLeft]);

  const handleFieldChange = (field, value) => {
    setQuizForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
    setExtractedTextPreview("");
    setShowTextPreview(false);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setExtractedTextPreview("");
    setShowTextPreview(false);
  };

  const handleGenerateQuiz = async (event) => {
    event.preventDefault();
    setNotice("");
    setNoticeType("");

    if (!quizForm.title) {
      setNotice("Quiz title is required.");
      setNoticeType("error");
      return;
    }

    if (!quizForm.text && !file) {
      setNotice("Please paste content or upload a file to generate quiz questions.");
      setNoticeType("error");
      return;
    }

    if (quizForm.text && quizForm.text.length < 50) {
      setNotice("Content is too short. Please provide at least 50 characters.");
      setNoticeType("error");
      return;
    }

    const formData = new FormData();
    formData.append("title", quizForm.title);
    formData.append("subject", quizForm.subject || "General");
    formData.append("category", quizForm.category || quizForm.subject || "General");
    formData.append("difficulty", quizForm.difficulty);
    formData.append("language", quizForm.language);
    formData.append("count", quizForm.count);
    formData.append("timeLimit", quizForm.timeLimit);
    formData.append("randomize", quizForm.randomize);
    formData.append("negativeMarking", quizForm.negativeMarking);
    formData.append("text", quizForm.text);

    if (file) {
      formData.append("file", file);
      setLoadingStatus("📁 Analyzing file...");
    } else {
      setLoadingStatus("🤖 Processing content...");
    }

    try {
      setLoading(true);

      // Simulate progress updates
      const progressUpdates = [
        "📁 Analyzing file...",
        "🔍 Extracting text and concepts...",
        "🧠 Sending to AI engine...",
        "✨ Generating intelligent MCQs...",
        "✅ Validating questions...",
      ];

      let updateIndex = 0;
      const progressInterval = setInterval(() => {
        if (updateIndex < progressUpdates.length - 1) {
          updateIndex++;
          setLoadingStatus(progressUpdates[updateIndex]);
        }
      }, 1000);

      const response = await API.post("/api/quiz-generator", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      clearInterval(progressInterval);

      const generatedQuiz = response.data.quiz;
      setQuiz(generatedQuiz);
      setAnswers({});
      setNotice(response.data.message || "✅ Quiz generated successfully!");
      setNoticeType("success");
      setFile(null);
      setQuizForm((prev) => ({ ...prev, text: "" }));
      setLoadingStatus("");
      setExtractedTextPreview("");
      loadSavedQuizzes();
    } catch (error) {
      console.error("Quiz generation error:", error);
      setNotice(error?.response?.data?.message || "❌ Failed to generate quiz. Try again.");
      setNoticeType("error");
      setLoadingStatus("");
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = (selectedQuiz) => {
    setQuiz(selectedQuiz || { ...quiz, questions: quiz.questions || [] });
    const questionsToUse = selectedQuiz?.questions || quiz?.questions || [];
    setTimeLeft((selectedQuiz?.timeLimit || quiz?.timeLimit || 30) * 60);
    setCurrentQuestion(0);
    setAnswers({});
    setQuizStarted(true);
    setMode("quiz");
  };

  const handleAnswerQuestion = (answer) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: answer,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < (quiz?.questions?.length || 0) - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    const questionsToUse = quiz?.questions || [];
    let score = 0;
    const results = [];

    questionsToUse.forEach((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) score += 1;

      results.push({
        questionText: question.questionText,
        userAnswer: userAnswer || "Not answered",
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
        difficultyTag: question.difficultyTag,
        topic: question.topic,
      });
    });

    const percentage = Math.round((score / questionsToUse.length) * 100);

    // Generate AI Analysis
    const analysisPrompt = `Analyze these quiz results:\nScore: ${percentage}%\nTotal: ${questionsToUse.length}\nCorrect: ${score}\n\nWeaker topics: ${
      results
        .filter((r) => !r.isCorrect)
        .map((r) => r.topic)
        .join(", ")
    }\n\nGive a brief, actionable learning recommendation (2-3 sentences).`;

    try {
      const analysisResponse = await API.post(
        "/api/ai-tutor/ask",
        { question: analysisPrompt, mode: "quiz" },
        { headers: { "Content-Type": "application/json" } }
      );
      setAiAnalysis(analysisResponse.data?.answer || "Analysis not available");
    } catch (error) {
      setAiAnalysis("AI analysis unavailable. Review your results above.");
    }

    setQuiz((prev) => ({
      ...prev,
      results,
      score,
      percentage,
      totalQuestions: questionsToUse.length,
    }));

    setQuizStarted(false);
    setMode("results");
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return "#10b981";
    if (percentage >= 60) return "#f59e0b";
    return "#ef4444";
  };

  // Quiz Taking Mode
  if (mode === "quiz" && quizStarted && quiz) {
    const questionsToUse = quiz.questions || [];
    const currentQ = questionsToUse[currentQuestion];
    const selectedAnswer = answers[currentQuestion];

    return (
      <div style={{ minHeight: "100vh", padding: "20px", background: "#f3f7ff" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
              padding: "16px 20px",
              background: "#ffffff",
              borderRadius: "20px",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
            }}
          >
            <div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                {quiz.title}
              </div>
              <div style={{ color: "#64748b", fontSize: "14px" }}>
                Question {currentQuestion + 1} of {questionsToUse.length}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "24px",
                fontWeight: 800,
                color: timeLeft < 60 ? "#dc2626" : "#0f172a",
              }}
            >
              <Clock size={28} />
              {formatTime(timeLeft)}
            </div>
          </div>

          {currentQ ? (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "20px",
                padding: "28px",
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
              }}
            >
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: "20px",
                }}
              >
                {currentQ.questionText}
              </div>

              <div style={{ display: "grid", gap: "12px", marginBottom: "24px" }}>
                {currentQ.options?.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerQuestion(option)}
                    style={{
                      padding: "16px 18px",
                      borderRadius: "14px",
                      border:
                        selectedAnswer === option ? "2px solid #2563eb" : "1px solid #e2e8f0",
                      background: selectedAnswer === option ? "#eff6ff" : "#f8fafc",
                      color: "#0f172a",
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s",
                    }}
                  >
                    {String.fromCharCode(65 + idx)}. {option}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "space-between" }}>
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestion === 0}
                  style={{
                    padding: "12px 20px",
                    borderRadius: "14px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    cursor: "pointer",
                    opacity: currentQuestion === 0 ? 0.5 : 1,
                    fontWeight: 700,
                  }}
                >
                  ← Previous
                </button>

                {currentQuestion === questionsToUse.length - 1 ? (
                  <button
                    onClick={handleSubmitQuiz}
                    style={{
                      padding: "12px 24px",
                      borderRadius: "14px",
                      border: "none",
                      background: "#10b981",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    style={{
                      padding: "12px 20px",
                      borderRadius: "14px",
                      border: "1px solid #cbd5e1",
                      background: "#f8fafc",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // Results Mode
  if (mode === "results" && quiz?.results) {
    return (
      <div style={{ minHeight: "100vh", padding: "20px", background: "#f3f7ff" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "grid", gap: "24px" }}>
          {/* Score Card */}
          <div
            style={{
              background: `linear-gradient(135deg, ${getScoreColor(quiz.percentage)}, ${
                getScoreColor(quiz.percentage) === "#10b981" ? "#059669" : "#f97316"
              })`,
              borderRadius: "24px",
              padding: "32px",
              color: "#fff",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "48px", fontWeight: 900, marginBottom: "12px" }}>
              {quiz.percentage}%
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
              {quiz.score} out of {quiz.totalQuestions} correct
            </div>
            <div style={{ opacity: 0.9 }}>
              {quiz.percentage >= 80
                ? "🎉 Excellent performance!"
                : quiz.percentage >= 60
                ? "👏 Good job! Keep practicing."
                : "💪 Keep studying and try again!"}
            </div>
          </div>

          {aiAnalysis ? (
            <div
              style={{
                background: "#f0f9ff",
                borderRadius: "20px",
                padding: "24px",
                border: "2px solid #0ea5e9",
              }}
            >
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>
                📊 AI Analysis & Recommendations
              </div>
              <div style={{ color: "#475569", lineHeight: 1.8 }}>{aiAnalysis}</div>
            </div>
          ) : null}

          {/* Results List */}
          <div style={{ display: "grid", gap: "16px" }}>
            {quiz.results?.map((result, idx) => (
              <div
                key={idx}
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  padding: "20px",
                  border: result.isCorrect ? "2px solid #10b981" : "2px solid #ef4444",
                }}
              >
                <div style={{ display: "flex", gap: "12px", alignItems: "start", marginBottom: "12px" }}>
                  {result.isCorrect ? (
                    <CheckCircle size={24} color="#10b981" style={{ flexShrink: 0 }} />
                  ) : (
                    <XCircle size={24} color="#ef4444" style={{ flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>
                      {idx + 1}. {result.questionText}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
                      Your answer: <strong>{result.userAnswer}</strong>
                    </div>
                    {!result.isCorrect ? (
                      <div style={{ color: "#10b981", fontSize: "14px", marginTop: "4px" }}>
                        Correct answer: <strong>{result.correctAnswer}</strong>
                      </div>
                    ) : null}
                    {result.explanation ? (
                      <div
                        style={{
                          color: "#475569",
                          fontSize: "14px",
                          marginTop: "8px",
                          padding: "12px",
                          background: "#f8fafc",
                          borderRadius: "10px",
                        }}
                      >
                        {result.explanation}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setMode("generator");
              setQuizStarted(false);
              setAnswers({});
              setCurrentQuestion(0);
            }}
            style={{
              padding: "16px 24px",
              borderRadius: "16px",
              border: "none",
              background: "#2563eb",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ← Back to Generator
          </button>
        </div>
      </div>
    );
  }

  // Generator Mode
  return (
    <div style={{ minHeight: "100vh", padding: "30px 24px", background: "#f3f7ff" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gap: "24px" }}>
        {/* Header */}
        <div>
          <div style={{ color: "#0f172a", fontSize: "32px", fontWeight: 800, marginBottom: "8px" }}>
            🧠 AI Quiz Generator
          </div>
          <div style={{ color: "#475569", fontSize: "16px", maxWidth: "780px" }}>
            Upload notes, PDFs, images, or paste text to generate AI-powered, conceptual MCQs. Real questions, not placeholders!
          </div>
        </div>

        {loading && (
          <div
            style={{
              background: "#dbeafe",
              borderRadius: "20px",
              padding: "20px",
              border: "2px solid #0ea5e9",
              display: "flex",
              gap: "16px",
              alignItems: "center",
            }}
          >
            <Loader size={32} color="#0ea5e9" style={{ animation: "spin 1s linear infinite" }} />
            <div>
              <div style={{ fontWeight: 700, color: "#0c63e4" }}>{loadingStatus}</div>
              <div style={{ color: "#0284c7", fontSize: "14px", marginTop: "4px" }}>
                This may take 30-60 seconds. Your quiz is being generated...
              </div>
            </div>
          </div>
        )}

        {!quiz && !loading ? (
          <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "minmax(0, 1fr) 360px" }}>
            {/* Main Form */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "24px",
                padding: "28px",
                boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
              }}
            >
              <form onSubmit={handleGenerateQuiz} style={{ display: "grid", gap: "20px" }}>
                {/* Title */}
                <div style={{ display: "grid", gap: "12px" }}>
                  <label style={{ fontWeight: 700, color: "#0f172a" }}>📝 Quiz Title *</label>
                  <input
                    value={quizForm.title}
                    onChange={(event) => handleFieldChange("title", event.target.value)}
                    placeholder="e.g. Chapter 5: Photosynthesis"
                    style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1" }}
                  />
                </div>

                {/* Subject & Category */}
                <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                  <div style={{ display: "grid", gap: "12px" }}>
                    <label style={{ fontWeight: 700, color: "#0f172a" }}>Subject</label>
                    <input
                      value={quizForm.subject}
                      onChange={(event) => handleFieldChange("subject", event.target.value)}
                      placeholder="e.g. Biology"
                      style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div style={{ display: "grid", gap: "12px" }}>
                    <label style={{ fontWeight: 700, color: "#0f172a" }}>Category</label>
                    <input
                      value={quizForm.category}
                      onChange={(event) => handleFieldChange("category", event.target.value)}
                      placeholder="e.g. MCQs from textbook"
                      style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                {/* Settings Grid */}
                <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={{ fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>MCQ Count</label>
                    <input
                      type="number"
                      min={3}
                      max={50}
                      value={quizForm.count}
                      onChange={(event) => handleFieldChange("count", Number(event.target.value))}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: "14px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={{ fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>Time (mins)</label>
                    <input
                      type="number"
                      min={0}
                      value={quizForm.timeLimit}
                      onChange={(event) => handleFieldChange("timeLimit", Number(event.target.value))}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: "14px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={{ fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>Difficulty</label>
                    <select
                      value={quizForm.difficulty}
                      onChange={(event) => handleFieldChange("difficulty", event.target.value)}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: "14px", border: "1px solid #cbd5e1" }}
                    >
                      {difficultyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Language Selection */}
                <div style={{ display: "grid", gap: "12px" }}>
                  <label style={{ fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Globe size={18} /> Language
                  </label>
                  <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                    {languageOptions.map((lang) => (
                      <label
                        key={lang.value}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "12px 14px",
                          borderRadius: "14px",
                          background:
                            quizForm.language === lang.value ? "#eff6ff" : "#f8fafc",
                          border:
                            quizForm.language === lang.value ? "2px solid #2563eb" : "1px solid #cbd5e1",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          name="language"
                          value={lang.value}
                          checked={quizForm.language === lang.value}
                          onChange={(event) => handleFieldChange("language", event.target.value)}
                        />
                        {lang.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "1fr 1fr" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px 14px",
                      borderRadius: "14px",
                      background: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={quizForm.randomize}
                      onChange={(event) => handleFieldChange("randomize", event.target.checked)}
                    />
                    Randomize
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px 14px",
                      borderRadius: "14px",
                      background: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={quizForm.negativeMarking}
                      onChange={(event) => handleFieldChange("negativeMarking", event.target.checked)}
                    />
                    Negative Marking
                  </label>
                </div>

                {/* File Upload */}
                <div style={{ display: "grid", gap: "12px" }}>
                  <label style={{ fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                    <FileText size={18} /> Upload Content
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.docx,.png,.jpg,.jpeg,.gif,.webp,.txt"
                    title={file ? `Selected: ${file.name}` : "Upload PDF, DOCX, image, or text file"}
                    onChange={handleFileChange}
                    style={{ width: "100%" }}
                  />
                  {file ? (
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      style={{
                        border: "1px solid #fecaca",
                        borderRadius: "12px",
                        background: "#fff1f2",
                        color: "#b91c1c",
                        cursor: "pointer",
                        fontWeight: 800,
                        padding: "10px 12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      <Trash2 size={16} />
                      Remove uploaded file
                    </button>
                  ) : null}
                  {file ? (
                    <div style={{ color: "#10b981", fontSize: "14px", fontWeight: 700 }}>
                      ✅ File selected: {file.name}
                    </div>
                  ) : (
                    <div style={{ color: "#64748b", fontSize: "14px" }}>
                      📎 PDF, images (with OCR), DOCX, TXT, etc.
                    </div>
                  )}
                </div>

                {/* Text Area */}
                <div style={{ display: "grid", gap: "12px" }}>
                  <label style={{ fontWeight: 700, color: "#0f172a" }}>Or Paste Study Content</label>
                  <textarea
                    value={quizForm.text}
                    onChange={(event) => handleFieldChange("text", event.target.value)}
                    rows={8}
                    placeholder="Paste lesson notes, past papers, assignment text, or any study material here..."
                    style={{
                      width: "100%",
                      padding: "16px",
                      borderRadius: "18px",
                      border: "1px solid #cbd5e1",
                      resize: "vertical",
                      fontFamily: "monospace",
                    }}
                  />
                  <div style={{ color: "#64748b", fontSize: "13px" }}>
                    Minimum 50 characters | AI will analyze and create real, conceptual questions
                  </div>
                </div>

                {/* Error/Success Messages */}
                {notice ? (
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "start",
                      padding: "14px",
                      borderRadius: "14px",
                      background: noticeType === "error" ? "#fee2e2" : "#dcfce7",
                      color: noticeType === "error" ? "#991b1b" : "#15803d",
                      fontWeight: 700,
                    }}
                  >
                    <AlertCircle size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
                    <div>{notice}</div>
                  </div>
                ) : null}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    border: "none",
                    width: "100%",
                    padding: "16px 20px",
                    borderRadius: "18px",
                    background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
                    color: "#fff",
                    fontWeight: 800,
                    cursor: "pointer",
                    opacity: loading ? 0.7 : 1,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "10px",
                    transition: "all 0.2s",
                  }}
                >
                  {loading ? (
                    <>
                      <Loader size={20} style={{ animation: "spin 1s linear infinite" }} />
                      Generating...
                    </>
                  ) : (
                    "✨ Generate AI Quiz"
                  )}
                </button>
              </form>
            </div>

            {/* Right Sidebar */}
            <div style={{ display: "grid", gap: "20px" }}>
              {/* Quick Start Card */}
              <div
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  borderRadius: "20px",
                  padding: "24px",
                  color: "#fff",
                }}
              >
                <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>💡 Quick Tips</div>
                <ul style={{ fontSize: "13px", lineHeight: 1.8, marginLeft: "16px", opacity: 0.95 }}>
                  <li>Upload study notes or past papers</li>
                  <li>Use OCR-ready images</li>
                  <li>Paste 2-3 paragraphs minimum</li>
                  <li>Choose difficulty level</li>
                  <li>Select question count (3-50)</li>
                </ul>
              </div>

              {/* Supported Formats */}
              <div
                style={{
                  background: "#f0f9ff",
                  borderRadius: "20px",
                  padding: "20px",
                  border: "2px solid #0ea5e9",
                }}
              >
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>
                  📂 Supported Formats
                </div>
                <div style={{ color: "#0284c7", fontSize: "13px", lineHeight: 1.8 }}>
                  <div>✓ PDF documents</div>
                  <div>✓ Images (OCR)</div>
                  <div>✓ Word (.docx)</div>
                  <div>✓ Text (.txt)</div>
                  <div>✓ Pasted text</div>
                </div>
              </div>

              {/* Features Badge */}
              <div
                style={{
                  background: "#f3e8ff",
                  borderRadius: "20px",
                  padding: "20px",
                  border: "2px solid #a78bfa",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#6b21a8", marginBottom: "10px" }}>
                  ⚡ Features
                </div>
                <div style={{ color: "#7e22ce", fontSize: "12px", lineHeight: 1.8 }}>
                  <div>🧠 AI-powered generation</div>
                  <div>📊 Real, meaningful questions</div>
                  <div>🌐 Multi-language support</div>
                  <div>⚙️ Custom difficulty levels</div>
                  <div>✅ Quality validation</div>
                </div>
              </div>

              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "20px",
                  padding: "20px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
                }}
              >
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", marginBottom: "14px" }}>
                  Saved Quizzes
                </div>
                {savedQuizzes.length ? (
                  <div style={{ display: "grid", gap: "10px" }}>
                    {savedQuizzes.slice(0, 6).map((savedQuiz) => (
                      <div
                        key={savedQuiz._id}
                        style={{
                          display: "grid",
                          gap: "10px",
                          padding: "12px",
                          borderRadius: "14px",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <div>
                          <div style={{ color: "#0f172a", fontWeight: 800, fontSize: "13px" }}>
                            {savedQuiz.title}
                          </div>
                          <div style={{ color: "#64748b", fontSize: "12px", marginTop: "3px" }}>
                            {savedQuiz.questions?.length || 0} MCQs - {savedQuiz.difficulty || "medium"}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => handleStartQuiz(savedQuiz)}
                            style={{
                              flex: 1,
                              border: "none",
                              borderRadius: "12px",
                              padding: "10px 12px",
                              background: "#2563eb",
                              color: "#fff",
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            Start
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(savedQuiz._id, savedQuiz.title)}
                            title="Delete quiz"
                            style={{
                              border: "none",
                              width: "42px",
                              borderRadius: "12px",
                              background: "#fee2e2",
                              color: "#b91c1c",
                              cursor: "pointer",
                              display: "grid",
                              placeItems: "center",
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: "#64748b", fontSize: "13px", lineHeight: 1.6 }}>
                    Generated quizzes will appear here after saving.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Quiz Results/Display Section */}
        {quiz && !loading && mode === "generator" ? (
          <div style={{ display: "grid", gap: "20px" }}>
            {/* Generated Quiz Card */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "24px",
                padding: "28px",
                boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
              }}
            >
              <div style={{ display: "grid", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>
                    {quiz.title}
                  </div>
                  <div style={{ color: "#64748b", marginTop: "4px" }}>
                    {quiz.subject} • {quiz.category} • {quiz.difficulty}
                  </div>
                </div>
                {quiz.metadata?.questionsGenerated ? (
                  <div style={{ color: "#10b981", fontWeight: 700, fontSize: "14px" }}>
                    ✅ {quiz.metadata.questionsGenerated} high-quality MCQs generated
                  </div>
                ) : null}
              </div>

              <button
                onClick={() => handleStartQuiz(quiz)}
                style={{
                  width: "100%",
                  padding: "16px 20px",
                  borderRadius: "18px",
                  border: "none",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                🚀 Start Quiz Now
              </button>
            </div>

            {/* Start Over */}
            <button
              onClick={() => {
                setQuiz(null);
                setQuizForm({
                  title: "",
                  subject: "",
                  category: "",
                  difficulty: "medium",
                  language: "english",
                  count: 8,
                  timeLimit: 30,
                  randomize: true,
                  negativeMarking: false,
                  text: "",
                });
                setFile(null);
              }}
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: "16px",
                border: "2px solid #2563eb",
                background: "#ffffff",
                color: "#2563eb",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ← Start Over
            </button>
          </div>
        ) : null}
      </div>

      {deleteModal.show ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.58)",
            display: "grid",
            placeItems: "center",
            padding: "20px",
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: "min(440px, 100%)",
              background: "#ffffff",
              borderRadius: "22px",
              padding: "24px",
              boxShadow: "0 30px 80px rgba(15, 23, 42, 0.3)",
            }}
          >
            <div style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", marginBottom: "8px" }}>
              Delete quiz?
            </div>
            <div style={{ color: "#475569", lineHeight: 1.7, marginBottom: "22px" }}>
              This will remove "{deleteModal.quizTitle}" and all generated MCQs for this quiz.
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setDeleteModal({ show: false, quizId: null, quizTitle: "" })}
                disabled={deleting}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "14px",
                  padding: "12px 16px",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteQuiz}
                disabled={deleting}
                style={{
                  border: "none",
                  borderRadius: "14px",
                  padding: "12px 16px",
                  background: "#dc2626",
                  color: "#ffffff",
                  fontWeight: 800,
                  cursor: "pointer",
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default QuizGenerator;
