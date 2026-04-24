import { useEffect, useState, useCallback, useRef } from "react";
import API from "../../services/api";
import Timer from "../../components/Timer";
import Proctoring from "../../components/Proctoring";
import WarningModal from "../../components/WarningModal";

const createSessionId = () =>
  Math.random().toString(36).slice(2, 11).toUpperCase();

const extractList = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  return [];
};

const Exam = () => {
  // --- States ---
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);

  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Warning Counters
  const [warnings, setWarnings] = useState(0);
  const [eyeWarnings, setEyeWarnings] = useState(0);
  const [headWarnings, setHeadWarnings] = useState(0);
  const [soundWarnings, setSoundWarnings] = useState(0);
  const [tabWarnings, setTabWarnings] = useState(0);
  const [fullscreenWarnings, setFullscreenWarnings] = useState(0);
  const [copyWarnings, setCopyWarnings] = useState(0);
  const [rightClickWarnings, setRightClickWarnings] = useState(0);

  const [warningMessage, setWarningMessage] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const hasSubmitted = useRef(false);
  const warningTimeoutRef = useRef(null);
  const sessionIdRef = useRef(createSessionId());

  // 1. Fetch Exams
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoadingExams(true);
        setErrorMessage("");

        const res = await API.get("/api/exams/all");
        console.log("Exams API response:", res.data);

        const examList = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.exams)
          ? res.data.exams
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        // ✅ FILTER: Only show live exams to students
        setExams(examList);
        setExams(liveExams);
      } catch (err) {
        console.error("Fetch exams error:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });

        setErrorMessage(
          err.response?.data?.message ||
            `Failed to load exams (${err.response?.status || err.message})`
        );
      } finally {
        setLoadingExams(false);
      }
    };

    fetchExams();

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue =
        "Are you sure you want to leave? Your progress will be lost.";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // 2. Specialized Warning Function
  const addWarning = useCallback(
    (type, message) => {
      if (submitted || hasSubmitted.current) return;

      setWarnings((prev) => prev + 1);

      if (type === "eye") setEyeWarnings((prev) => prev + 1);
      if (type === "head") setHeadWarnings((prev) => prev + 1);
      if (type === "sound") setSoundWarnings((prev) => prev + 1);
      if (type === "tab") setTabWarnings((prev) => prev + 1);
      if (type === "fullscreen") setFullscreenWarnings((prev) => prev + 1);
      if (type === "copy") setCopyWarnings((prev) => prev + 1);
      if (type === "rightclick") setRightClickWarnings((prev) => prev + 1);

      setWarningMessage(message);
      setShowWarning(true);

      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }

      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(false);
      }, 3000);
    },
    [submitted],
  );

  // 3. Security Event Listeners
  useEffect(() => {
    const handleCopy = (e) => {
      e.preventDefault();
      addWarning("copy", "Copy/Paste is disabled!");
    };

    const handleRightClick = (e) => {
      e.preventDefault();
      addWarning("rightclick", "Right-click is restricted!");
    };

    const handleVisibility = () => {
      if (document.hidden) {
        addWarning("tab", "Don't switch tabs!");
      }
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("contextmenu", handleRightClick);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("contextmenu", handleRightClick);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [addWarning]);

  const startExam = async (exam) => {
    if (!exam?._id) {
      setErrorMessage("Invalid exam selected.");
      return;
    }

    try {
      setSelectedExam(exam);
      setLoadingQuestions(true);
      setErrorMessage("");
      setQuestions([]);
      setCurrentIdx(0);
      setAnswers({});
      sessionIdRef.current = createSessionId();

      const res = await API.get(`/api/questions/${exam._id}`);
      const questionList = extractList(res.data, ["data", "questions"]);

      setQuestions(questionList);

      if (questionList.length === 0) {
        setErrorMessage("No questions found for this exam.");
      }
    } catch (err) {
      console.log(err);
      setQuestions([]);
      setErrorMessage("Failed to load questions.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  // 4. Handle Submission
  const handleSubmit = async () => {
    if (hasSubmitted.current || submitted || submitting) return;

    hasSubmitted.current = true;
    setSubmitting(true);

    try {
      let scoreCount = 0;

      questions.forEach((q, i) => {
        const correct = q.correctAnswer || q.answer;

        if (
          answers[i] &&
          String(answers[i]).toLowerCase().trim() ===
            String(correct).toLowerCase().trim()
        ) {
          scoreCount++;
        }
      });

      const total = questions.length;
      const percentage =
        total > 0 ? Number(((scoreCount / total) * 100).toFixed(2)) : 0;

      let user = {
        name: "Muhammad Zubair",
        id: "654321",
      };

      try {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          user = {
            ...user,
            ...parsedUser,
          };
        }
      } catch (error) {
        console.log("User parse error:", error);
      }

      const resultData = {
        userId: user.id || user._id || "654321",
        studentName: user.name || "Muhammad Zubair",
        testName: selectedExam?.title || "ProctorSecure Final Assessment",
        score: scoreCount,
        total,
        percentage,
        status: percentage >= 50 ? "PASSED" : "FAILED",
        warnings,
        eyeWarnings,
        headWarnings,
        soundWarnings,
        tabWarnings,
        fullscreenWarnings,
        copyWarnings,
        rightClickWarnings,
        cheatingPercent: Number(((warnings / 20) * 100).toFixed(2)),
      };

      console.log("Teacher Panel Payload:", resultData);

      await API.post("/api/results/submit", resultData);
      localStorage.setItem("/api/examResult", JSON.stringify(resultData));

      setSubmitted(true);
      window.location.href = "/api/results";
    } catch (err) {
      console.error("Submission Error:", err);
      window.location.href = "/api/results";
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = questions[currentIdx];
  const currentOptions = Array.isArray(currentQuestion?.options)
    ? currentQuestion.options
    : [];

  // Step 1: Exam select screen
  if (!selectedExam) {
    return (
      <div style={{ padding: "40px" }}>
        <h2>Select Exam</h2>

        {loadingExams && <div style={loaderStyle}>Loading Exams...</div>}

        {!loadingExams && errorMessage && (
          <div style={errorBoxStyle}>{errorMessage}</div>
        )}

        {!loadingExams && !errorMessage && exams.length === 0 && (
          <div style={emptyBoxStyle}>No exams available.</div>
        )}

        {!loadingExams &&
          exams.map((exam) => (
            <div key={exam._id} style={examCardStyle}>
              <h3>{exam.title}</h3>
              <button onClick={() => startExam(exam)} style={btnNext}>
                Start Exam
              </button>
            </div>
          ))}
      </div>
    );
  }

  // Step 2: Loader
  if (loadingQuestions) {
    return <div style={loaderStyle}>Loading Questions...</div>;
  }

  // Step 3: Error screen
  if (errorMessage && questions.length === 0) {
    return (
      <div style={loaderStyle}>
        <div style={errorWrapperStyle}>
          <div style={{ marginBottom: "20px" }}>{errorMessage}</div>
          <button
            onClick={() => {
              setSelectedExam(null);
              setErrorMessage("");
            }}
            style={btnPrev}
          >
            Back To Exams
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Safety check
  if (!currentQuestion) {
    return (
      <div style={loaderStyle}>
        <div style={errorWrapperStyle}>
          <div style={{ marginBottom: "20px" }}>Question not found.</div>
          <button
            onClick={() => {
              setSelectedExam(null);
              setQuestions([]);
              setCurrentIdx(0);
              setErrorMessage("");
            }}
            style={btnPrev}
          >
            Back To Exams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Proctoring addWarning={addWarning} />

      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0, color: "#1a2a6c" }}>{selectedExam.title}</h2>
          <div style={{ fontSize: "12px", color: "#666" }}>
            SESSION ID: {sessionIdRef.current}
          </div>
        </div>

        <div style={timerBoxStyle}>
          <Timer
            duration={(selectedExam?.duration || 5) * 60}
            onTimeUp={handleSubmit}
          />
        </div>
      </div>

      <div style={mainLayoutStyle}>
        <div style={questionAreaStyle}>
          <div style={cardStyle}>
            <div style={qHeaderStyle}>
              <span style={badgeStyle}>
                Question {currentIdx + 1} of {questions.length}
              </span>

              <div style={progressBarContainer}>
                <div
                  style={{
                    ...progressBar,
                    width: `${((currentIdx + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <h3 style={qTextStyle}>{currentQuestion.questionText}</h3>

            <div style={optionsContainer}>
              {currentOptions.map((opt, j) => (
                <label
                  key={j}
                  style={{
                    ...optionStyle,
                    backgroundColor:
                      answers[currentIdx] === opt ? "#e3f2fd" : "#fff",
                    borderColor:
                      answers[currentIdx] === opt ? "#2196f3" : "#eee",
                  }}
                >
                  <input
                    type="radio"
                    name={`q${currentIdx}`}
                    checked={answers[currentIdx] === opt}
                    onChange={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [currentIdx]: opt,
                      }))
                    }
                    style={{ marginRight: "15px", transform: "scale(1.3)" }}
                  />
                  {opt}
                </label>
              ))}
            </div>

            <div style={navigationStyle}>
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => prev - 1)}
                style={btnPrev}
              >
                Back
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx((prev) => prev + 1)}
                  style={btnNext}
                >
                  Save & Next
                </button>
              ) : (
                <button onClick={handleSubmit} style={btnSubmit}>
                  {submitting ? "Submitting..." : "Final Submit"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={sidebarStyle}>
          <h4 style={{ margin: "0 0 15px 0", color: "#ff4b2b" }}>
            Integrity Log
          </h4>

          <div style={statBox}>
            <div style={statItem}>
              <span>Total Alerts</span>
              <b>{warnings}</b>
            </div>

            <div style={statItem}>
              <span>Eye Tracking</span>
              <b>{eyeWarnings}</b>
            </div>

            <div style={statItem}>
              <span>Head Posture</span>
              <b>{headWarnings}</b>
            </div>

            <div style={statItem}>
              <span>Sound</span>
              <b>{soundWarnings}</b>
            </div>

            <div style={statItem}>
              <span>Tab Switch</span>
              <b>{tabWarnings}</b>
            </div>

            <div style={statItem}>
              <span>Fullscreen</span>
              <b>{fullscreenWarnings}</b>
            </div>

            <div style={statItem}>
              <span>Copy Paste</span>
              <b>{copyWarnings}</b>
            </div>

            <div style={statItem}>
              <span>Right Click</span>
              <b>{rightClickWarnings}</b>
            </div>
          </div>

          <div style={securityBadge}>AI SHIELD ACTIVE</div>
        </div>
      </div>

      {showWarning && <WarningModal message={warningMessage} />}
    </div>
  );
};

// --- Styles ---
const containerStyle = {
  padding: "40px",
  backgroundColor: "#f4f7f9",
  minHeight: "100vh",
  fontFamily: "'Poppins', sans-serif",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "20px 30px",
  backgroundColor: "#fff",
  borderRadius: "15px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  marginBottom: "30px",
};

const timerBoxStyle = {
  backgroundColor: "#fef9e7",
  border: "1px solid #f39c12",
  padding: "10px 25px",
  borderRadius: "10px",
  fontWeight: "bold",
  fontSize: "18px",
};

const mainLayoutStyle = {
  display: "grid",
  gridTemplateColumns: "3fr 1fr",
  gap: "30px",
};

const cardStyle = {
  backgroundColor: "#fff",
  padding: "40px",
  borderRadius: "20px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const qHeaderStyle = { marginBottom: "30px" };

const badgeStyle = {
  backgroundColor: "#e8f0fe",
  color: "#1a73e8",
  padding: "5px 15px",
  borderRadius: "5px",
  fontSize: "12px",
  fontWeight: "bold",
};

const progressBarContainer = {
  width: "100%",
  height: "4px",
  backgroundColor: "#eee",
  marginTop: "15px",
  borderRadius: "2px",
};

const progressBar = {
  height: "100%",
  backgroundColor: "#1a73e8",
  transition: "width 0.4s",
};

const qTextStyle = {
  fontSize: "24px",
  color: "#2c3e50",
  marginBottom: "30px",
  fontWeight: "500",
};

const optionsContainer = { display: "grid", gap: "15px" };

const optionStyle = {
  display: "flex",
  alignItems: "center",
  padding: "20px",
  border: "2px solid",
  borderRadius: "12px",
  cursor: "pointer",
  transition: "0.3s",
};

const navigationStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: "40px",
};

const sidebarStyle = {
  backgroundColor: "#fff",
  padding: "25px",
  borderRadius: "20px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  height: "fit-content",
};

const statBox = { display: "grid", gap: "10px" };

const statItem = {
  display: "flex",
  justifyContent: "space-between",
  padding: "12px",
  backgroundColor: "#fcfcfc",
  borderRadius: "8px",
  borderBottom: "1px solid #eee",
  fontSize: "13px",
};

const securityBadge = {
  marginTop: "20px",
  textAlign: "center",
  fontSize: "10px",
  letterSpacing: "2px",
  color: "#27ae60",
  fontWeight: "bold",
  border: "1px solid #27ae60",
  padding: "5px",
  borderRadius: "4px",
};

const btnNext = {
  padding: "12px 35px",
  backgroundColor: "#1a73e8",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const btnPrev = {
  padding: "12px 35px",
  backgroundColor: "#f1f3f4",
  color: "#5f6368",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

const btnSubmit = {
  padding: "12px 35px",
  backgroundColor: "#27ae60",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const loaderStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  fontSize: "20px",
  fontWeight: "bold",
  color: "#34495e",
  textAlign: "center",
};

const questionAreaStyle = { position: "relative" };

const examCardStyle = {
  backgroundColor: "#fff",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  marginBottom: "16px",
};

const errorBoxStyle = {
  backgroundColor: "#ffeaea",
  color: "#c0392b",
  padding: "14px 18px",
  borderRadius: "10px",
  marginBottom: "20px",
};

const emptyBoxStyle = {
  backgroundColor: "#fff",
  color: "#555",
  padding: "20px",
  borderRadius: "10px",
  marginBottom: "20px",
};

const errorWrapperStyle = {
  backgroundColor: "#fff",
  padding: "30px",
  borderRadius: "16px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

export default Exam;
