import { useEffect, useMemo, useState } from "react";
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

const formatQuizAsCsv = (quiz) => {
  const rows = ["Question,Option A,Option B,Option C,Option D,Correct Answer,Explanation,Difficulty,Topic"];
  quiz.questions.forEach((question) => {
    const values = [
      question.questionText,
      question.options[0] || "",
      question.options[1] || "",
      question.options[2] || "",
      question.options[3] || "",
      question.correctAnswer,
      question.explanation,
      question.difficultyTag,
      question.topic,
    ];
    rows.push(values.map((value) => `"${String(value || "").replace(/"/g, '""')}"`).join(","));
  });
  return rows.join("\n");
};

function QuizGenerator() {
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

      setQuiz(response.data.quiz);
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

  const handleDownloadCsv = () => {
    if (!quiz) return;
    const csv = formatQuizAsCsv(quiz);
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${quiz.title || "quiz"}.csv`);
  };

  const handleDownloadPdf = () => {
    if (!quiz) return;
    const pdfText = [`${quiz.title}`.toUpperCase(), `Subject: ${quiz.subject}`, `Category: ${quiz.category}`, ""].concat(
      quiz.questions.map((question, index) => {
        const options = question.options.map((option, optionIndex) => `${String.fromCharCode(65 + optionIndex)}) ${option}`);
        return [`${index + 1}. ${question.questionText}`, ...options, `Answer: ${question.correctAnswer}`, `Explanation: ${question.explanation}`, `Difficulty: ${question.difficultyTag}`, `Topic: ${question.topic}`, ""]; 
      }).flat()
    ).join("\n");

    const blob = new Blob([pdfText], { type: "application/pdf" });
    downloadBlob(blob, `${quiz.title || "quiz"}.pdf`);
  };

  const selectedQuiz = useMemo(() => quiz, [quiz]);

  return (
    <div style={{ minHeight: "100vh", padding: "30px 24px", background: "#f3f7ff" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gap: "24px" }}>
        <div>
          <div style={{ color: "#0f172a", fontSize: "32px", fontWeight: 800, marginBottom: "8px" }}>
            Quiz Generator
          </div>
          <div style={{ color: "#475569", fontSize: "16px", maxWidth: "780px" }}>
            Generate AI-powered multiple-choice quizzes from pasted content, uploaded files, notes and past papers. Save quizzes to the database and reuse them later.
          </div>
        </div>

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
                <label style={{ fontWeight: 700, color: "#0f172a" }}>Upload Content</label>
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
                    Upload notes, assignments, past papers, PDF, DOC, or images. If you prefer, paste your content below.
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gap: "12px" }}>
                <label style={{ fontWeight: 700, color: "#0f172a" }}>Paste Study Content</label>
                <textarea
                  value={quizForm.text}
                  onChange={(event) => handleFieldChange("text", event.target.value)}
                  rows={10}
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
                {loading ? "Generating quiz..." : "Generate Quiz"}
              </button>
            </form>
          </div>

          <div style={{ display: "grid", gap: "20px" }}>
            <div style={{ background: "#ffffff", borderRadius: "24px", padding: "24px", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)" }}>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", marginBottom: "12px" }}>Saved Quizzes</div>
              {savedQuizzes.length === 0 ? (
                <div style={{ color: "#64748b" }}>No saved quizzes yet. Generate a quiz to save it here.</div>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {savedQuizzes.slice(0, 6).map((saved) => (
                    <button
                      key={saved._id}
                      type="button"
                      onClick={() => setQuiz(saved)}
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
                        {saved.subject} · {saved.category} · {saved.questions?.length || 0} questions
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: "#ffffff", borderRadius: "24px", padding: "24px", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)" }}>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", marginBottom: "12px" }}>Generator Notes</div>
              <ul style={{ color: "#475569", lineHeight: 1.9, paddingLeft: "18px" }}>
                <li>Upload notes, PDFs, past papers, or images.</li>
                <li>Set a difficulty and question count.</li>
                <li>Generated quizzes are saved automatically in the database.</li>
                <li>You can reuse saved quizzes by selecting one from the list.</li>
              </ul>
            </div>
          </div>
        </div>

        {selectedQuiz ? (
          <div style={{ display: "grid", gap: "18px", background: "#ffffff", borderRadius: "24px", padding: "24px", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "14px" }}>
              <div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>{selectedQuiz.title}</div>
                <div style={{ color: "#64748b", marginTop: "6px" }}>
                  {selectedQuiz.subject} · {selectedQuiz.category} · {selectedQuiz.difficulty}
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  style={{ border: "1px solid #cbd5e1", padding: "12px 18px", borderRadius: "14px", background: "#f8fafc", cursor: "pointer" }}
                >
                  Export to Excel
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  style={{ border: "none", padding: "12px 18px", borderRadius: "14px", background: "#2563eb", color: "#fff", cursor: "pointer" }}
                >
                  Download as PDF
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gap: "20px" }}>
              {selectedQuiz.questions?.map((question, index) => (
                <div key={`${question._id}-${index}`} style={{ padding: "20px", borderRadius: "20px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>
                    {index + 1}. {question.questionText}
                  </div>
                  <div style={{ display: "grid", gap: "8px", marginBottom: "12px" }}>
                    {question.options?.map((option, optionIndex) => (
                      <div key={optionIndex} style={{ color: "#334155" }}>
                        <strong>{String.fromCharCode(65 + optionIndex)}.</strong> {option}
                      </div>
                    ))}
                  </div>
                  <div style={{ color: "#0f766e", fontWeight: 700 }}>Answer: {question.correctAnswer}</div>
                  {question.explanation ? (
                    <div style={{ color: "#475569", marginTop: "8px" }}>Explanation: {question.explanation}</div>
                  ) : null}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "12px", color: "#475569", fontSize: "13px" }}>
                    <span>Difficulty: {question.difficultyTag || selectedQuiz.difficulty}</span>
                    <span>Topic: {question.topic || "General"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default QuizGenerator;
