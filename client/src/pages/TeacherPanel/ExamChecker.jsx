import { useEffect, useMemo, useState } from "react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import Tesseract from "tesseract.js";
import API from "../../services/api";

GlobalWorkerOptions.workerSrc = pdfWorker;

const normalizeAnswer = (value) => {
  if (!value) return "";

  const cleaned = String(value).toUpperCase().replace(/[^A-Z]/g, "");

  if (cleaned.startsWith("TRUE") || cleaned === "T") return "TRUE";
  if (cleaned.startsWith("FALSE") || cleaned === "F") return "FALSE";

  const letterMatch = cleaned.match(/[ABCDE]/);
  return letterMatch ? letterMatch[0] : "";
};

const parseAnswerMap = (text) => {
  if (!text) return {};

  const answerMap = {};
  const normalizedText = text.replace(/\r/g, "\n");
  const lines = normalizedText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const linePatterns = [
    /(?:question|ques|q)?\s*(\d{1,3})\s*[-:.)|]?\s*(?:answer|ans)?\s*[:=-]?\s*(?:option\s*)?([A-E]|TRUE|FALSE)\b/i,
    /(\d{1,3})\s+(?:option\s*)?([A-E]|TRUE|FALSE)\b/i,
  ];

  for (const line of lines) {
    for (const pattern of linePatterns) {
      const match = line.match(pattern);

      if (match) {
        const questionNumber = String(Number(match[1]));
        const answer = normalizeAnswer(match[2]);

        if (questionNumber && answer) {
          answerMap[questionNumber] = answer;
          break;
        }
      }
    }
  }

  if (Object.keys(answerMap).length > 0) {
    return answerMap;
  }

  const globalPattern =
    /(?:question|ques|q)?\s*(\d{1,3})\s*[-:.)|]?\s*(?:answer|ans)?\s*[:=-]?\s*(?:option\s*)?([A-E]|TRUE|FALSE)\b/gi;
  let match;

  while ((match = globalPattern.exec(normalizedText)) !== null) {
    const questionNumber = String(Number(match[1]));
    const answer = normalizeAnswer(match[2]);

    if (questionNumber && answer) {
      answerMap[questionNumber] = answer;
    }
  }

  return answerMap;
};

const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsText(file);
  });

const extractTextFromImage = async (file, onProgress) => {
  onProgress?.("Running OCR on image...");
  const { data } = await Tesseract.recognize(file, "eng");
  return data?.text || "";
};

const extractTextFromPdf = async (file, onProgress) => {
  const pdfBytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data: pdfBytes }).promise;
  let combinedText = "";

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    onProgress?.(`Reading PDF page ${pageNumber} of ${pdf.numPages}...`);
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const nativeText = textContent.items.map((item) => item.str).join(" ").trim();

    if (nativeText.replace(/\s+/g, " ").length > 40) {
      combinedText += `${nativeText}\n`;
      continue;
    }

    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    onProgress?.(`Running OCR on scanned PDF page ${pageNumber}...`);
    const { data } = await Tesseract.recognize(canvas, "eng");
    combinedText += `${data?.text || ""}\n`;
  }

  return combinedText;
};

const extractTextFromFile = async (file, onProgress) => {
  if (!file) return "";

  const extension = file.name.split(".").pop()?.toLowerCase() || "";

  if (["txt", "csv", "json", "md"].includes(extension)) {
    onProgress?.(`Reading ${extension.toUpperCase()} file...`);
    return readFileAsText(file);
  }

  if (extension === "pdf") {
    return extractTextFromPdf(file, onProgress);
  }

  if (file.type.startsWith("image/")) {
    return extractTextFromImage(file, onProgress);
  }

  onProgress?.("Trying plain-text extraction...");
  return readFileAsText(file);
};

