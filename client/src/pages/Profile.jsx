import { useEffect, useState } from "react";
import { KeyRound, Save, ShieldCheck, UserRound } from "lucide-react";
import API from "../services/api";
import { updateStoredUser } from "../utils/authSession";

const inputStyle = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: "14px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  boxSizing: "border-box",
};

function Profile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", department: "", rollNumber: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState({ type: "", message: "" });

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await API.get("/api/auth/me");
      const user = response.data?.user;
      setProfile(user);
      setForm({
        name: user?.name || "",
        email: user?.email || "",
        department: user?.department || "",
        rollNumber: user?.rollNumber || "",
      });
    } catch (error) {
      setNotice({ type: "error", message: error.response?.data?.message || "Failed to load profile." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSaving("profile");
    setNotice({ type: "", message: "" });
    try {
      const response = await API.put("/api/auth/profile", form);
      setProfile(response.data.user);
      updateStoredUser(response.data.user);
      setNotice({ type: "success", message: response.data.message || "Profile updated." });
    } catch (error) {
      setNotice({ type: "error", message: error.response?.data?.message || "Profile update failed." });
    } finally {
      setSaving("");
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setNotice({ type: "", message: "" });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setNotice({ type: "error", message: "New password and confirmation do not match." });
      return;
    }

    setSaving("password");
    try {
      const response = await API.put("/api/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setNotice({ type: "success", message: response.data.message || "Password changed." });
    } catch (error) {
      setNotice({ type: "error", message: error.response?.data?.message || "Password change failed." });
    } finally {
      setSaving("");
    }
  };

  if (loading) {
    return <div style={styles.loader}>Loading profile...</div>;
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <div style={styles.badge}>Account Center</div>
          <h1 style={styles.title}>{profile?.name || "Profile"}</h1>
          <p style={styles.subtitle}>
            {profile?.role || "User"} account | {profile?.classroomName || profile?.department || "Academic workspace"}
          </p>
        </div>
        <div style={styles.identityCard}>
          <ShieldCheck size={24} />
          <div>
            <strong>{profile?.approvalStatus || "approved"}</strong>
            <span>Access status</span>
          </div>
        </div>
      </section>

      {notice.message ? (
        <div style={notice.type === "error" ? styles.errorBox : styles.successBox}>{notice.message}</div>
      ) : null}

      <div style={styles.grid}>
        <form onSubmit={handleProfileSubmit} style={styles.panel}>
          <div style={styles.panelHeader}>
            <UserRound size={22} />
            <div>
              <h2 style={styles.panelTitle}>Profile details</h2>
              <p style={styles.panelText}>Update your account information.</p>
            </div>
          </div>

          <label style={styles.label}>
            Name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} style={inputStyle} />
          </label>

          <label style={styles.label}>
            Email
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} style={inputStyle} />
          </label>

          {profile?.role === "student" ? (
            <label style={styles.label}>
              Roll Number
              <input value={form.rollNumber} onChange={(event) => setForm({ ...form, rollNumber: event.target.value })} style={inputStyle} />
            </label>
          ) : (
            <label style={styles.label}>
              Department
              <input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} style={inputStyle} />
            </label>
          )}

          <div style={styles.metaGrid}>
            <Info label="Role" value={profile?.role || "user"} />
            <Info label="Classroom" value={profile?.classroomName || "Not assigned"} />
            <Info label="Teacher" value={profile?.teacherName || "Not assigned"} />
          </div>

          <button type="submit" disabled={saving === "profile"} style={styles.primaryButton}>
            <Save size={18} />
            {saving === "profile" ? "Saving..." : "Save profile"}
          </button>
        </form>

        <form onSubmit={handlePasswordSubmit} style={styles.panel}>
          <div style={styles.panelHeader}>
            <KeyRound size={22} />
            <div>
              <h2 style={styles.panelTitle}>Change password</h2>
              <p style={styles.panelText}>Use a strong password with at least 6 characters.</p>
            </div>
          </div>

          <label style={styles.label}>
            Current Password
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
              style={inputStyle}
            />
          </label>

          <label style={styles.label}>
            New Password
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
              style={inputStyle}
            />
          </label>

          <label style={styles.label}>
            Confirm New Password
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
              style={inputStyle}
            />
          </label>

          <button type="submit" disabled={saving === "password"} style={styles.secondaryButton}>
            <KeyRound size={18} />
            {saving === "password" ? "Updating..." : "Change password"}
          </button>
        </form>
      </div>
    </div>
  );
}

const Info = ({ label, value }) => (
  <div style={styles.infoBox}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const styles = {
  page: {
    minHeight: "100vh",
    padding: "28px 24px",
    background: "linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)",
  },
  loader: {
    minHeight: "50vh",
    display: "grid",
    placeItems: "center",
    color: "#334155",
    fontWeight: 800,
  },
  hero: {
    maxWidth: "1160px",
    margin: "0 auto 22px",
    borderRadius: "24px",
    padding: "28px",
    background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 54%, #0f766e 100%)",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    flexWrap: "wrap",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.2)",
  },
  badge: {
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.16)",
    fontWeight: 800,
    fontSize: "13px",
  },
  title: { margin: "14px 0 8px", fontSize: "clamp(30px, 5vw, 52px)", lineHeight: 1, letterSpacing: 0 },
  subtitle: { margin: 0, color: "rgba(255,255,255,0.78)", fontWeight: 700 },
  identityCard: {
    alignSelf: "center",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.16)",
  },
  grid: {
    maxWidth: "1160px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
    gap: "20px",
  },
  panel: {
    background: "#ffffff",
    borderRadius: "22px",
    padding: "24px",
    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e2e8f0",
    display: "grid",
    gap: "16px",
  },
  panelHeader: { display: "flex", gap: "12px", alignItems: "flex-start", color: "#0f172a" },
  panelTitle: { margin: 0, fontSize: "22px", letterSpacing: 0 },
  panelText: { margin: "4px 0 0", color: "#64748b" },
  label: { display: "grid", gap: "8px", color: "#0f172a", fontWeight: 800 },
  metaGrid: { display: "grid", gap: "10px", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" },
  infoBox: {
    padding: "12px",
    borderRadius: "14px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    display: "grid",
    gap: "4px",
  },
  primaryButton: {
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
  secondaryButton: {
    border: "none",
    borderRadius: "16px",
    padding: "14px 18px",
    background: "linear-gradient(135deg, #0f766e, #10b981)",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  errorBox: {
    maxWidth: "1160px",
    margin: "0 auto 18px",
    background: "#fee2e2",
    color: "#991b1b",
    padding: "14px 16px",
    borderRadius: "14px",
    fontWeight: 800,
  },
  successBox: {
    maxWidth: "1160px",
    margin: "0 auto 18px",
    background: "#dcfce7",
    color: "#166534",
    padding: "14px 16px",
    borderRadius: "14px",
    fontWeight: 800,
  },
};

export default Profile;
