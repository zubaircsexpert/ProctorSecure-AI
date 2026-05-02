import { useEffect, useMemo, useState } from "react";
import API from "../../services/api";

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const FILE_BASE_URL = `${API.defaults.baseURL}/uploads`;

const computeTrustFactor = (score) => {
  if (score >= 65) return "Critical";
  if (score >= 40) return "Suspicious";
  if (score >= 20) return "Monitor";
  return "Reliable";
};

const formatDateTime = (value) => {
  if (!value) return "Recent attempt";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recent attempt" : date.toLocaleString();
};

const buildDerived = (result) => {
  const total = Number(result?.total || 0);
  const score = Number(result?.score || 0);
  const answeredCount =
    result?.answeredCount !== undefined ? Number(result.answeredCount || 0) : total;
  const incorrectAnswers =
    result?.incorrectAnswers !== undefined
      ? Number(result.incorrectAnswers || 0)
      : Math.max(answeredCount - score, 0);
  const unansweredAnswers =
    result?.unansweredAnswers !== undefined
      ? Number(result.unansweredAnswers || 0)
      : Math.max(total - answeredCount, 0);
  const academicAccuracy =
    result?.academicAccuracy !== undefined
      ? Number(result.academicAccuracy || 0)
      : Number(result?.percentage || 0);
  const suspiciousScore =
    result?.suspiciousScore !== undefined
      ? Number(result.suspiciousScore || 0)
      : Number(result?.cheatingPercent || 0);
  const integrityScore =
    result?.integrityScore !== undefined ? Number(result.integrityScore || 0) : clamp(100 - suspiciousScore);
  const intelligenceScore =
    result?.intelligenceScore !== undefined
      ? Number(result.intelligenceScore || 0)
      : clamp(academicAccuracy * 0.74 + integrityScore * 0.26);

  return {
    total,
    score,
    answeredCount,
    incorrectAnswers,
    unansweredAnswers,
    academicAccuracy,
    suspiciousScore,
    integrityScore,
    intelligenceScore,
    trustFactor: result?.trustFactor || computeTrustFactor(suspiciousScore),
    warnings: Number(result?.warnings || 0),
    activityLog: Array.isArray(result?.activityLog) ? result.activityLog : [],
    answerSheet: Array.isArray(result?.answerSheet) ? result.answerSheet : [],
  };
};

const normalizeResults = (items) =>
  items
    .filter(Boolean)
    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));