const buildEvaluation = ({
  examTitle,
  course,
  candidateName,
  marksPerQuestion,
  answerKeyMap,
  studentAnswerMap,
}) => {
  const keyNumbers = Object.keys(answerKeyMap)
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  const results = keyNumbers.map((questionNumber) => {
    const expectedAnswer = answerKeyMap[String(questionNumber)] || "";
    const studentAnswer = studentAnswerMap[String(questionNumber)] || "";
    const isCorrect = Boolean(studentAnswer) && studentAnswer === expectedAnswer;

    return {
      questionNumber,
      expectedAnswer,
      studentAnswer,
      isCorrect,
      confidence: studentAnswer ? 0.92 : 0.28,
    };
  });

  const totalQuestions = results.length;
  const correctAnswers = results.filter((item) => item.isCorrect).length;
  const unansweredAnswers = results.filter((item) => !item.studentAnswer).length;
  const incorrectAnswers = totalQuestions - correctAnswers - unansweredAnswers;
  const parsedQuestions = Object.keys(studentAnswerMap).length;
  const lowConfidenceCount = results.filter((item) => item.confidence < 0.5).length;
  const totalMarks = totalQuestions * marksPerQuestion;
  const marksAwarded = correctAnswers * marksPerQuestion;
  const accuracyPercentage =
    totalQuestions > 0 ? Number(((correctAnswers / totalQuestions) * 100).toFixed(2)) : 0;
  const manualReviewRequired =
    totalQuestions === 0 || parsedQuestions < totalQuestions || unansweredAnswers > 0;

  return {
    examTitle,
    course,
    candidateName,
    processingMode: "hybrid-ocr",
    totalQuestions,
    parsedQuestions,
    correctAnswers,
    incorrectAnswers,
    unansweredAnswers,
    lowConfidenceCount,
    totalMarks,
    marksAwarded,
    accuracyPercentage,
    reviewSummary:
      totalQuestions > 0
        ? `System checked ${correctAnswers} correct, ${incorrectAnswers} incorrect, and ${unansweredAnswers} unanswered responses.`
        : "No readable answer key pattern was detected.",
    manualReviewRequired,
    answerKeyMap,
    studentAnswerMap,
    questionResults: results,
  };
};

