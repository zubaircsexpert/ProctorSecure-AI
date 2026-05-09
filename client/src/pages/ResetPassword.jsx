import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, ShieldCheck } from "lucide-react";
import API from "../services/api";

function ResetPassword() {
  const navigate = useNavigate();
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") || "", []);
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice({ type: "", message: "" });

    if (!token) {
      setNotice({ type: "error", message: "Reset token is missing." });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setNotice({ type: "error", message: "Passwords do not match." });
      return;
    }

    try {
      setLoading(true);
      const response = await API.post("/api/auth/reset-password", {
        token,
        newPassword: form.newPassword,
      });
      setNotice({ type: "success", message: response.data.message || "Password reset successfully." });
      setTimeout(() => navigate("/", { replace: true }), 1200);
    } catch (error) {
      setNotice({ type: "error", message: error.response?.data?.message || "Password reset failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <div style={styles.icon}><ShieldCheck size={30} /></div>
        <h1 style={styles.title}>Reset password</h1>
        <p style={styles.text}>Create a new password for your ProctorSecure AI account.</p>

        {notice.message ? (
          <div style={notice.type === "error" ? styles.error : styles.success}>{notice.message}</div>
        ) : null}

        <label style={styles.label}>
          New Password
          <input
            type="password"
            value={form.newPassword}
            onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
            style={styles.input}
          />
        </label>

        <label style={styles.label}>
          Confirm Password
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
            style={styles.input}
          />
        </label>

        <button type="submit" disabled={loading} style={styles.button}>
          <KeyRound size={18} />
          {loading ? "Resetting..." : "Reset password"}
        </button>

        <Link to="/" style={styles.link}>Back to login</Link>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "20px",
    background: "linear-gradient(135deg, #eff6ff, #f8fafc)",
  },
  card: {
    width: "min(440px, 100%)",
    background: "#fff",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 24px 70px rgba(15, 23, 42, 0.14)",
    display: "grid",
    gap: "16px",
  },
  icon: {
    width: "58px",
    height: "58px",
    borderRadius: "18px",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #2563eb, #0f766e)",
    color: "#fff",
  },
  title: { margin: 0, color: "#0f172a", letterSpacing: 0 },
  text: { margin: 0, color: "#64748b", lineHeight: 1.6 },
  label: { display: "grid", gap: "8px", color: "#0f172a", fontWeight: 800 },
  input: { width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: "14px", border: "1px solid #cbd5e1" },
  button: {
    border: "none",
    borderRadius: "16px",
    padding: "14px 18px",
    background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  link: { color: "#2563eb", fontWeight: 800, textAlign: "center", textDecoration: "none" },
  error: { background: "#fee2e2", color: "#991b1b", padding: "12px", borderRadius: "12px", fontWeight: 800 },
  success: { background: "#dcfce7", color: "#166534", padding: "12px", borderRadius: "12px", fontWeight: 800 },
};

export default ResetPassword;