const Results = () => {
  const [results, setResults] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [activeType, setActiveType] = useState("exam");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getResults = async () => {
      try {
        const collected = [];

        try {
          const localExam = localStorage.getItem("examResult") || localStorage.getItem("/api/examResult");
          if (localExam) collected.push(JSON.parse(localExam));
        } catch (err) {
          console.error("Local exam result parse failed:", err);
        }

        try {
          const localQuiz = localStorage.getItem("quizResult");
          if (localQuiz) collected.push(JSON.parse(localQuiz));
        } catch (err) {
          console.error("Local quiz result parse failed:", err);
        }

        try {
          const response = await API.get("/api/results/my");
          if (Array.isArray(response.data)) collected.push(...response.data);
        } catch (err) {
          console.error("Primary result fetch failed:", err);
        }

        const unique = new Map();
        normalizeResults(collected).forEach((result, index) => {
          const key = result._id || `${result.examId || "local"}-${result.createdAt || index}`;
          unique.set(key, result);
        });

        const nextResults = Array.from(unique.values());
        setResults(nextResults);
        setSelectedId((prev) => prev || nextResults[0]?._id || "0");
      } finally {
        setLoading(false);
      }
    };

    getResults();
  }, []);

  const grouped = useMemo(
    () => ({
      exam: results.filter((result) => (result.assessmentType || "exam") !== "quiz"),
      quiz: results.filter((result) => (result.assessmentType || "exam") === "quiz"),
    }),
    [results]
  );

  const visibleResults = grouped[activeType] || [];
  const selectedResult =
    results.find((result, index) => (result._id || String(index)) === selectedId) ||
    visibleResults[0] ||
    results[0] ||
    null;
  const derived = selectedResult ? buildDerived(selectedResult) : null;
  const isQuiz = (selectedResult?.assessmentType || "exam") === "quiz";
  const isManualReview = selectedResult?.manualReviewRequired || selectedResult?.status === "UNDER_REVIEW";

  useEffect(() => {
    if (visibleResults.length) {
      const stillVisible = visibleResults.some(
        (result, index) => (result._id || String(index)) === selectedId
      );
      if (!stillVisible) {
        setSelectedId(visibleResults[0]._id || "0");
      }
    }
  }, [selectedId, visibleResults]);

  if (loading) {
    return (
      <div style={styles.loaderState}>
        <div style={styles.loaderOrb} />
        <h2 style={{ margin: "18px 0 8px" }}>Preparing your result center</h2>
        <p style={{ margin: 0, color: "#64748b" }}>Loading AI exam reports and quiz attempts.</p>
      </div>
    );
  }

  if (!selectedResult || !derived) {
    return (
      <div style={styles.loaderState}>
        <h2 style={{ margin: 0 }}>No result found</h2>
        <p style={{ margin: "12px 0 0", color: "#64748b" }}>
          Attempt an AI exam or quiz first. Your reports will appear here.
        </p>
      </div>
    );
  }

  const detectionRows = [
    ["Eye tracking", selectedResult.eyeWarnings || 0],
    ["Head movement", selectedResult.headWarnings || 0],
    ["Audio / speech", selectedResult.soundWarnings || 0],
    ["Tab / visibility", (selectedResult.tabWarnings || 0) + (selectedResult.visibilityWarnings || 0)],
    ["Fullscreen exits", selectedResult.fullscreenWarnings || 0],
    [
      "Copy / paste / cut",
      (selectedResult.copyWarnings || 0) +
        (selectedResult.pasteWarnings || 0) +
        (selectedResult.cutWarnings || 0),
    ],
    [
      "Focus / share overlays",
      (selectedResult.focusWarnings || 0) + (selectedResult.screenShareWarnings || 0),
    ],
    [
      "Face missing / multi-face",
      (selectedResult.faceMissingWarnings || 0) + (selectedResult.multipleFaceWarnings || 0),
    ],
  ];

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <div style={styles.heroKicker}>Student Result Center</div>
          <h1 style={styles.heroTitle}>AI Exam and Quiz Progress Reports</h1>
          <p style={styles.heroText}>
            Every submitted attempt is separated by type, date, score, answer review, and integrity analytics.
          </p>
        </div>

        <div style={styles.heroStatusCard}>
          <span style={styles.heroStatusLabel}>{isQuiz ? "Quiz Score" : "Trust Factor"}</span>
          <strong style={styles.heroStatusValue(derived.trustFactor)}>
            {isQuiz ? `${derived.score}/${derived.total}` : derived.trustFactor}
          </strong>
          <span style={{ color: "rgba(255,255,255,0.78)", marginTop: "10px" }}>
            {formatDateTime(selectedResult.createdAt)}
          </span>
        </div>
      </section>

      <div style={styles.tabRow}>
        <button type="button" style={styles.tabButton(activeType === "exam")} onClick={() => setActiveType("exam")}>
          AI Exams <strong>{grouped.exam.length}</strong>
        </button>
        <button type="button" style={styles.tabButton(activeType === "quiz")} onClick={() => setActiveType("quiz")}>
          Quizzes <strong>{grouped.quiz.length}</strong>
        </button>
      </div>

      <div style={styles.reportLayout}>
        <aside style={styles.attemptPanel}>
          <div style={styles.panelKicker}>{activeType === "quiz" ? "Quiz attempts" : "AI exam attempts"}</div>
          <h2 style={styles.panelTitle}>Attempt History</h2>

          {visibleResults.length === 0 ? (
            <div style={styles.emptyAudit}>No {activeType === "quiz" ? "quiz" : "AI exam"} result yet.</div>
          ) : (
            <div style={{ display: "grid", gap: "10px", marginTop: "16px" }}>
              {visibleResults.map((result, index) => {
                const key = result._id || String(index);
                const itemDerived = buildDerived(result);
                const active = (selectedResult._id || "0") === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedId(key)}
                    style={styles.attemptCard(active)}
                  >
                    <span style={styles.attemptTitle}>{result.testName || (activeType === "quiz" ? "Quiz" : "AI Exam")}</span>
                    <span style={styles.attemptMeta}>{formatDateTime(result.createdAt)}</span>
                    <span style={styles.attemptScore}>
                      {itemDerived.score}/{itemDerived.total} | {itemDerived.academicAccuracy}%
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <main style={styles.reportPanel}>
          <div style={styles.reportHeader}>
            <div>
              <div style={styles.panelKicker}>{isQuiz ? "Quiz report" : "AI exam report"}</div>
              <h2 style={styles.reportTitle}>
                {selectedResult.testName || (isQuiz ? "Quiz" : "AI Exam")} |{" "}
                {selectedResult.status || (derived.academicAccuracy >= 50 ? "PASSED" : "FAILED")}
              </h2>
              <p style={styles.reportText}>
                Candidate <strong>{selectedResult.studentName || "Verified Student"}</strong> attempted this on{" "}
                <strong>{formatDateTime(selectedResult.createdAt)}</strong>.
              </p>
            </div>
            <button type="button" onClick={() => window.print()} style={styles.printButton}>
              Download PDF Report
            </button>
          </div>

          <div style={styles.cardGrid}>
            <ScoreCard tone="blue" label="Score" value={`${derived.score}/${derived.total}`} detail={`Accuracy ${derived.academicAccuracy}%`} />
            <ScoreCard label="Answered" value={derived.answeredCount} detail={`Unanswered ${derived.unansweredAnswers}`} />
            <ScoreCard label={isQuiz ? "Percentage" : "Intelligence"} value={`${isQuiz ? derived.academicAccuracy : derived.intelligenceScore}%`} detail={isQuiz ? "Simple quiz score" : "Accuracy + integrity"} />
            <ScoreCard tone="amber" label="Integrity" value={`${derived.suspiciousScore}%`} detail={`${derived.warnings} alerts`} />
          </div>

          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <div style={styles.panelKicker}>{isQuiz ? "Quiz answer review" : "Answer review"}</div>
                <h3 style={styles.panelTitle}>Selected answers and correct answers</h3>
              </div>
            </div>

            {derived.answerSheet.length === 0 ? (
              <div style={styles.emptyAudit}>Answer-level detail was not stored for this older attempt.</div>
            ) : (
              <div style={styles.answerGrid}>
                {derived.answerSheet.map((item, index) => (
                  <div key={`${item.questionText}-${index}`} style={styles.answerRow(item.isCorrect)}>
                    <div>
                      <strong style={{ color: "#0f172a" }}>Q{index + 1}. {item.questionText}</strong>
                      <div style={styles.answerMeta}>Your answer: {item.selectedAnswer || "Not answered"}</div>
                      <div style={styles.answerMeta}>Correct answer: {item.correctAnswer || "N/A"}</div>
                    </div>
                    <span style={styles.answerBadge(item.isCorrect)}>
                      {item.isCorrect ? "Correct" : "Wrong"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {isManualReview ? (
            <section style={styles.panel}>
              <div style={styles.panelKicker}>Written submission</div>
              <h3 style={styles.panelTitle}>Answer sent for teacher review</h3>
              <div style={styles.emptyAudit}>{selectedResult.writtenAnswer || "Typed answer was not provided."}</div>
              {selectedResult.writtenFileUrl ? (
                <a
                  href={`${FILE_BASE_URL}/${String(selectedResult.writtenFileUrl).replace(/^\/+/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.linkChip}
                >
                  View Uploaded Answer Sheet
                </a>
              ) : null}
            </section>
          ) : null}

          {!isQuiz ? (
            <div style={styles.bottomGrid}>
              <section style={styles.panel}>
                <div style={styles.panelHeader}>
                  <div>
                    <div style={styles.panelKicker}>Detection analysis</div>
                    <h3 style={styles.panelTitle}>AI proctoring breakdown</h3>
                  </div>
                  <div style={styles.panelBadge}>{derived.trustFactor}</div>
                </div>
                <div style={styles.detectionGrid}>
                  {detectionRows.map(([label, value]) => (
                    <div key={label} style={styles.detectionCard}>
                      <span>{label}</span>
                      <strong style={{ color: Number(value) > 0 ? "#dc2626" : "#0f172a" }}>{value}</strong>
                    </div>
                  ))}
                </div>
              </section>

              <section style={styles.panel}>
                <div style={styles.panelKicker}>Live audit trail</div>
                <h3 style={styles.panelTitle}>Recent suspicious detections</h3>
                {derived.activityLog.length === 0 ? (
                  <div style={styles.emptyAudit}>No suspicious event detail was saved for this attempt.</div>
                ) : (
                  <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
                    {derived.activityLog.slice(0, 8).map((item, index) => (
                      <div key={`${item.type}-${index}`} style={styles.auditRow}>
                        <div>
                          <strong style={{ color: "#0f172a", textTransform: "capitalize" }}>{item.type}</strong>
                          <div style={{ color: "#475569", marginTop: "6px" }}>{item.message}</div>
                        </div>
                        <span style={styles.auditCount}>x{item.count || 1}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          ) : null}
        </main>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media print {
          nav, .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
};

const ScoreCard = ({ label, value, detail, tone = "light" }) => (
  <section style={tone === "blue" ? styles.cardBlue : tone === "amber" ? styles.cardAlert : styles.cardLight}>
    <div style={tone === "blue" ? styles.cardLabel : tone === "amber" ? styles.cardLabelAmber : styles.cardLabelRed}>
      {label}
    </div>
    <div style={tone === "blue" ? styles.cardBigNumber : styles.cardDarkNumber}>{value}</div>
    <div style={tone === "blue" ? styles.cardSubText : styles.cardSubTextDark}>{detail}</div>
  </section>
);

const styles = {
  page: {
    padding: "26px clamp(16px, 3vw, 34px) 40px",
    minHeight: "calc(100vh - 104px)",
    background:
      "radial-gradient(circle at top right, rgba(37,99,235,0.08), transparent 30%), linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)",
  },
  loaderState: {
    minHeight: "calc(100vh - 104px)",
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    padding: "24px",
  },
  loaderOrb: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "conic-gradient(from 180deg, #0f766e, #2563eb, #0f766e)",
    animation: "spin 1.1s linear infinite",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.5fr) minmax(260px, 0.5fr)",
    gap: "20px",
    padding: "32px",
    borderRadius: "30px",
    background: "linear-gradient(135deg, #0f172a 0%, #123c6b 52%, #0f766e 100%)",
    color: "#fff",
    boxShadow: "0 28px 60px rgba(15, 23, 42, 0.18)",
    marginBottom: "20px",
  },
  heroKicker: {
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    fontSize: "12px",
    color: "rgba(255,255,255,0.72)",
    fontWeight: 800,
  },
  heroTitle: {
    margin: "10px 0 12px",
    fontSize: "clamp(34px, 5vw, 58px)",
    lineHeight: 1.02,
  },
  heroText: {
    margin: 0,
    maxWidth: "780px",
    color: "rgba(255,255,255,0.84)",
    lineHeight: 1.7,
  },
  heroStatusCard: {
    padding: "24px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.1)",
    display: "grid",
    alignContent: "center",
  },
  heroStatusLabel: {
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    fontSize: "12px",
    color: "rgba(255,255,255,0.74)",
  },
  heroStatusValue: (label) => ({
    marginTop: "12px",
    fontSize: "34px",
    fontWeight: 900,
    color: label === "Reliable" ? "#bbf7d0" : label === "Monitor" ? "#fde68a" : "#fecaca",
  }),
  tabRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  tabButton: (active) => ({
    border: active ? "1px solid #0f766e" : "1px solid rgba(148,163,184,0.22)",
    background: active ? "linear-gradient(135deg, rgba(15,118,110,0.12), rgba(37,99,235,0.08))" : "#fff",
    color: "#0f172a",
    borderRadius: "16px",
    padding: "13px 16px",
    fontWeight: 900,
    cursor: "pointer",
    display: "inline-flex",
    gap: "10px",
    alignItems: "center",
  }),
  reportLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(260px, 330px) minmax(0, 1fr)",
    gap: "18px",
    alignItems: "start",
  },
  attemptPanel: {
    padding: "22px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.96)",
    border: "1px solid rgba(148,163,184,0.14)",
    boxShadow: "0 20px 44px rgba(15, 23, 42, 0.08)",
  },
  attemptCard: (active) => ({
    width: "100%",
    textAlign: "left",
    border: active ? "1px solid #2563eb" : "1px solid rgba(148,163,184,0.14)",
    background: active ? "#eff6ff" : "#f8fafc",
    borderRadius: "18px",
    padding: "14px 15px",
    cursor: "pointer",
    display: "grid",
    gap: "6px",
  }),
  attemptTitle: {
    color: "#0f172a",
    fontWeight: 900,
    fontSize: "15px",
  },
  attemptMeta: {
    color: "#64748b",
    fontSize: "12px",
  },
  attemptScore: {
    color: "#1d4ed8",
    fontWeight: 800,
    fontSize: "13px",
  },
  reportPanel: {
    display: "grid",
    gap: "18px",
  },
  reportHeader: {
    padding: "24px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.96)",
    border: "1px solid rgba(148,163,184,0.14)",
    boxShadow: "0 20px 44px rgba(15, 23, 42, 0.08)",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  reportTitle: {
    margin: "6px 0 8px",
    color: "#0f172a",
    fontSize: "28px",
    lineHeight: 1.15,
  },
  reportText: {
    margin: 0,
    color: "#475569",
    lineHeight: 1.65,
  },
  printButton: {
    border: "none",
    borderRadius: "16px",
    padding: "14px 18px",
    background: "linear-gradient(135deg, #0f172a, #1d4ed8)",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 18px 34px rgba(29, 78, 216, 0.18)",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "14px",
  },
  cardBlue: {
    padding: "22px",
    borderRadius: "24px",
    background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
    color: "#fff",
    boxShadow: "0 24px 50px rgba(37, 99, 235, 0.18)",
  },
  cardLight: {
    padding: "22px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.96)",
    border: "1px solid rgba(148,163,184,0.14)",
    boxShadow: "0 20px 44px rgba(15, 23, 42, 0.08)",
  },
  cardAlert: {
    padding: "22px",
    borderRadius: "24px",
    background: "linear-gradient(180deg, #fff7ed 0%, #ffffff 100%)",
    border: "1px solid rgba(251, 146, 60, 0.18)",
    boxShadow: "0 20px 44px rgba(15, 23, 42, 0.08)",
  },
  cardLabel: {
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: "12px",
    color: "rgba(255,255,255,0.74)",
  },
  cardLabelRed: {
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: "12px",
    color: "#2563eb",
  },
  cardLabelAmber: {
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: "12px",
    color: "#c2410c",
  },
  cardBigNumber: {
    marginTop: "10px",
    fontSize: "42px",
    fontWeight: 900,
    lineHeight: 1,
  },
  cardDarkNumber: {
    marginTop: "10px",
    fontSize: "40px",
    fontWeight: 900,
    lineHeight: 1,
    color: "#0f172a",
  },
  cardSubText: {
    marginTop: "12px",
    color: "rgba(255,255,255,0.84)",
    lineHeight: 1.6,
  },
  cardSubTextDark: {
    marginTop: "12px",
    color: "#475569",
    lineHeight: 1.6,
  },
  panel: {
    padding: "24px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.96)",
    border: "1px solid rgba(148,163,184,0.12)",
    boxShadow: "0 20px 44px rgba(15, 23, 42, 0.08)",
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "18px",
  },
  panelKicker: {
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: "12px",
    color: "#2563eb",
    fontWeight: 900,
  },
  panelTitle: {
    margin: "6px 0 0",
    fontSize: "24px",
    color: "#0f172a",
    lineHeight: 1.2,
  },
  panelBadge: {
    padding: "10px 14px",
    borderRadius: "999px",
    background: "#fff7ed",
    color: "#c2410c",
    fontWeight: 800,
  },
  answerGrid: {
    display: "grid",
    gap: "12px",
  },
  answerRow: (correct) => ({
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start",
    padding: "16px",
    borderRadius: "18px",
    background: correct ? "#f0fdf4" : "#fff7ed",
    border: correct ? "1px solid #bbf7d0" : "1px solid #fed7aa",
  }),
  answerMeta: {
    color: "#475569",
    lineHeight: 1.55,
    marginTop: "6px",
  },
  answerBadge: (correct) => ({
    padding: "8px 12px",
    borderRadius: "999px",
    background: correct ? "#dcfce7" : "#fee2e2",
    color: correct ? "#166534" : "#b91c1c",
    fontWeight: 900,
    whiteSpace: "nowrap",
  }),
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "18px",
  },
  detectionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "12px",
  },
  detectionCard: {
    padding: "14px 16px",
    borderRadius: "18px",
    background: "#f8fbff",
    border: "1px solid rgba(148,163,184,0.12)",
    display: "grid",
    gap: "10px",
    color: "#64748b",
  },
  emptyAudit: {
    padding: "18px",
    borderRadius: "18px",
    background: "#f8fafc",
    color: "#64748b",
    lineHeight: 1.6,
  },
  auditRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    padding: "16px",
    borderRadius: "18px",
    background: "#f8fafc",
    border: "1px solid rgba(148,163,184,0.12)",
  },
  auditCount: {
    padding: "8px 10px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: 800,
    height: "fit-content",
  },
  linkChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    width: "fit-content",
    marginTop: "14px",
    padding: "10px 14px",
    borderRadius: "999px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: 700,
    textDecoration: "none",
  },
};

export default Results;