const ExamChecker = () => {
  const [formState, setFormState] = useState({
    examTitle: "",
    course: "",
    candidateName: "",
    marksPerQuestion: 1,
  });
  const [answerSheetFile, setAnswerSheetFile] = useState(null);
  const [answerKeyFile, setAnswerKeyFile] = useState(null);
  const [manualAnswerText, setManualAnswerText] = useState("");
  const [manualKeyText, setManualKeyText] = useState("");
  const [statusText, setStatusText] = useState("Upload a scanned sheet and answer key to begin.");
  const [processing, setProcessing] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await API.get("/api/paper-checks");
      setHistory(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Paper check history fetch failed:", err);
      setErrorText("Failed to load saved paper-check history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const summaryPills = useMemo(() => {
    if (!report) return [];

    return [
      { label: "Marks Awarded", value: `${report.marksAwarded} / ${report.totalMarks}` },
      { label: "Correct", value: report.correctAnswers },
      { label: "Incorrect", value: report.incorrectAnswers },
      { label: "Unanswered", value: report.unansweredAnswers },
    ];
  }, [report]);

  const handleAnalyze = async (event) => {
    event.preventDefault();
    setErrorText("");
    setProcessing(true);
    setStatusText("Preparing OCR and text extraction...");

    try {
      if (!formState.examTitle.trim()) {
        throw new Error("Please enter exam title first.");
      }

      if (!answerSheetFile && !manualAnswerText.trim()) {
        throw new Error("Upload the scanned answer sheet or paste detected answer text.");
      }

      if (!answerKeyFile && !manualKeyText.trim()) {
        throw new Error("Upload the answer key file or paste the answer key text.");
      }

      const answerKeyText = manualKeyText.trim()
        ? manualKeyText
        : await extractTextFromFile(answerKeyFile, setStatusText);
      const answerSheetText = manualAnswerText.trim()
        ? manualAnswerText
        : await extractTextFromFile(answerSheetFile, setStatusText);

      setStatusText("Parsing answers and calculating marks...");

      const answerKeyMap = parseAnswerMap(answerKeyText);
      const studentAnswerMap = parseAnswerMap(answerSheetText);

      if (Object.keys(answerKeyMap).length === 0) {
        throw new Error(
          "System could not read the answer key pattern. Use format like 1:A, 2:B, 3:C or paste cleaned key text."
        );
      }

      const nextReport = buildEvaluation({
        examTitle: formState.examTitle.trim(),
        course: formState.course.trim(),
        candidateName: formState.candidateName.trim(),
        marksPerQuestion: Number(formState.marksPerQuestion || 1),
        answerKeyMap,
        studentAnswerMap,
      });

      setReport(nextReport);

      const payload = new FormData();
      payload.append("report", JSON.stringify(nextReport));
      if (answerSheetFile) payload.append("answerSheet", answerSheetFile);
      if (answerKeyFile) payload.append("answerKey", answerKeyFile);

      setStatusText("Saving the checked paper to teacher records...");
      await API.post("/api/paper-checks", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setStatusText("Paper checked and saved successfully.");
      fetchHistory();
    } catch (err) {
      console.error("Paper check failed:", err);
      setErrorText(err.message || "Paper checking failed.");
      setStatusText("Paper checking failed.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this saved paper-check report?");
    if (!confirmed) return;

    try {
      await API.delete(`/api/paper-checks/${id}`);
      setHistory((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error("Delete paper check failed:", err);
      setErrorText("Failed to delete the saved paper-check report.");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div>
          <div style={styles.kicker}>Teacher Exam Check</div>
          <h2 style={styles.heroTitle}>Upload scanned MCQ sheets, read the answer key, and auto-calculate marks</h2>
          <p style={styles.heroText}>
            This workflow reads text files, PDFs, and scanned images with OCR. For the best
            accuracy, use answer-key lines like <strong>1:A 2:B 3:C</strong>. You can also paste
            cleaned text if the scan quality is weak.
          </p>
        </div>
        <div style={styles.heroStats}>
          <StatCard label="Saved Checks" value={history.length} />
          <StatCard label="OCR Mode" value="Hybrid" />
          <StatCard label="Teacher Flow" value="Ready" />
        </div>
      </div>

      <div style={styles.layout}>
        <section style={styles.formPanel}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.sectionKicker}>Upload & analyze</div>
              <h3 style={styles.sectionTitle}>MCQ paper checking workspace</h3>
            </div>
            <div style={styles.statusChip(processing)}>{processing ? "Processing" : "Ready"}</div>
          </div>

          <form onSubmit={handleAnalyze} style={styles.formGrid}>
            <input
              style={styles.input}
              placeholder="Exam Title"
              value={formState.examTitle}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, examTitle: event.target.value }))
              }
            />
            <input
              style={styles.input}
              placeholder="Course"
              value={formState.course}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, course: event.target.value }))
              }
            />
            <input
              style={styles.input}
              placeholder="Candidate Name"
              value={formState.candidateName}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, candidateName: event.target.value }))
              }
            />
            <input
              style={styles.input}
              type="number"
              min="1"
              placeholder="Marks per question"
              value={formState.marksPerQuestion}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  marksPerQuestion: event.target.value,
                }))
              }
            />

            <div style={styles.uploadCard}>
              <label style={styles.uploadLabel}>Student answer sheet</label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.json"
                onChange={(event) => setAnswerSheetFile(event.target.files?.[0] || null)}
              />
              <div style={styles.fileName}>{answerSheetFile?.name || "No file selected"}</div>
            </div>

            <div style={styles.uploadCard}>
              <label style={styles.uploadLabel}>Answer key file</label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.json"
                onChange={(event) => setAnswerKeyFile(event.target.files?.[0] || null)}
              />
              <div style={styles.fileName}>{answerKeyFile?.name || "No file selected"}</div>
            </div>

            <textarea
              style={{ ...styles.input, minHeight: "140px", gridColumn: "1 / -1" }}
              placeholder="Optional: paste cleaned OCR text from student answer sheet"
              value={manualAnswerText}
              onChange={(event) => setManualAnswerText(event.target.value)}
            />

            <textarea
              style={{ ...styles.input, minHeight: "140px", gridColumn: "1 / -1" }}
              placeholder="Optional: paste cleaned answer key text (example: 1:A 2:B 3:C)"
              value={manualKeyText}
              onChange={(event) => setManualKeyText(event.target.value)}
            />

            <div style={styles.fullRow}>
              <button type="submit" style={styles.primaryButton} disabled={processing}>
                {processing ? "Analyzing..." : "Analyze & Save Report"}
              </button>
            </div>
          </form>

          <div style={styles.statusBox}>
            <strong>Status:</strong> {statusText}
          </div>

          {errorText && <div style={styles.errorBox}>{errorText}</div>}

          {report && (
            <div style={styles.reportPanel}>
              <div style={styles.sectionHead}>
                <div>
                  <div style={styles.sectionKicker}>Latest result</div>
                  <h3 style={styles.sectionTitle}>Auto-checked marks report</h3>
                </div>
                <div style={styles.statusChip(report.manualReviewRequired)}>
                  {report.manualReviewRequired ? "Review Needed" : "Checked"}
                </div>
              </div>

              <div style={styles.pillGrid}>
                {summaryPills.map((item) => (
                  <div key={item.label} style={styles.pill}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>

              <div style={styles.resultStrip}>
                <div>
                  <span style={styles.resultLabel}>Accuracy</span>
                  <strong style={styles.resultValue}>{report.accuracyPercentage}%</strong>
                </div>
                <div>
                  <span style={styles.resultLabel}>Parsed Questions</span>
                  <strong style={styles.resultValue}>
                    {report.parsedQuestions} / {report.totalQuestions}
                  </strong>
                </div>
                <div>
                  <span style={styles.resultLabel}>Marks</span>
                  <strong style={styles.resultValue}>
                    {report.marksAwarded} / {report.totalMarks}
                  </strong>
                </div>
              </div>

              <div style={styles.summaryBox}>{report.reviewSummary}</div>

              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Q#</th>
                      <th style={styles.th}>Expected</th>
                      <th style={styles.th}>Student</th>
                      <th style={styles.th}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.questionResults.map((item) => (
                      <tr key={item.questionNumber}>
                        <td style={styles.td}>{item.questionNumber}</td>
                        <td style={styles.td}>{item.expectedAnswer || "-"}</td>
                        <td style={styles.td}>{item.studentAnswer || "Not found"}</td>
                        <td style={styles.td}>
                          <span style={styles.resultBadge(item.isCorrect)}>
                            {item.isCorrect ? "Correct" : item.studentAnswer ? "Wrong" : "Unread"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <aside style={styles.historyPanel}>
          <div style={styles.sectionHead}>
            <div>
              <div style={styles.sectionKicker}>Saved records</div>
              <h3 style={styles.sectionTitle}>Previous paper checks</h3>
            </div>
          </div>

          {loadingHistory ? (
            <div style={styles.emptyState}>Loading saved paper checks...</div>
          ) : history.length === 0 ? (
            <div style={styles.emptyState}>No scanned MCQ reports saved yet.</div>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {history.map((item) => (
                <div key={item._id} style={styles.historyCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                    <div>
                      <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "18px" }}>
                        {item.examTitle}
                      </div>
                      <div style={{ color: "#64748b", marginTop: "4px" }}>
                        {item.course || "General"} · {item.candidateName || "Candidate not set"}
                      </div>
                    </div>
                    <span style={styles.resultBadge(!item.manualReviewRequired)}>
                      {item.manualReviewRequired ? "Review" : "Saved"}
                    </span>
                  </div>

                  <div style={styles.historyStats}>
                    <span>
                      Marks <strong>{item.marksAwarded} / {item.totalMarks}</strong>
                    </span>
                    <span>
                      Accuracy <strong>{item.accuracyPercentage}%</strong>
                    </span>
                  </div>

                  <div style={{ color: "#475569", lineHeight: 1.6, marginTop: "12px" }}>
                    {item.reviewSummary}
                  </div>

                  <div style={styles.historyFooter}>
                    <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                    </span>
                    <button
                      type="button"
                      style={styles.deleteButton}
                      onClick={() => handleDelete(item._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div style={styles.statCard}>
    <span style={{ color: "rgba(255,255,255,0.76)" }}>{label}</span>
    <strong style={{ fontSize: "28px" }}>{value}</strong>
  </div>
);

const styles = {
  page: {
    display: "grid",
    gap: "22px",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    padding: "30px",
    borderRadius: "30px",
    background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 58%, #0891b2 100%)",
    color: "#fff",
    boxShadow: "0 28px 56px rgba(37, 99, 235, 0.2)",
  },
  kicker: {
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    fontSize: "12px",
    color: "rgba(255,255,255,0.72)",
  },
  heroTitle: {
    margin: "10px 0 12px",
    fontSize: "clamp(30px, 4vw, 48px)",
    lineHeight: 1.04,
  },
  heroText: {
    margin: 0,
    maxWidth: "760px",
    color: "rgba(255,255,255,0.84)",
    lineHeight: 1.75,
  },
  heroStats: {
    display: "grid",
    gap: "12px",
  },
  statCard: {
    padding: "18px 20px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.1)",
    display: "grid",
    gap: "8px",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
    alignItems: "start",
  },
  formPanel: {
    padding: "24px",
    borderRadius: "28px",
    background: "rgba(255,255,255,0.96)",
    border: "1px solid rgba(148,163,184,0.14)",
    boxShadow: "0 20px 44px rgba(15, 23, 42, 0.08)",
  },
  historyPanel: {
    padding: "24px",
    borderRadius: "28px",
    background: "rgba(255,255,255,0.96)",
    border: "1px solid rgba(148,163,184,0.14)",
    boxShadow: "0 20px 44px rgba(15, 23, 42, 0.08)",
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
    marginBottom: "18px",
  },
  sectionKicker: {
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: "12px",
    color: "#94a3b8",
  },
  sectionTitle: {
    margin: "6px 0 0",
    fontSize: "28px",
    color: "#0f172a",
  },
  statusChip: (active) => ({
    padding: "10px 14px",
    borderRadius: "999px",
    background: active ? "#eff6ff" : "#ecfdf5",
    color: active ? "#2563eb" : "#166534",
    fontWeight: 800,
    whiteSpace: "nowrap",
  }),
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "14px",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "16px",
    border: "1px solid #dbe3ef",
    background: "#f8fbff",
    fontSize: "15px",
    boxSizing: "border-box",
  },
  uploadCard: {
    padding: "16px",
    borderRadius: "20px",
    background: "#f8fbff",
    border: "1px solid #dbe3ef",
    display: "grid",
    gap: "12px",
  },
  uploadLabel: {
    fontWeight: 700,
    color: "#0f172a",
  },
  fileName: {
    color: "#64748b",
    fontSize: "13px",
  },
  fullRow: {
    gridColumn: "1 / -1",
  },
  primaryButton: {
    width: "100%",
    border: "none",
    padding: "16px 18px",
    borderRadius: "18px",
    background: "linear-gradient(135deg, #2563eb, #0891b2)",
    color: "#fff",
    fontWeight: 800,
    boxShadow: "0 18px 34px rgba(37, 99, 235, 0.22)",
  },
  statusBox: {
    marginTop: "16px",
    padding: "14px 16px",
    borderRadius: "16px",
    background: "#f8fbff",
    color: "#334155",
    border: "1px solid #dbe3ef",
  },
  errorBox: {
    marginTop: "14px",
    padding: "14px 16px",
    borderRadius: "16px",
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
  },
  reportPanel: {
    marginTop: "22px",
    paddingTop: "22px",
    borderTop: "1px solid rgba(148,163,184,0.18)",
  },
  pillGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "10px",
    marginBottom: "16px",
  },
  pill: {
    padding: "14px 16px",
    borderRadius: "18px",
    background: "#eff6ff",
    display: "grid",
    gap: "8px",
  },
  resultStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },
  resultLabel: {
    display: "block",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "#94a3b8",
    marginBottom: "6px",
  },
  resultValue: {
    fontSize: "28px",
    color: "#0f172a",
  },
  summaryBox: {
    padding: "16px",
    borderRadius: "18px",
    background: "#f8fafc",
    color: "#475569",
    lineHeight: 1.7,
    marginBottom: "16px",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "12px 14px",
    borderBottom: "2px solid #e2e8f0",
    color: "#64748b",
    fontSize: "13px",
  },
  td: {
    padding: "12px 14px",
    borderBottom: "1px solid #e2e8f0",
    color: "#0f172a",
  },
  resultBadge: (good) => ({
    display: "inline-flex",
    padding: "6px 12px",
    borderRadius: "999px",
    background: good ? "#dcfce7" : "#fff7ed",
    color: good ? "#166534" : "#c2410c",
    fontWeight: 800,
    fontSize: "12px",
  }),
  emptyState: {
    padding: "20px",
    borderRadius: "18px",
    background: "#f8fafc",
    color: "#64748b",
  },
  historyCard: {
    padding: "18px",
    borderRadius: "22px",
    background: "#f8fbff",
    border: "1px solid #dbe3ef",
  },
  historyStats: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    marginTop: "14px",
    color: "#334155",
  },
  historyFooter: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    marginTop: "16px",
  },
  deleteButton: {
    border: "none",
    padding: "10px 14px",
    borderRadius: "14px",
    background: "#fee2e2",
    color: "#b91c1c",
    fontWeight: 800,
  },
};

export default ExamChecker;
