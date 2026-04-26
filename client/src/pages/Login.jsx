import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, LockKeyhole, ShieldCheck } from "lucide-react";
import API from "../services/api";

const portalCards = [
  {
    id: "student",
    title: "Student Portal",
    description: "Join your classroom, attempt exams, submit work, and track integrity reports.",
  },
  {
    id: "teacher",
    title: "Teacher Portal",
    description: "Approve students, manage classrooms, publish assessments, and review AI analytics.",
  },
];

function Login() {
  const [portalRole, setPortalRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const response = await API.post("/api/auth/login", {
        email,
        password,
        portalRole,
      });

      if (!response.data?.token || !response.data?.user) {
        setErrorMessage("Invalid server response. Please try again.");
        return;
      }

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      window.location.href =
        response.data.user.role === "teacher" ? "/teacher-panel" : "/dashboard";
    } catch (error) {
      console.error("Login Error:", error);
      setErrorMessage(
        error.response?.data?.message || "Login failed. Please verify your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <section style={styles.heroPanel}>
          <div style={styles.brand}>
            <div style={styles.brandIcon}>
              <ShieldCheck size={28} />
            </div>
            <div>
              <div style={styles.brandTitle}>PROCTOR-AI</div>
              <div style={styles.brandSubTitle}>Secure exam intelligence suite</div>
            </div>
          </div>

          <div style={styles.heroCopy}>
            <div style={styles.heroBadge}>Trusted classroom operations</div>
            <h1 style={styles.heroTitle}>
              One secure portal for proctored exams, classroom approvals, and academic analytics
            </h1>
            <p style={styles.heroText}>
              Teachers get protected onboarding plus classroom-level control. Students join the
              right class, wait for approval, and access only their own learning workspace.
            </p>
          </div>

          <div style={styles.insightGrid}>
            <div style={styles.insightCard}>
              <span style={styles.insightLabel}>Teacher Access</span>
              <strong style={styles.insightValue}>Protected key + classroom ownership</strong>
            </div>
            <div style={styles.insightCard}>
              <span style={styles.insightLabel}>Student Entry</span>
              <strong style={styles.insightValue}>ID card + roll number approval flow</strong>
            </div>
            <div style={styles.insightCard}>
              <span style={styles.insightLabel}>Exam Security</span>
              <strong style={styles.insightValue}>AI proctoring + suspicious activity logs</strong>
            </div>
          </div>
        </section>

        <section style={styles.formPanel}>
          <div style={styles.formHeader}>
            <div style={styles.formKicker}>Sign in</div>
            <h2 style={styles.formTitle}>Continue to your protected workspace</h2>
            <p style={styles.formText}>
              Choose the correct portal first so a student cannot enter the teacher dashboard by
              mistake.
            </p>
          </div>

          <div style={styles.portalGrid}>
            {portalCards.map((portal) => {
              const active = portalRole === portal.id;
              return (
                <button
                  key={portal.id}
                  type="button"
                  onClick={() => setPortalRole(portal.id)}
                  style={styles.portalCard(active)}
                >
                  <div style={styles.portalTitle}>{portal.title}</div>
                  <div style={styles.portalDescription}>{portal.description}</div>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleLogin} style={styles.form}>
            <label style={styles.label}>
              Email
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              Password
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                style={styles.input}
              />
            </label>

            {errorMessage ? <div style={styles.errorBox}>{errorMessage}</div> : null}

            <button type="submit" disabled={loading} style={styles.primaryButton}>
              <span>{loading ? "Signing in..." : "Sign In Securely"}</span>
              {!loading ? <ArrowRight size={18} /> : <LockKeyhole size={18} />}
            </button>
          </form>

          <div style={styles.footerRow}>
            <span style={{ color: "#64748b" }}>New to the system?</span>
            <Link to="/register" style={styles.registerLink}>
              Create account
            </Link>
          </div>

          <div style={styles.helperStrip}>
            <GraduationCap size={18} />
            Student approvals and teacher keys are enforced on the backend as well.
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
      "radial-gradient(circle at top left, rgba(15, 118, 110, 0.16), transparent 28%), radial-gradient(circle at bottom right, rgba(29, 78, 216, 0.14), transparent 34%), linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%)",
  },
  shell: {
    width: "min(1240px, 100%)",
    margin: "0 auto",
    minHeight: "calc(100vh - 48px)",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.15fr) minmax(360px, 460px)",
    gap: "22px",
  },
  heroPanel: {
    background: "linear-gradient(145deg, #0f172a 0%, #123c6b 44%, #0f766e 100%)",
    borderRadius: "34px",
    padding: "34px",
    color: "#fff",
    boxShadow: "0 30px 60px rgba(15, 23, 42, 0.18)",
    display: "grid",
    alignContent: "space-between",
    gap: "28px",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  brandIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "18px",
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.14)",
  },
  brandTitle: {
    fontSize: "30px",
    fontWeight: 900,
    letterSpacing: "0.08em",
  },
  brandSubTitle: {
    color: "rgba(255,255,255,0.74)",
    fontSize: "13px",
  },
  heroCopy: {
    display: "grid",
    gap: "14px",
  },
  heroBadge: {
    display: "inline-flex",
    width: "fit-content",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: "12px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontWeight: 800,
  },
  heroTitle: {
    margin: 0,
    fontSize: "clamp(36px, 5vw, 62px)",
    lineHeight: 1.02,
  },
  heroText: {
    margin: 0,
    fontSize: "15px",
    color: "rgba(255,255,255,0.84)",
    lineHeight: 1.8,
    maxWidth: "760px",
  },
  insightGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
  },
  insightCard: {
    padding: "18px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.12)",
    display: "grid",
    gap: "8px",
  },
  insightLabel: {
    fontSize: "11px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.68)",
  },
  insightValue: {
    fontSize: "15px",
    lineHeight: 1.5,
  },
  formPanel: {
    background: "rgba(255,255,255,0.96)",
    borderRadius: "34px",
    padding: "32px",
    boxShadow: "0 24px 54px rgba(15, 23, 42, 0.1)",
    border: "1px solid rgba(148, 163, 184, 0.12)",
    display: "grid",
    alignContent: "start",
    gap: "24px",
  },
  formHeader: {
    display: "grid",
    gap: "10px",
  },
  formKicker: {
    fontSize: "12px",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#0f766e",
    fontWeight: 800,
  },
  formTitle: {
    margin: 0,
    fontSize: "32px",
    lineHeight: 1.1,
    color: "#0f172a",
  },
  formText: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.7,
    fontSize: "14px",
  },
  portalGrid: {
    display: "grid",
    gap: "10px",
  },
  portalCard: (active) => ({
    textAlign: "left",
    padding: "16px 18px",
    borderRadius: "20px",
    border: active ? "1px solid #0f766e" : "1px solid rgba(148, 163, 184, 0.2)",
    background: active
      ? "linear-gradient(135deg, rgba(15,118,110,0.1), rgba(37,99,235,0.08))"
      : "#fff",
    cursor: "pointer",
    display: "grid",
    gap: "6px",
  }),
  portalTitle: {
    fontWeight: 800,
    color: "#0f172a",
    fontSize: "16px",
  },
  portalDescription: {
    color: "#64748b",
    lineHeight: 1.55,
    fontSize: "13px",
  },
  form: {
    display: "grid",
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
  },
  errorBox: {
    padding: "14px 16px",
    borderRadius: "16px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    fontSize: "14px",
  },
  primaryButton: {
    border: "none",
    borderRadius: "18px",
    padding: "15px 18px",
    background: "linear-gradient(135deg, #0f766e, #2563eb)",
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
  registerLink: {
    color: "#1d4ed8",
    fontWeight: 800,
    textDecoration: "none",
  },
  helperStrip: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 16px",
    borderRadius: "18px",
    background: "#eff6ff",
    color: "#1e40af",
    lineHeight: 1.5,
    fontSize: "14px",
  },
};

export default Login;
