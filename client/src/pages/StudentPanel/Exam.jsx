import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import API from "../../services/api";
import Timer from "../../components/Timer";
import Proctoring from "../../components/Proctoring";
import WarningModal from "../../components/WarningModal";

const ACTIVE_SESSION_KEY = "proctor-ai-active-exam";

const WARNING_FIELD_MAP = {
  eye: "eyeWarnings",
  head: "headWarnings",
  sound: "soundWarnings",
  tab: "tabWarnings",
  fullscreen: "fullscreenWarnings",
  copy: "copyWarnings",
  paste: "pasteWarnings",
  cut: "cutWarnings",
  rightclick: "rightClickWarnings",
  shortcut: "shortcutWarnings",
  screenshot: "screenshotWarnings",
  focus: "focusWarnings",
  visibility: "visibilityWarnings",
  exit: "exitWarnings",
  faceMissing: "faceMissingWarnings",
  multipleFace: "multipleFaceWarnings",
  screenShare: "screenShareWarnings",
};

const WARNING_SEVERITY = {
  eye: "medium",
  head: "medium",
  sound: "medium",
  tab: "high",
  fullscreen: "high",
  copy: "high",
  paste: "high",
  cut: "high",
  rightclick: "medium",
  shortcut: "medium",
  screenshot: "high",
  focus: "high",
  visibility: "high",
  exit: "critical",
  faceMissing: "high",
  multipleFace: "critical",
  screenShare: "critical",
};

const WARNING_WEIGHTS = {
  eyeWarnings: 3,
  headWarnings: 4,
  soundWarnings: 3,
  tabWarnings: 10,
  fullscreenWarnings: 9,
  copyWarnings: 8,
  pasteWarnings: 8,
  cutWarnings: 8,
  rightClickWarnings: 4,
  shortcutWarnings: 6,
  screenshotWarnings: 12,
  focusWarnings: 6,
  visibilityWarnings: 7,
  exitWarnings: 15,
  faceMissingWarnings: 8,
  multipleFaceWarnings: 12,
  screenShareWarnings: 10,
};

const initialWarningCounts = {
  total: 0,
  eyeWarnings: 0,
  headWarnings: 0,
  soundWarnings: 0,
  tabWarnings: 0,
  fullscreenWarnings: 0,
  copyWarnings: 0,
  pasteWarnings: 0,
  cutWarnings: 0,
  rightClickWarnings: 0,
  shortcutWarnings: 0,
  screenshotWarnings: 0,
  focusWarnings: 0,
  visibilityWarnings: 0,
  exitWarnings: 0,
  faceMissingWarnings: 0,
  multipleFaceWarnings: 0,
  screenShareWarnings: 0,
};

const createSessionId = () => Math.random().toString(36).slice(2, 11).toUpperCase();

const extractList = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  return [];
};

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const round = (value) => Number(value.toFixed(2));

const computeTrustFactor = (score) => {
  if (score >= 65) return "Critical";
  if (score >= 40) return "Suspicious";
  if (score >= 20) return "Monitor";
  return "Reliable";
};

