import { useEffect, useState } from "react";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import API from "../../services/api";

const difficultyOptions = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const DEFAULT_QUESTIONS = [
  {
    _id: "default-1",
    questionText: "What is the primary purpose of a database management system?",
    options: ["Data storage only", "Data organization and retrieval", "Network management", "System security"],
    correctAnswer: "Data organization and retrieval",
    explanation: "DBMS organizes, stores, and efficiently retrieves data with data integrity.",
    difficultyTag: "easy",
    topic: "Database",
  },
  {
    _id: "default-2",
    questionText: "Which of the following is a relational database?",
    options: ["MongoDB", "MySQL", "Redis", "Cassandra"],
    correctAnswer: "MySQL",
    explanation: "MySQL is a popular open-source relational database management system.",
    difficultyTag: "medium",
    topic: "Database",
  },
  {
    _id: "default-3",
    questionText: "What does SQL stand for?",
    options: ["Structured Query Language", "Simple Question Language", "Standard Query Logic", "Syntax Query Language"],
    correctAnswer: "Structured Query Language",
    explanation: "SQL is used to communicate with databases using structured queries.",
    difficultyTag: "easy",
    topic: "Database",
  },
  {
    _id: "default-4",
    questionText: "Which key constraint ensures that each row is uniquely identifiable?",
    options: ["Foreign Key", "Primary Key", "Unique Key", "Composite Key"],
    correctAnswer: "Primary Key",
    explanation: "A Primary Key uniquely identifies each record in a table.",
    difficultyTag: "medium",
    topic: "Database",
  },
  {
    _id: "default-5",
    questionText: "What is normalization in database design?",
    options: ["Data backup process", "Reducing data redundancy and improving integrity", "Encrypting data", "Creating backups"],
    correctAnswer: "Reducing data redundancy and improving integrity",
    explanation: "Normalization organizes data to reduce redundancy and dependency.",
    difficultyTag: "hard",
    topic: "Database",
  },
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
    count: 8,
    timeLimit: 30,
    randomize: true,
    negativeMarking: false,
    text: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [savedQuizzes, setSavedQuizzes] = useState([]);
  
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
  };

  const handleGenerateQuiz = async (event) => {
    event.preventDefault();
    setNotice("");

    if (!quizForm.title) {
      setNotice("Quiz title is required.");
      return;
    }

    if (!quizForm.text && !file) {
      setNotice("Please paste content or upload a file to generate quiz questions.");
      return;
    }

    const formData = new FormData();
    formData.append("title", quizForm.title);
    formData.append("subject", quizForm.subject);
    formData.append("category", quizForm.category);
    formData.append("difficulty", quizForm.difficulty);
    formData.append("count", quizForm.count);
    formData.append("timeLimit", quizForm.timeLimit);
    formData.append("randomize", quizForm.randomize);
    formData.append("negativeMarking", quizForm.negativeMarking);
    formData.append("text", quizForm.text);
    if (file) {
      formData.append("file", file);
    }

    try {
      setLoading(true);
      const response = await API.post("/api/quiz-generator", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const generatedQuiz = response.data.quiz;
      setQuiz(generatedQuiz);
      setAnswers({});
      setNotice(response.data.message || "Quiz generated successfully.");
      setFile(null);
      setQuizForm((prev) => ({ ...prev, text: "" }));
      loadSavedQuizzes();
    } catch (error) {
      console.error("Quiz generation error:", error);
      setNotice(error?.response?.data?.message || "Failed to generate quiz. Try again.");
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
    }\n\nGive a brief learning recommendation.`;
    
    try {
      const analysisResponse = await API.post("/api/ai-tutor/ask", 
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

  const handleUseDefaults = () => {
    setQuiz({
      title: "Default Sample Quiz",
      subject: "Database Fundamentals",
      category: "General",
      difficulty: "medium",
      timeLimit: 15,
      questions: DEFAULT_QUESTIONS,
    });
    setAnswers({});
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (mode === "quiz" && quizStarted && quiz) {
    const questionsToUse = quiz.questions || [];
    const currentQ = questionsToUse[currentQuestion];
    const selectedAnswer = answers[currentQuestion];

    return (
      <div style={{ minHeight: "100vh", padding: "20px", background: "#f3f7ff" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", padding: "16px 20px", background: "#ffffff", borderRadius: "20px", boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)" }}>
            <div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>{quiz.title}</div>
              <div style={{ color: "#64748b", fontSize: "14px" }}>Question {currentQuestion + 1} of {questionsToUse.length}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "24px", fontWeight: 800, color: timeLeft < 60 ? "#dc2626" : "#0f172a" }}>
              <Clock size={28} />
              {formatTime(timeLeft)}
            </div>
          </div>

          {currentQ ? (
            <div style={{ background: "#ffffff", borderRadius: "20px", padding: "28px", boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)" }}>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "20px" }}>
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
                      border: selectedAnswer === option ? "2px solid #2563eb" : "1px solid #e2e8f0",
                      background: selectedAnswer === option ? "#eff6ff" : "#f8fafc",
                      color: "#0f172a",
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "left",
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
                  style={{ padding: "12px 20px", borderRadius: "14px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", opacity: currentQuestion === 0 ? 0.5 : 1 }}
                >
                  ← Previous
                </button>

                {currentQuestion === questionsToUse.length - 1 ? (
                  <button
                    onClick={handleSubmitQuiz}
                    style={{ padding: "12px 24px", borderRadius: "14px", border: "none", background: "#10b981", color: "#fff", fontWeight: 700, cursor: "pointer" }}
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    style={{ padding: "12px 20px", borderRadius: "14px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer" }}
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

  if (mode === "results" && quiz?.results) {
    return (
      <div style={{ minHeight: "100vh", padding: "20px", background: "#f3f7ff" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "grid", gap: "24px" }}>
          <div style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)", borderRadius: "24px", padding: "32px", color: "#fff", textAlign: "center" }}>
            <div style={{ fontSize: "48px", fontWeight: 900, marginBottom: "12px" }}>{quiz.percentage}%</div>
            <div style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
              {quiz.score} out of {quiz.totalQuestions} correct
            </div>
            <div style={{ opacity: 0.9 }}>
              {quiz.percentage >= 80 ? "Excellent performance! 🎉" : quiz.percentage >= 60 ? "Good job! Keep practicing." : "Keep studying and try again!"}
            </div>
          </div>

          {aiAnalysis ? (
            <div style={{ background: "#f0f9ff", borderRadius: "20px", padding: "24px", border: "2px solid #0ea5e9" }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>📊 AI Analysis & Recommendations</div>
              <div style={{ color: "#475569", lineHeight: 1.8 }}>{aiAnalysis}</div>
            </div>
          ) : null}

          <div style={{ display: "grid", gap: "16px" }}>
            {quiz.results?.map((result, idx) => (
              <div key={idx} style={{ background: "#ffffff", borderRadius: "16px", padding: "20px", border: result.isCorrect ? "2px solid #10b981" : "2px solid #ef4444" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "start", marginBottom: "12px" }}>
                  {result.isCorrect ? (
                    <CheckCircle size={24} color="#10b981" style={{ flexShrink: 0 }} />
                  ) : (
                    <XCircle size={24} color="#ef4444" style={{ flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{idx + 1}. {result.questionText}</div>
                    <div style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
                      Your answer: <strong>{result.userAnswer}</strong>
                    </div>
                    {!result.isCorrect ? (
                      <div style={{ color: "#10b981", fontSize: "14px", marginTop: "4px" }}>
                        Correct answer: <strong>{result.correctAnswer}</strong>
                      </div>
                    ) : null}
                    {result.explanation ? (
                      <div style={{ color: "#475569", fontSize: "14px", marginTop: "8px", padding: "12px", background: "#f8fafc", borderRadius: "10px" }}>
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
            style={{ padding: "16px 24px", borderRadius: "16px", border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, cursor: "pointer" }}
          >
            Back to Generator
          </button>
        </div>
      </div>
    );
  }

  // Generator mode
  return (
    <div style={{ minHeight: "100vh", padding: "30px 24px", background: "#f3f7ff" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gap: "24px" }}>
        <div>
          <div style={{ color: "#0f172a", fontSize: "32px", fontWeight: 800, marginBottom: "8px" }}>
            Quiz Generator
          </div>
          <div style={{ color: "#475569", fontSize: "16px", maxWidth: "780px" }}>
            Generate AI-powered MCQs from content, or use default sample questions to start practicing.
          </div>
        </div>

        {!quiz ? (
          <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "minmax(0, 1fr) 340px" }}>
            <div style={{ background: "#ffffff", borderRadius: "24px", padding: "24px", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)" }}>
              <form onSubmit={handleGenerateQuiz} style={{ display: "grid", gap: "20px" }}>
                <div style={{ display: "grid", gap: "12px" }}>
                  <label style={{ fontWeight: 700, color: "#0f172a" }}>Quiz Title</label>
                  <input
                    value={quizForm.title}
                    onChange={(event) => handleFieldChange("title", event.target.value)}
                    placeholder="Enter quiz title"
                    style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                  <div style={{ display: "grid", gap: "12px" }}>
                    <label style={{ fontWeight: 700, color: "#0f172a" }}>Subject</label>
                    <input
                      value={quizForm.subject}
                      onChange={(event) => handleFieldChange("subject", event.target.value)}
                      placeholder="e.g. Computer Science"
                      style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div style={{ display: "grid", gap: "12px" }}>
                    <label style={{ fontWeight: 700, color: "#0f172a" }}>Category</label>
                    <input
                      value={quizForm.category}
                      onChange={(event) => handleFieldChange("category", event.target.value)}
                      placeholder="e.g. Past Papers"
                      style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={{ fontWeight: 700, color: "#0f172a" }}>MCQ Count</label>
                    <input
                      type="number"
                      min={3}
                      max={20}
                      value={quizForm.count}
                      onChange={(event) => handleFieldChange("count", Number(event.target.value))}
                      style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={{ fontWeight: 700, color: "#0f172a" }}>Time Limit (mins)</label>
                    <input
                      type="number"
                      min={0}
                      value={quizForm.timeLimit}
                      onChange={(event) => handleFieldChange("timeLimit", Number(event.target.value))}
                      style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1" }}
                    />
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={{ fontWeight: 700, color: "#0f172a" }}>Difficulty</label>
                    <select
                      value={quizForm.difficulty}
                      onChange={(event) => handleFieldChange("difficulty", event.target.value)}
                      style={{ width: "100%", padding: "14px 16px", borderRadius: "16px", border: "1px solid #cbd5e1" }}
                    >
                      {difficultyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "1fr 1fr" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", borderRadius: "16px", background: "#f8fafc", border: "1px solid #cbd5e1" }}>
                    <input
                      type="checkbox"
                      checked={quizForm.randomize}
                      onChange={(event) => handleFieldChange("randomize", event.target.checked)}
                    />
                    Random Questions
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", borderRadius: "16px", background: "#f8fafc", border: "1px solid #cbd5e1" }}>
                    <input
                      type="checkbox"
                      checked={quizForm.negativeMarking}
                      onChange={(event) => handleFieldChange("negativeMarking", event.target.checked)}
                    />
                    Negative Marking
                  </label>
                </div>

                <div style={{ display: "grid", gap: "12px" }}>
                  <label style={{ fontWeight: 700, color: "#0f172a" }}>Upload Content (PDF, DOC, Image, etc.)</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                    onChange={handleFileChange}
                    style={{ width: "100%" }}
                  />
                  {file ? (
                    <div style={{ color: "#334155", fontSize: "14px" }}>Selected file: {file.name}</div>
                  ) : (
                    <div style={{ color: "#64748b", fontSize: "14px" }}>
                      Upload notes, assignments, past papers, or images.
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gap: "12px" }}>
                  <label style={{ fontWeight: 700, color: "#0f172a" }}>Or Paste Study Content</label>
                  <textarea
                    value={quizForm.text}
                    onChange={(event) => handleFieldChange("text", event.target.value)}
                    rows={8}
                    placeholder="Paste lesson notes, assignment text, or exam instruction here..."
                    style={{ width: "100%", padding: "16px", borderRadius: "18px", border: "1px solid #cbd5e1", resize: "vertical" }}
                  />
                </div>

                {notice ? (
                  <div style={{ color: "#b91c1c", fontWeight: 700 }}>{notice}</div>
                ) : null}

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
                  }}
                >
                  {loading ? "Generating..." : "Generate Quiz"}
                </button>
              </form>
            </div>

            <div style={{ display: "grid", gap: "20px" }}>
              <button
                onClick={handleUseDefaults}
                style={{
                  width: "100%",
                  padding: "20px",
                  borderRadius: "20px",
                  border: "2px solid #2563eb",
                  background: "#eff6ff",
                  color: "#2563eb",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                📚 Use Default Sample Quiz
              </button>

              <div style={{ background: "#ffffff", borderRadius: "24px", padding: "24px", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)" }}>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", marginBottom: "12px" }}>Saved Quizzes</div>
                {savedQuizzes.length === 0 ? (
                  <div style={{ color: "#64748b" }}>No saved quizzes yet.</div>
                ) : (
                  <div style={{ display: "grid", gap: "12px" }}>
                    {savedQuizzes.slice(0, 5).map((saved) => (
                      <button
                        key={saved._id}
                        onClick={() => {
                          setQuiz(saved);
                          setAnswers({});
                        }}
                        style={{
                          display: "grid",
                          textAlign: "left",
                          width: "100%",
                          padding: "16px",
                          borderRadius: "18px",
                          border: "1px solid #e2e8f0",
                          background: "#f8fafc",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{saved.title}</div>
                        <div style={{ color: "#64748b", fontSize: "13px" }}>
                          {saved.questions?.length || 0} questions
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: "#ffffff", borderRadius: "24px", padding: "28px", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "24px" }}>
              <div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>{quiz.title}</div>
                <div style={{ color: "#64748b", fontSize: "14px", marginTop: "6px" }}>
                  {quiz.subject} · {quiz.category} · {quiz.questions?.length || 0} questions
                </div>
              </div>
              <button
                onClick={() => {
                  setQuiz(null);
                  setAnswers({});
                }}
                style={{ padding: "10px 16px", borderRadius: "12px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer" }}
              >
                ← Back
              </button>
            </div>

            <button
              onClick={() => handleStartQuiz(quiz)}
              style={{
                width: "100%",
                padding: "18px 24px",
                borderRadius: "18px",
                border: "none",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff",
                fontWeight: 800,
                fontSize: "16px",
                cursor: "pointer",
                marginBottom: "24px",
              }}
            >
              Start Quiz →
            </button>

            <div style={{ display: "grid", gap: "14px" }}>
              {quiz.questions?.map((question, idx) => (
                <div key={idx} style={{ padding: "18px", borderRadius: "16px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>
                    {idx + 1}. {question.questionText}
                  </div>
                  <div style={{ display: "grid", gap: "6px", marginBottom: "10px" }}>
                    {question.options?.map((option, optIdx) => (
                      <div key={optIdx} style={{ color: "#334155", fontSize: "14px" }}>
                        {String.fromCharCode(65 + optIdx)}) {option}
                      </div>
                    ))}
                  </div>
                  <div style={{ color: "#0f766e", fontWeight: 700, fontSize: "14px" }}>Answer: {question.correctAnswer}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizGenerator;

