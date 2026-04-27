import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, ShieldCheck, UserRoundPlus } from "lucide-react";
import API from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [role, setRole] = useState("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [department, setDepartment] = useState("");
  const [teacherAccessKey, setTeacherAccessKey] = useState("");
  const [classroomName, setClassroomName] = useState("");
  const [program, setProgram] = useState("");
  const [section, setSection] = useState("");
  const [semester, setSemester] = useState("");
  const [description, setDescription] = useState("");

  const [classroomId, setClassroomId] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [studentIdCard, setStudentIdCard] = useState(null);

  const [classrooms, setClassrooms] = useState([]);
  const [loadingBootstrap, setLoadingBootstrap] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadBootstrap = async () => {
      try {
        setLoadingBootstrap(true);
        const response = await API.get("/api/auth/bootstrap");
        if (!active) return;
        setClassrooms(Array.isArray(response.data?.classrooms) ? response.data.classrooms : []);
      } catch (error) {
        console.error("Registration bootstrap error:", error);
        if (active) {
          setErrorMessage("Failed to load classroom options. Please refresh and try again.");
        }
      } finally {
        if (active) {
          setLoadingBootstrap(false);
        }
      }
    };

    loadBootstrap();

    return () => {
      active = false;
    };
  }, []);

  const selectedClassroom = useMemo(
    () => classrooms.find((item) => item.id === classroomId) || null,
    [classroomId, classrooms]
  );

  const resetFeedback = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    resetFeedback();

    if (!name || !email || !password) {
      setErrorMessage("Please complete the required account details first.");
      return;
    }

    if (role === "teacher" && (!department || !classroomName || !teacherAccessKey)) {
      setErrorMessage("Teacher onboarding needs department, classroom, and access key.");
      return;
    }

    if (role === "student" && (!classroomId || !rollNumber || !studentIdCard)) {
      setErrorMessage("Student signup needs classroom, roll number, and ID card image.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("role", role);
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);

      if (role === "teacher") {
        formData.append("department", department);
        formData.append("teacherAccessKey", teacherAccessKey);
        formData.append("classroomName", classroomName);
        formData.append("program", program || classroomName);
        formData.append("section", section);
        formData.append("semester", semester);
        formData.append("description", description);
      } else {
        formData.append("classroomId", classroomId);
        formData.append("rollNumber", rollNumber);
        formData.append("studentIdCard", studentIdCard);
      }

      const response = await API.post("/api/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const message =
        response.data?.message ||
        (role === "teacher"
          ? "Teacher account created successfully."
          : "Student registration submitted for approval.");

      setSuccessMessage(message);

      if (role === "teacher") {
        setTimeout(() => navigate("/"), 900);
      } else {
        setTimeout(() => navigate("/"), 1400);
      }
    } catch (error) {
      console.error("Register Error:", error);
      setErrorMessage(
        error.response?.data?.message || "Registration failed. Please review the form and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <section style={styles.infoPanel}>
          <div style={styles.brandRow}>
            <div style={styles.brandIcon}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <div style={styles.brandTitle}>Guided Onboarding</div>
              <div style={styles.brandSubTitle}>Secure role-based registration</div>
            </div>
          </div>

          <div style={styles.copyBlock}>
            <div style={styles.kicker}>Create Account</div>
            <h1 style={styles.title}>Join the Proctor-AI portal</h1>
            <p style={styles.text}>Register as Student or Teacher to continue.</p>
          </div>

          <div style={styles.highlightGrid}>
            <div style={styles.highlightCard}>
              <strong>Teacher path</strong>
              <span>Access key and class setup</span>
            </div>
            <div style={styles.highlightCard}>
              <strong>Student path</strong>
              <span>Class selection and ID verification</span>
            </div>
            <div style={styles.highlightCard}>
              <strong>Approvals</strong>
              <span>Secure role-based access</span>
            </div>
          </div>

          <div style={styles.noteCard}>
            <CheckCircle2 size={18} />
            Approved classrooms available now: <strong>{classrooms.length}</strong>
          </div>
        </section>

        <section style={styles.formPanel}>
          <div style={styles.formHeader}>
            <div style={styles.formKicker}>Create account</div>
            <h2 style={styles.formTitle}>Sign up</h2>
          </div>

          <div style={styles.roleRow}>
            <button type="button" onClick={() => setRole("student")} style={styles.roleButton(role === "student")}>
              Student
            </button>
            <button type="button" onClick={() => setRole("teacher")} style={styles.roleButton(role === "teacher")}>
              Teacher
            </button>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.grid}>
              <label style={styles.label}>
                Full Name
                <input
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    resetFeedback();
                  }}
                  placeholder="Enter full name"
                  style={styles.input}
                />
              </label>

              <label style={styles.label}>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    resetFeedback();
                  }}
                  placeholder="you@example.com"
                  style={styles.input}
                />
              </label>

              <label style={styles.label}>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    resetFeedback();
                  }}
                  placeholder="Minimum 6 characters"
                  style={styles.input}
                />
              </label>

              {role === "teacher" ? (
                <>
                  <label style={styles.label}>
                    Department
                    <input
                      type="text"
                      value={department}
                      onChange={(event) => {
                        setDepartment(event.target.value);
                        resetFeedback();
                      }}
                      placeholder="Computer Science"
                      style={styles.input}
                    />
                  </label>

                  <label style={styles.label}>
                    Teacher Access Key
                    <input
                      type="password"
                      value={teacherAccessKey}
                      onChange={(event) => {
                        setTeacherAccessKey(event.target.value);
                        resetFeedback();
                      }}
                      placeholder="Teacher-only access key"
                      style={styles.input}
                    />
                  </label>

                  <label style={{ ...styles.label, gridColumn: "1 / -1" }}>
                    Primary Classroom Name
                    <input
                      type="text"
                      value={classroomName}
                      onChange={(event) => {
                        setClassroomName(event.target.value);
                        resetFeedback();
                      }}
                      placeholder="BSCS Morning"
                      style={styles.input}
                    />
                  </label>

                  <label style={styles.label}>
                    Program
                    <input
                      type="text"
                      value={program}
                      onChange={(event) => {
                        setProgram(event.target.value);
                        resetFeedback();
                      }}
                      placeholder="BS Computer Science"
                      style={styles.input}
                    />
                  </label>

                  <label style={styles.label}>
                    Section
                    <input
                      type="text"
                      value={section}
                      onChange={(event) => {
                        setSection(event.target.value);
                        resetFeedback();
                      }}
                      placeholder="A"
                      style={styles.input}
                    />
                  </label>

                  <label style={styles.label}>
                    Semester
                    <input
                      type="text"
                      value={semester}
                      onChange={(event) => {
                        setSemester(event.target.value);
                        resetFeedback();
                      }}
                      placeholder="6th"
                      style={styles.input}
                    />
                  </label>

                  <label style={{ ...styles.label, gridColumn: "1 / -1" }}>
                    Classroom Description
                    <textarea
                      value={description}
                      onChange={(event) => {
                        setDescription(event.target.value);
                        resetFeedback();
                      }}
                      placeholder="Optional notes for this class, lab, or batch."
                      style={{ ...styles.input, minHeight: "110px", resize: "vertical" }}
                    />
                  </label>
                </>
              ) : (
                <>
                  <label style={{ ...styles.label, gridColumn: "1 / -1" }}>
                    Select Classroom
                    <select
                      value={classroomId}
                      onChange={(event) => {
                        setClassroomId(event.target.value);
                        resetFeedback();
                      }}
                      style={styles.input}
                      disabled={loadingBootstrap}
                    >
                      <option value="">
                        {loadingBootstrap ? "Loading classrooms..." : "Choose your classroom"}
                      </option>
                      {classrooms.map((classroom) => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.label} | {classroom.teacherName}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedClassroom ? (
                    <div style={styles.classroomPreview}>
                      <div style={styles.previewTitle}>Selected class</div>
                      <div style={styles.previewText}>
                        {selectedClassroom.label} | Department {selectedClassroom.department}
                      </div>
                    </div>
                  ) : null}

                  <label style={styles.label}>
                    Roll Number
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={(event) => {
                        setRollNumber(event.target.value);
                        resetFeedback();
                      }}
                      placeholder="FA24-BCS-021"
                      style={styles.input}
                    />
                  </label>

                  <label style={styles.label}>
                    Student ID Card
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(event) => {
                        setStudentIdCard(event.target.files?.[0] || null);
                        resetFeedback();
                      }}
                      style={styles.fileInput}
                    />
                  </label>
                </>
              )}
            </div>

            {errorMessage ? <div style={styles.errorBox}>{errorMessage}</div> : null}
            {successMessage ? <div style={styles.successBox}>{successMessage}</div> : null}

            <button type="submit" disabled={loading} style={styles.primaryButton}>
              <UserRoundPlus size={18} />
              {loading ? "Submitting..." : role === "teacher" ? "Create Teacher Account" : "Submit Student Approval Request"}
            </button>
          </form>

          <div style={styles.footerRow}>
            <span style={{ color: "#64748b" }}>Already have an account?</span>
            <Link to="/" style={styles.loginLink}>
              Login
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "24px",
    background:
      "radial-gradient(circle at top right, rgba(29, 78, 216, 0.12), transparent 28%), radial-gradient(circle at bottom left, rgba(15, 118, 110, 0.14), transparent 28%), linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%)",
  },
  shell: {
    width: "min(1280px, 100%)",
    margin: "0 auto",
    minHeight: "calc(100vh - 48px)",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.08fr) minmax(380px, 500px)",
    gap: "22px",
  },
  infoPanel: {
    background: "linear-gradient(145deg, #0f172a 0%, #123c6b 40%, #1d4ed8 100%)",
    color: "#fff",
    borderRadius: "34px",
    padding: "34px",
    display: "grid",
    alignContent: "space-between",
    gap: "28px",
    boxShadow: "0 30px 60px rgba(15, 23, 42, 0.18)",
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  brandIcon: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.14)",
  },
  brandTitle: {
    fontSize: "28px",
    fontWeight: 900,
  },
  brandSubTitle: {
    color: "rgba(255,255,255,0.74)",
    fontSize: "13px",
  },
  copyBlock: {
    display: "grid",
    gap: "14px",
  },
  kicker: {
    display: "inline-flex",
    width: "fit-content",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.14)",
    fontSize: "12px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontWeight: 800,
  },
  title: {
    margin: 0,
    fontSize: "clamp(34px, 5vw, 52px)",
    lineHeight: 1.06,
  },
  text: {
    margin: 0,
    maxWidth: "420px",
    color: "rgba(255,255,255,0.84)",
    lineHeight: 1.6,
    fontSize: "15px",
  },
  highlightGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
  },
  highlightCard: {
    padding: "18px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.12)",
    display: "grid",
    gap: "8px",
    lineHeight: 1.6,
  },
  noteCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 16px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: "14px",
  },
  formPanel: {
    background: "rgba(255,255,255,0.96)",
    borderRadius: "34px",
    padding: "32px",
    border: "1px solid rgba(148,163,184,0.12)",
    boxShadow: "0 24px 54px rgba(15, 23, 42, 0.1)",
    display: "grid",
    alignContent: "start",
    gap: "24px",
  },
  formHeader: {
    display: "grid",
    gap: "8px",
  },
  formKicker: {
    fontSize: "12px",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#1d4ed8",
    fontWeight: 800,
  },
  formTitle: {
    margin: 0,
    fontSize: "32px",
    color: "#0f172a",
    lineHeight: 1.12,
  },
  roleRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  roleButton: (active) => ({
    border: active ? "1px solid #1d4ed8" : "1px solid rgba(148,163,184,0.2)",
    background: active
      ? "linear-gradient(135deg, rgba(29,78,216,0.1), rgba(15,118,110,0.08))"
      : "#fff",
    color: "#0f172a",
    borderRadius: "18px",
    padding: "14px 16px",
    fontWeight: 800,
    cursor: "pointer",
  }),
  form: {
    display: "grid",
    gap: "18px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  label: {
    display: "grid",
    gap: "8px",
    color: "#334155",
    fontWeight: 700,
    fontSize: "14px",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "16px",
    border: "1px solid rgba(148,163,184,0.22)",
    background: "#f8fafc",
    boxSizing: "border-box",
    fontSize: "15px",
    color: "#0f172a",
    fontFamily: "inherit",
  },
  fileInput: {
    width: "100%",
    padding: "13px 14px",
    borderRadius: "16px",
    border: "1px dashed rgba(37,99,235,0.28)",
    background: "#eff6ff",
    boxSizing: "border-box",
    fontSize: "14px",
  },
  classroomPreview: {
    gridColumn: "1 / -1",
    padding: "14px 16px",
    borderRadius: "18px",
    background: "#eff6ff",
    border: "1px solid rgba(37,99,235,0.16)",
    display: "grid",
    gap: "4px",
  },
  previewTitle: {
    color: "#1d4ed8",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontWeight: 800,
  },
  previewText: {
    color: "#0f172a",
    lineHeight: 1.55,
  },
  errorBox: {
    padding: "14px 16px",
    borderRadius: "16px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    fontSize: "14px",
  },
  successBox: {
    padding: "14px 16px",
    borderRadius: "16px",
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontSize: "14px",
  },
  primaryButton: {
    border: "none",
    borderRadius: "18px",
    padding: "15px 18px",
    background: "linear-gradient(135deg, #1d4ed8, #0f766e)",
    color: "#fff",
    fontWeight: 800,
    fontSize: "15px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    boxShadow: "0 18px 34px rgba(37, 99, 235, 0.18)",
  },
  footerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap",
  },
  loginLink: {
    color: "#1d4ed8",
    fontWeight: 800,
    textDecoration: "none",
  },
};

export default Register;