const Exam = () => {
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);

  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resumeNotice, setResumeNotice] = useState("");

  const [warningCounts, setWarningCounts] = useState(initialWarningCounts);
  const [activityLog, setActivityLog] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [warningSeverity, setWarningSeverity] = useState("medium");
  const [warningDisplayCount, setWarningDisplayCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [telemetry, setTelemetry] = useState({
    cameraReady: false,
    microphoneReady: false,
    faceVisible: false,
    multipleFaces: false,
    faceStatus: "Aligning face",
    framingStatus: "Center your face inside the camera frame.",
    audioLevel: 0,
    audioStatus: "Calibrating room",
  });

  const hasSubmitted = useRef(false);
  const warningTimeoutRef = useRef(null);
  const sessionIdRef = useRef(createSessionId());
  const warningCountRef = useRef(initialWarningCounts);

  const isPhone = viewportWidth < 768;
  const isCompactLayout = viewportWidth < 1120;
  const shouldEnforceFullscreen =
    viewportWidth >= 1024 && typeof document !== "undefined" && document.fullscreenEnabled;

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    warningCountRef.current = warningCounts;
  }, [warningCounts]);

  const fetchExams = useCallback(async () => {
    try {
      setLoadingExams(true);
      setErrorMessage("");

      const res = await API.get("/api/exams/all");
      const examList = extractList(res.data, ["exams", "data"]).filter(
        (exam) => exam.status !== "closed"
      );

      setExams(examList);

      if (selectedExam) {
        const updatedExam = examList.find((exam) => exam._id === selectedExam._id);
        if (updatedExam) {
          setSelectedExam(updatedExam);
        }
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message ||
          `Failed to load exams (${err.response?.status || err.message})`
      );
    } finally {
      setLoadingExams(false);
    }
  }, [selectedExam]);

  const loadQuestions = useCallback(async (examId, initialLoad = false) => {
    try {
      if (initialLoad) {
        setLoadingQuestions(true);
      }

      const res = await API.get(`/api/questions/${examId}`);
      const questionList = extractList(res.data, ["questions", "data"]);

      setQuestions(questionList);
      setErrorMessage("");
    } catch (err) {
      if (err.response?.status === 403) {
        setErrorMessage(
          err.response?.data?.message || "Teacher ne access enable nahi kiya."
        );
      } else {
        setErrorMessage("Failed to load questions.");
      }
      setQuestions([]);
    } finally {
      if (initialLoad) {
        setLoadingQuestions(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchExams();
    const examInterval = window.setInterval(fetchExams, 10000);

    try {
      const savedSession = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (savedSession) {
        const parsedSession = JSON.parse(savedSession);
        setResumeNotice(
          `Previous exam session ${parsedSession.sessionId || ""} closed unexpectedly. This will be flagged in the next attempt.`
        );
        localStorage.removeItem(ACTIVE_SESSION_KEY);
      }
    } catch (err) {
      console.error("Failed to read active exam session:", err);
    }

    return () => {
      window.clearInterval(examInterval);
      if (warningTimeoutRef.current) {
        window.clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [fetchExams]);

  useEffect(() => {
    if (!selectedExam || submitted) {
      return undefined;
    }

    loadQuestions(selectedExam._id, true);
    const questionInterval = window.setInterval(() => {
      loadQuestions(selectedExam._id, false);
    }, 5000);

    return () => window.clearInterval(questionInterval);
  }, [loadQuestions, selectedExam, submitted]);

  useEffect(() => {
    if (!selectedExam || submitted) {
      return undefined;
    }

    const persistSession = () => {
      localStorage.setItem(
        ACTIVE_SESSION_KEY,
        JSON.stringify({
          sessionId: sessionIdRef.current,
          examId: selectedExam._id,
          examTitle: selectedExam.title,
          savedAt: new Date().toISOString(),
        })
      );
    };

    const handleBeforeUnload = (event) => {
      persistSession();
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [selectedExam, submitted]);

  const addWarning = useCallback((type, message) => {
    if (submitted || hasSubmitted.current) return;

    const field = WARNING_FIELD_MAP[type];
    const nextTotal = (warningCountRef.current?.total || 0) + 1;
    warningCountRef.current = {
      ...warningCountRef.current,
      total: nextTotal,
      ...(field
        ? {
            [field]: (warningCountRef.current?.[field] || 0) + 1,
          }
        : {}),
    };

    setWarningCounts((prev) => ({
      ...prev,
      total: prev.total + 1,
      ...(field ? { [field]: prev[field] + 1 } : {}),
    }));

    setActivityLog((prev) => {
      const now = new Date().toISOString();
      const existing = prev.find((item) => item.type === type && item.message === message);

      if (existing) {
        return prev
          .map((item) =>
            item.type === type && item.message === message
              ? {
                  ...item,
                  count: item.count + 1,
                  occurredAt: now,
                }
              : item
          )
          .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
          .slice(0, 12);
      }

      return [
        {
          type,
          message,
          count: 1,
          severity: WARNING_SEVERITY[type] || "medium",
          occurredAt: now,
        },
        ...prev,
      ].slice(0, 12);
    });

    setWarningMessage(message);
    setWarningSeverity(WARNING_SEVERITY[type] || "medium");
    setWarningDisplayCount(nextTotal);
    setShowWarning(true);

    if (warningTimeoutRef.current) {
      window.clearTimeout(warningTimeoutRef.current);
    }

    warningTimeoutRef.current = window.setTimeout(() => {
      setShowWarning(false);
    }, 4200);
  }, [submitted]);

  useEffect(() => {
    if (!selectedExam || submitted) {
      return undefined;
    }

    const handleCopy = (event) => {
      event.preventDefault();
      addWarning("copy", "Copy action blocked. Stay within the exam flow.");
    };

    const handlePaste = (event) => {
      event.preventDefault();
      addWarning("paste", "Paste action blocked. External content is not allowed.");
    };

    const handleCut = (event) => {
      event.preventDefault();
      addWarning("cut", "Cut action blocked during the exam.");
    };

    const handleRightClick = (event) => {
      event.preventDefault();
      addWarning("rightclick", "Right-click is disabled during the exam.");
    };

    const handleVisibility = () => {
      if (document.hidden) {
        addWarning("tab", "Tab switch detected. Keep the exam window active.");
        addWarning("visibility", "Exam visibility changed.");
      }
    };

    const handleFullscreen = () => {
      if (shouldEnforceFullscreen && !document.fullscreenElement) {
        addWarning("fullscreen", "Fullscreen mode exited during the exam.");
      }
    };

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const ctrlOrMeta = event.ctrlKey || event.metaKey;

      if (
        event.key === "PrintScreen" ||
        (event.metaKey && event.shiftKey && ["3", "4"].includes(key)) ||
        (event.ctrlKey && event.shiftKey && key === "s")
      ) {
        addWarning("screenshot", "Screenshot shortcut detected.");
      }

      if (ctrlOrMeta && ["a", "p", "u"].includes(key)) {
        addWarning("shortcut", `Restricted keyboard shortcut detected (${key.toUpperCase()}).`);
      }
    };

    const handleWindowBlur = () => {
      if (!document.hidden) {
        addWarning(
          "screenShare",
          "Exam window focus changed. Possible overlay or share tool detected."
        );
      }

      addWarning("focus", "Exam window lost focus.");
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("cut", handleCut);
    document.addEventListener("contextmenu", handleRightClick);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleWindowBlur);

    if (shouldEnforceFullscreen) {
      document.addEventListener("fullscreenchange", handleFullscreen);
    }

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("contextmenu", handleRightClick);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleWindowBlur);

      if (shouldEnforceFullscreen) {
        document.removeEventListener("fullscreenchange", handleFullscreen);
      }
    };
  }, [addWarning, selectedExam, shouldEnforceFullscreen, submitted]);

  const resetExamState = () => {
    setSelectedExam(null);
    setQuestions([]);
    setCurrentIdx(0);
    setAnswers({});
    setErrorMessage("");
    setSubmitted(false);
    setSubmitting(false);
    setWarningCounts(initialWarningCounts);
    setActivityLog([]);
    sessionIdRef.current = createSessionId();
    hasSubmitted.current = false;
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  };

  const startExam = async (exam) => {
    if (!exam?._id) {
      setErrorMessage("Invalid exam selected.");
      return;
    }

    if (!exam.canStart) {
      setErrorMessage("Exam abhi teacher ne start/access enable nahi kiya.");
      return;
    }

    hasSubmitted.current = false;
    setSubmitted(false);
    setSelectedExam(exam);
    setQuestions([]);
    setCurrentIdx(0);
    setAnswers({});
    setWarningCounts({
      ...initialWarningCounts,
      exitWarnings: resumeNotice ? 1 : 0,
      total: resumeNotice ? 1 : 0,
    });
    setActivityLog(
      resumeNotice
        ? [
            {
              type: "exit",
              message: resumeNotice,
              count: 1,
              severity: "critical",
              occurredAt: new Date().toISOString(),
            },
          ]
        : []
    );
    setErrorMessage("");
    sessionIdRef.current = createSessionId();

    if (shouldEnforceFullscreen && !document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.error("Fullscreen request failed:", err);
      }
    }

    await loadQuestions(exam._id, true);
  };

  const handleSubmit = useCallback(async () => {
    if (hasSubmitted.current || submitted || submitting || !selectedExam) {
      return;
    }

    hasSubmitted.current = true;
    setSubmitting(true);

    try {
      let scoreCount = 0;
      const answeredCount = Object.values(answers).filter(Boolean).length;

      questions.forEach((question, index) => {
        const correct = question.correctAnswer || question.answer;
        if (
          answers[index] &&
          String(answers[index]).toLowerCase().trim() ===
            String(correct).toLowerCase().trim()
        ) {
          scoreCount += 1;
        }
      });

      const total = questions.length;
      const incorrectAnswers = Math.max(answeredCount - scoreCount, 0);
      const unansweredAnswers = Math.max(total - answeredCount, 0);
      const academicAccuracy = total > 0 ? round((scoreCount / total) * 100) : 0;

      const weightedSuspicion = Object.entries(WARNING_WEIGHTS).reduce(
        (sum, [field, weight]) => sum + (warningCounts[field] || 0) * weight,
        0
      );

      const suspiciousScore = clamp(
        round((weightedSuspicion / Math.max(30, total * 14 || 30)) * 100)
      );
      const integrityScore = clamp(round(100 - suspiciousScore));
      const intelligenceScore = clamp(round(academicAccuracy * 0.74 + integrityScore * 0.26));
      const trustFactor = computeTrustFactor(suspiciousScore);

      let user = { name: "Student", id: "" };

      try {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          user = { ...user, ...JSON.parse(savedUser) };
        }
      } catch (err) {
        console.error("Failed to parse user for result submission:", err);
      }

      const resultData = {
        examId: selectedExam._id,
        studentName: user.name || "Student",
        testName: selectedExam.title || "Exam",
        score: scoreCount,
        total,
        answeredCount,
        incorrectAnswers,
        unansweredAnswers,
        percentage: academicAccuracy,
        academicAccuracy,
        status: academicAccuracy >= 50 ? "PASSED" : "FAILED",
        warnings: warningCounts.total,
        eyeWarnings: warningCounts.eyeWarnings,
        headWarnings: warningCounts.headWarnings,
        soundWarnings: warningCounts.soundWarnings,
        tabWarnings: warningCounts.tabWarnings,
        fullscreenWarnings: warningCounts.fullscreenWarnings,
        copyWarnings: warningCounts.copyWarnings,
        pasteWarnings: warningCounts.pasteWarnings,
        cutWarnings: warningCounts.cutWarnings,
        rightClickWarnings: warningCounts.rightClickWarnings,
        shortcutWarnings: warningCounts.shortcutWarnings,
        screenshotWarnings: warningCounts.screenshotWarnings,
        focusWarnings: warningCounts.focusWarnings,
        visibilityWarnings: warningCounts.visibilityWarnings,
        exitWarnings: warningCounts.exitWarnings,
        faceMissingWarnings: warningCounts.faceMissingWarnings,
        multipleFaceWarnings: warningCounts.multipleFaceWarnings,
        screenShareWarnings: warningCounts.screenShareWarnings,
        cheatingPercent: suspiciousScore,
        integrityScore,
        intelligenceScore,
        suspiciousScore,
        trustFactor,
        activityLog,
      };

      await API.post("/api/results/submit", resultData);
      localStorage.setItem("examResult", JSON.stringify(resultData));
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      setSubmitted(true);

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      window.location.href = "/results";
    } catch (err) {
      console.error("Submission error:", err);
      localStorage.setItem(
        "examResult",
        JSON.stringify({
          examId: selectedExam._id,
          studentName: "Student",
          testName: selectedExam.title || "Exam",
          score: 0,
          total: questions.length,
          percentage: 0,
          warnings: warningCounts.total,
        })
      );
      window.location.href = "/results";
    } finally {
      setSubmitting(false);
    }
  }, [activityLog, answers, questions, selectedExam, submitted, submitting, warningCounts]);

  const currentQuestion = questions[currentIdx];
  const currentQuestionText =
    currentQuestion?.questionText || currentQuestion?.question || "";
  const currentOptions = Array.isArray(currentQuestion?.options)
    ? currentQuestion.options
    : [];
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const remainingCount = Math.max(questions.length - answeredCount, 0);

  const suspiciousScorePreview = useMemo(() => {
    const weightedSuspicion = Object.entries(WARNING_WEIGHTS).reduce(
      (sum, [field, weight]) => sum + (warningCounts[field] || 0) * weight,
      0
    );

    return clamp(round((weightedSuspicion / Math.max(30, questions.length * 14 || 30)) * 100));
  }, [questions.length, warningCounts]);

  if (!selectedExam) {
    return (
      <div style={styles.page}>
        <div style={styles.hero}>
          <div>
            <div style={styles.heroKicker}>Student Exam Center</div>
            <h1 style={styles.heroTitle}>Start exams with live AI proctoring and clear readiness checks</h1>
            <p style={styles.heroText}>
              Your camera, microphone, focus state, suspicious shortcuts, and movement signals
              are all tracked during the exam and summarized professionally in the final report.
            </p>
          </div>

          <div style={styles.heroPanel}>
            <div style={styles.heroMetric}>
              <span>Camera</span>
              <strong>{telemetry.cameraReady ? "Ready" : "Standby"}</strong>
            </div>
            <div style={styles.heroMetric}>
              <span>Mic</span>
              <strong>{telemetry.microphoneReady ? "Ready" : "Standby"}</strong>
            </div>
            <div style={styles.heroMetric}>
              <span>Alerts tracked</span>
              <strong>17 signals</strong>
            </div>
          </div>
        </div>

        {resumeNotice && <div style={styles.resumeNotice}>{resumeNotice}</div>}

        {loadingExams && <div style={styles.loaderBox}>Loading exams...</div>}

        {!loadingExams && errorMessage && <div style={styles.errorBox}>{errorMessage}</div>}

        {!loadingExams && !errorMessage && exams.length === 0 && (
          <div style={styles.emptyBox}>No live or scheduled exams available right now.</div>
        )}

        <div style={styles.examGrid}>
          {exams.map((exam) => (
            <div key={exam._id} style={styles.examCard}>
              <div style={styles.examCardTop}>
                <div>
                  <div style={styles.examStatus(exam.status)}>{exam.status}</div>
                  <h3 style={styles.examTitle}>{exam.title}</h3>
                  <p style={styles.examCourse}>{exam.course}</p>
                </div>
                <div style={styles.examDuration}>{exam.duration} min</div>
              </div>

              <div style={styles.examMetaGrid}>
                <div>
                  <span style={styles.metaLabel}>Start</span>
                  <strong>{exam.startTime ? new Date(exam.startTime).toLocaleString() : "Any time"}</strong>
                </div>
                <div>
                  <span style={styles.metaLabel}>Exam Key</span>
                  <strong>{exam.examKey || "Not required"}</strong>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <span style={styles.metaLabel}>Syllabus</span>
                  <strong>{exam.syllabus || "Teacher will update the outline soon."}</strong>
                </div>
              </div>

              <button
                onClick={() => startExam(exam)}
                style={{
                  ...styles.primaryButton,
                  opacity: exam.canStart ? 1 : 0.55,
                  cursor: exam.canStart ? "pointer" : "not-allowed",
                }}
                disabled={!exam.canStart}
              >
                {exam.canStart ? "Start Secure Exam" : "Waiting For Teacher"}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loadingQuestions && questions.length === 0) {
    return <div style={styles.loaderBox}>Loading questions...</div>;
  }

  if (errorMessage && questions.length === 0) {
    return (
      <div style={styles.centeredState}>
        <div style={styles.stateCard}>
          <div style={styles.errorBox}>{errorMessage}</div>
          <button onClick={resetExamState} style={styles.secondaryButton}>
            Back To Exams
          </button>
        </div>
      </div>
    );
  }

  if (!loadingQuestions && questions.length === 0) {
    return (
      <div style={styles.centeredState}>
        <div style={styles.stateCard}>
          <div style={{ marginBottom: "18px", color: "#475569" }}>
            Teacher MCQs add kar raha hai. Yeh page auto-refresh hota rahega.
          </div>
          <button onClick={() => loadQuestions(selectedExam._id, true)} style={styles.primaryButton}>
            Refresh Now
          </button>
          <button onClick={resetExamState} style={{ ...styles.secondaryButton, marginTop: "12px" }}>
            Back To Exams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div
        style={{
          ...styles.headerCard,
          padding: isPhone ? "20px" : "28px",
          gap: isPhone ? "14px" : "18px",
        }}
      >
        <div>
          <div style={styles.heroKicker}>Live assessment mode</div>
          <h2 style={{ margin: "6px 0 8px 0", fontSize: "clamp(28px, 4vw, 42px)" }}>
            {selectedExam.title}
          </h2>
          <div style={{ color: "#64748b" }}>
            Session ID <strong>{sessionIdRef.current}</strong> | Exam Key{" "}
            <strong>{selectedExam.examKey || "Open"}</strong>
          </div>
        </div>

        <div
          style={{
            ...styles.headerMetrics,
            gridTemplateColumns: isPhone
              ? "1fr"
              : viewportWidth < 920
              ? "repeat(2, minmax(140px, 1fr))"
              : "repeat(3, minmax(140px, 1fr))",
          }}
        >
          <div style={styles.metricCard}>
            <span>Answered</span>
            <strong>{answeredCount}</strong>
          </div>
          <div style={styles.metricCard}>
            <span>Remaining</span>
            <strong>{remainingCount}</strong>
          </div>
          <div style={{ ...styles.metricCard, minWidth: isPhone ? "auto" : "270px" }}>
            <Timer duration={(selectedExam?.duration || 5) * 60} onTimeUp={handleSubmit} />
          </div>
        </div>
      </div>

      <div
        style={{
          ...styles.examLayout,
          gridTemplateColumns: isCompactLayout
            ? "1fr"
            : "minmax(0, 1.5fr) minmax(360px, 420px)",
        }}
      >
        <div style={{ ...styles.questionCard, padding: isPhone ? "18px" : "28px" }}>
          <div
            style={{
              ...styles.questionHeader,
              flexDirection: isPhone ? "column" : "row",
              alignItems: isPhone ? "stretch" : "center",
            }}
          >
            <div>
              <div style={styles.questionBadge}>
                Question {currentIdx + 1} of {questions.length}
              </div>
              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressBar,
                    width: `${((currentIdx + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                ...styles.integrityMini,
                minWidth: isPhone ? "100%" : "160px",
              }}
            >
              <span>Suspicious Activity</span>
              <strong>{suspiciousScorePreview}%</strong>
            </div>
          </div>

          <h3 style={styles.questionText}>{currentQuestionText}</h3>

          <div style={styles.optionGrid}>
            {currentOptions.map((option, index) => {
              const checked = answers[currentIdx] === option;

              return (
                <label
                  key={`${option}-${index}`}
                  style={{
                    ...styles.optionCard,
                    borderColor: checked ? "#2563eb" : "rgba(148, 163, 184, 0.24)",
                    background: checked
                      ? "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(6,182,212,0.08))"
                      : "#fff",
                  }}
                >
                  <input
                    type="radio"
                    name={`question-${currentIdx}`}
                    checked={checked}
                    onChange={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [currentIdx]: option,
                      }))
                    }
                    style={{ width: "18px", height: "18px" }}
                  />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>

          <div style={styles.navigationRow}>
            <button
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((prev) => prev - 1)}
              style={{
                ...styles.secondaryButton,
                flex: isPhone ? "1 1 100%" : "0 0 auto",
                opacity: currentIdx === 0 ? 0.45 : 1,
                cursor: currentIdx === 0 ? "not-allowed" : "pointer",
              }}
            >
              Back
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIdx((prev) => prev + 1)}
                style={{ ...styles.primaryButton, flex: isPhone ? "1 1 100%" : "0 0 auto" }}
              >
                Save & Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                style={{ ...styles.submitButton, flex: isPhone ? "1 1 100%" : "0 0 auto" }}
              >
                {submitting ? "Submitting..." : "Final Submit"}
              </button>
            )}
          </div>
        </div>

        <aside
          style={{
            ...styles.sidebar,
            order: isPhone ? -1 : 0,
          }}
        >
          <div
            style={{
              ...styles.sidebarCard,
              padding: isPhone ? "16px" : "22px",
              position: isCompactLayout ? "relative" : "sticky",
              top: isCompactLayout ? "auto" : "106px",
            }}
          >
            <div style={styles.monitorHeader}>
              <div>
                <div style={styles.monitorKicker}>AI monitoring console</div>
                <h4 style={{ ...styles.sidebarTitle, marginBottom: "6px" }}>Camera + live alerts</h4>
                <div style={styles.monitorCaption}>
                  Face lock, posture, audio spikes, and detection guidance stay grouped in one place.
                </div>
              </div>

              <div style={styles.voiceBadge}>Voice guide on</div>
            </div>

            <Proctoring
              addWarning={addWarning}
              onTelemetryChange={(payload) =>
                setTelemetry((prev) => ({
                  ...prev,
                  ...payload,
                }))
              }
              compact={isPhone}
            />

            <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
              <div style={styles.inlineSectionTitle}>Live alerts</div>

              {showWarning ? (
                <WarningModal
                  message={warningMessage}
                  severity={warningSeverity}
                  count={warningDisplayCount}
                  compact={isPhone}
                  inline
                />
              ) : (
                <div style={styles.alertPlaceholder}>
                  No active alert. If your face, posture, or focus drifts, the guidance will appear
                  here and speak automatically.
                </div>
              )}
            </div>
          </div>

          <div style={{ ...styles.sidebarCard, padding: isPhone ? "16px" : "22px" }}>
            <h4 style={styles.sidebarTitle}>Readiness Signals</h4>
            <div
              style={{
                ...styles.signalList,
                gridTemplateColumns: "1fr",
              }}
            >
              <SignalRow
                label="Camera"
                value={telemetry.cameraReady ? "Connected" : "Checking permissions"}
                good={telemetry.cameraReady}
                compact={isPhone}
              />
              <SignalRow
                label="Microphone"
                value={telemetry.microphoneReady ? "Connected" : "Checking permissions"}
                good={telemetry.microphoneReady}
                compact={isPhone}
              />
              <SignalRow
                label="Face lock"
                value={telemetry.faceStatus || (telemetry.faceVisible ? "Visible" : "Scanning")}
                good={telemetry.faceVisible && !telemetry.multipleFaces}
                compact={isPhone}
              />
              <SignalRow
                label="Framing"
                value={
                  telemetry.framingStatus || "Center your face inside the camera frame."
                }
                good={telemetry.faceVisible}
                compact={isPhone}
              />
              <SignalRow
                label="Room audio"
                value={`${telemetry.audioLevel || 0}% | ${
                  telemetry.audioStatus || "Calibrating room"
                }`}
                good={(telemetry.audioLevel || 0) < 65}
                compact={isPhone}
              />
              <SignalRow
                label="Multi-face"
                value={telemetry.multipleFaces ? "Detected" : "Single candidate"}
                good={!telemetry.multipleFaces}
                compact={isPhone}
              />
            </div>
          </div>

          <div style={{ ...styles.sidebarCard, padding: isPhone ? "16px" : "22px" }}>
            <h4 style={styles.sidebarTitle}>Integrity Snapshot</h4>
            <div
              style={{
                ...styles.signalList,
                gridTemplateColumns: viewportWidth < 520 ? "1fr" : isPhone ? "1fr 1fr" : "1fr",
              }}
            >
              <SignalRow label="Total Alerts" value={warningCounts.total} compact={isPhone} />
              <SignalRow label="Eye Tracking" value={warningCounts.eyeWarnings} compact={isPhone} />
              <SignalRow label="Head Movement" value={warningCounts.headWarnings} compact={isPhone} />
              <SignalRow label="Audio" value={warningCounts.soundWarnings} compact={isPhone} />
              <SignalRow label="Tab / Visibility" value={warningCounts.tabWarnings + warningCounts.visibilityWarnings} compact={isPhone} />
              <SignalRow label="Clipboard" value={warningCounts.copyWarnings + warningCounts.pasteWarnings + warningCounts.cutWarnings} compact={isPhone} />
              <SignalRow label="Screenshot" value={warningCounts.screenshotWarnings} compact={isPhone} />
              <SignalRow label="Focus / Share" value={warningCounts.focusWarnings + warningCounts.screenShareWarnings} compact={isPhone} />
            </div>
          </div>

          <div style={{ ...styles.sidebarCard, padding: isPhone ? "16px" : "22px" }}>
            <h4 style={styles.sidebarTitle}>Recent Detections</h4>
            <div style={{ display: "grid", gap: "10px" }}>
              {activityLog.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: "14px" }}>No suspicious action recorded yet.</div>
              ) : (
                activityLog.slice(0, 5).map((event, index) => (
                  <div key={`${event.type}-${index}`} style={styles.eventCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                      <strong style={{ textTransform: "capitalize", color: "#0f172a" }}>{event.type}</strong>
                      <span style={styles.severityBadge(event.severity)}>{event.severity}</span>
                    </div>
                    <div style={{ color: "#475569", marginTop: "8px", fontSize: "13px", lineHeight: 1.5 }}>
                      {event.message}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "8px" }}>
                      Count {event.count} | {new Date(event.occurredAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const SignalRow = ({ label, value, good, compact = false }) => (
  <div
    style={{
      ...styles.signalRow,
      gap: compact ? "6px" : "8px",
    }}
  >
    <span style={{ color: "#64748b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
      {label}
    </span>
    <strong
      style={{
        color: good === false ? "#b91c1c" : good === true ? "#166534" : "#0f172a",
        fontSize: compact ? "14px" : "15px",
        lineHeight: 1.45,
      }}
    >
      {value}
    </strong>
  </div>
);

const styles = {
  page: {
    minHeight: "calc(100vh - 104px)",
    padding: "26px clamp(16px, 3vw, 34px) 40px",
    background:
      "radial-gradient(circle at top right, rgba(37,99,235,0.10), transparent 28%), linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "22px",
    padding: "32px",
    borderRadius: "32px",
    background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 62%, #06b6d4 100%)",
    color: "#fff",
    boxShadow: "0 28px 60px rgba(37, 99, 235, 0.22)",
    marginBottom: "24px",
  },
  heroKicker: {
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: "rgba(255,255,255,0.72)",
  },
  heroTitle: {
    margin: "12px 0 10px 0",
    fontSize: "clamp(32px, 5vw, 52px)",
    lineHeight: 1.02,
  },
  heroText: {
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.75,
    color: "rgba(255,255,255,0.82)",
    maxWidth: "760px",
  },
  heroPanel: {
    display: "grid",
    gap: "14px",
    alignContent: "start",
  },
  heroMetric: {
    padding: "18px 20px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  resumeNotice: {
    padding: "16px 18px",
    borderRadius: "18px",
    background: "#fff7ed",
    border: "1px solid #fdba74",
    color: "#9a3412",
    marginBottom: "22px",
  },
  loaderBox: {
    minHeight: "420px",
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    color: "#334155",
    fontSize: "20px",
    fontWeight: 700,
  },
  errorBox: {
    padding: "14px 16px",
    borderRadius: "16px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
  },
  emptyBox: {
    padding: "20px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.9)",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.06)",
    color: "#475569",
    marginBottom: "22px",
  },
  examGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
  },
  examCard: {
    padding: "24px",
    borderRadius: "28px",
    background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)",
  },
  examCardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
    marginBottom: "18px",
  },
  examStatus: (status) => ({
    display: "inline-flex",
    padding: "7px 12px",
    borderRadius: "999px",
    background:
      status === "live"
        ? "#dcfce7"
        : status === "scheduled"
        ? "#dbeafe"
        : "#e2e8f0",
    color:
      status === "live"
        ? "#166534"
        : status === "scheduled"
        ? "#1d4ed8"
        : "#475569",
    textTransform: "capitalize",
    fontSize: "12px",
    fontWeight: 700,
    marginBottom: "16px",
  }),
  examTitle: {
    margin: 0,
    fontSize: "26px",
    color: "#0f172a",
  },
  examCourse: {
    margin: "6px 0 0 0",
    color: "#64748b",
  },
  examDuration: {
    padding: "10px 12px",
    borderRadius: "16px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: 800,
  },
  examMetaGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "20px",
  },
  metaLabel: {
    display: "block",
    fontSize: "12px",
    color: "#94a3b8",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  primaryButton: {
    width: "100%",
    border: "none",
    padding: "15px 18px",
    borderRadius: "18px",
    background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
    color: "#fff",
    fontWeight: 800,
    boxShadow: "0 16px 32px rgba(37, 99, 235, 0.24)",
  },
  secondaryButton: {
    border: "1px solid rgba(148,163,184,0.26)",
    padding: "14px 18px",
    borderRadius: "18px",
    background: "#fff",
    color: "#334155",
    fontWeight: 700,
  },
  submitButton: {
    border: "none",
    padding: "14px 22px",
    borderRadius: "18px",
    background: "linear-gradient(135deg, #16a34a, #22c55e)",
    color: "#fff",
    fontWeight: 800,
    boxShadow: "0 18px 34px rgba(34, 197, 94, 0.2)",
  },
  centeredState: {
    minHeight: "calc(100vh - 104px)",
    display: "grid",
    placeItems: "center",
    padding: "18px",
  },
  stateCard: {
    width: "min(520px, 100%)",
    padding: "30px",
    borderRadius: "24px",
    background: "#fff",
    boxShadow: "0 22px 44px rgba(15, 23, 42, 0.08)",
    textAlign: "center",
  },
  headerCard: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
    padding: "28px",
    borderRadius: "30px",
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 22px 48px rgba(15, 23, 42, 0.08)",
    marginBottom: "22px",
  },
  headerMetrics: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
    alignItems: "stretch",
  },
  metricCard: {
    padding: "18px",
    borderRadius: "22px",
    background: "#f8fbff",
    border: "1px solid rgba(148,163,184,0.16)",
    display: "grid",
    gap: "10px",
  },
  examLayout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "24px",
    alignItems: "start",
  },
  questionCard: {
    padding: "28px",
    borderRadius: "30px",
    background: "rgba(255,255,255,0.96)",
    boxShadow: "0 24px 46px rgba(15, 23, 42, 0.08)",
  },
  questionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "26px",
  },
  questionBadge: {
    display: "inline-block",
    padding: "9px 14px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: 800,
    fontSize: "13px",
    marginBottom: "12px",
  },
  progressTrack: {
    width: "100%",
    height: "8px",
    borderRadius: "999px",
    background: "#e2e8f0",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #2563eb, #06b6d4)",
  },
  integrityMini: {
    minWidth: "160px",
    padding: "16px",
    borderRadius: "22px",
    background: "#fff7ed",
    color: "#9a3412",
    textAlign: "center",
    display: "grid",
    gap: "6px",
  },
  questionText: {
    margin: "0 0 22px 0",
    fontSize: "clamp(24px, 3vw, 34px)",
    color: "#0f172a",
    lineHeight: 1.2,
  },
  optionGrid: {
    display: "grid",
    gap: "14px",
  },
  optionCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "18px 20px",
    borderRadius: "20px",
    border: "1px solid rgba(148,163,184,0.2)",
    transition: "all 0.2s ease",
  },
  navigationRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    marginTop: "28px",
    flexWrap: "wrap",
  },
  sidebar: {
    display: "grid",
    gap: "18px",
  },
  sidebarCard: {
    padding: "22px",
    borderRadius: "26px",
    background: "rgba(255,255,255,0.96)",
    border: "1px solid rgba(148,163,184,0.14)",
    boxShadow: "0 22px 44px rgba(15, 23, 42, 0.08)",
  },
  sidebarTitle: {
    margin: "0 0 16px 0",
    fontSize: "20px",
    color: "#0f172a",
  },
  monitorHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "14px",
    flexWrap: "wrap",
  },
  monitorKicker: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: "#2563eb",
    fontWeight: 800,
    marginBottom: "6px",
  },
  monitorCaption: {
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.55,
  },
  voiceBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: 800,
    fontSize: "12px",
    whiteSpace: "nowrap",
  },
  inlineSectionTitle: {
    fontSize: "12px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "#2563eb",
  },
  alertPlaceholder: {
    padding: "14px 16px",
    borderRadius: "18px",
    background: "#f8fbff",
    border: "1px dashed rgba(37, 99, 235, 0.24)",
    color: "#475569",
    lineHeight: 1.6,
    fontSize: "14px",
  },
  signalList: {
    display: "grid",
    gap: "10px",
  },
  signalRow: {
    display: "grid",
    padding: "14px 15px",
    borderRadius: "18px",
    background: "#f8fbff",
    border: "1px solid rgba(148,163,184,0.12)",
  },
  eventCard: {
    padding: "14px",
    borderRadius: "18px",
    background: "#f8fafc",
    border: "1px solid rgba(148,163,184,0.14)",
  },
  severityBadge: (severity) => ({
    padding: "5px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    textTransform: "uppercase",
    fontWeight: 800,
    background:
      severity === "critical"
        ? "#fee2e2"
        : severity === "high"
        ? "#ffedd5"
        : "#dbeafe",
    color:
      severity === "critical"
        ? "#b91c1c"
        : severity === "high"
        ? "#c2410c"
        : "#1d4ed8",
  }),
};

export default Exam;
