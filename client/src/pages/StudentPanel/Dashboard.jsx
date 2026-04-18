import { useNavigate, Link } from "react-router-dom"; // Link yahan add kiya
import { LayoutDashboard, PlayCircle, LogOut, ShieldCheck, History, User, CheckCircle, Folder } from "lucide-react"; // Folder icon add kiya

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const startExam = () => {
    navigate("/exam");
  };

  // Professional Styles Object
  const s = {
    container: { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#f1f5f9', fontFamily: '"Inter", sans-serif', overflow: 'hidden' },
    sidebar: { width: '260px', backgroundColor: '#1e293b', color: 'white', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 10px rgba(0,0,0,0.1)' },
    main: { flex: 1, padding: '40px', overflowY: 'auto' },
    navLink: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#94a3b8', borderRadius: '8px', cursor: 'pointer', marginBottom: '10px', textDecoration: 'none', transition: '0.3s' },
    navLinkActive: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '8px', cursor: 'pointer', marginBottom: '10px', textDecoration: 'none' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' },
    card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderBottom: '4px solid #3b82f6' },
    hero: { background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 100%)', color: 'white', padding: '40px', borderRadius: '20px', marginBottom: '32px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
    btnStart: { backgroundColor: 'white', color: '#1e3a8a', border: 'none', padding: '14px 28px', borderRadius: '10px', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px', transition: 'transform 0.2s' },
    btnLogout: { backgroundColor: 'transparent', color: '#f87171', border: '1px solid #f87171', padding: '10px', borderRadius: '8px', cursor: 'pointer', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }
  };

  return (
    <div style={s.container}>
      {/* SIDEBAR */}
      <aside style={s.sidebar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <ShieldCheck color="#60a5fa" size={32} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>ProctorSecure</h2>
        </div>
        
        <Link to="/dashboard" style={s.navLinkActive}><LayoutDashboard size={20} /> Dashboard</Link>
        
        {/* ✅ ASSIGNMENTS OPTION ADDED HERE */}
        <Link to="/assignment-list" style={s.navLink}>
          <Folder size={20} /> Assignments
        </Link>

        <Link to="/history" style={s.navLink}><History size={20} /> History</Link>
        <Link to="/profile" style={s.navLink}><User size={20} /> Profile</Link>

        <button onClick={handleLogout} style={s.btnLogout}>
          <LogOut size={18} /> Logout Candidate
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main style={s.main}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#0f172a', fontSize: '2rem' }}>Welcome Back, Zubair! 👋</h1>
            <p style={{ color: '#64748b', marginTop: '5px' }}>System is ready for your next examination.</p>
          </div>
          <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#1e293b' }}>
            ZC
          </div>
        </div>

        {/* STATS */}
        <div style={s.statsGrid}>
          <div style={s.card}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>LAST PERFORMANCE</span>
            <h2 style={{ margin: '10px 0 0 0', color: '#1e293b' }}>85%</h2>
          </div>
          <div style={{ ...s.card, borderColor: '#10b981' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>INTEGRITY SCORE</span>
            <h2 style={{ margin: '10px 0 0 0', color: '#059669' }}>High</h2>
          </div>
          <div style={{ ...s.card, borderColor: '#8b5cf6' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>TOTAL SESSIONS</span>
            <h2 style={{ margin: '10px 0 0 0', color: '#1e293b' }}>24</h2>
          </div>
        </div>

        {/* HERO SECTION */}
        <div style={s.hero}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>AI Proctoring Active</h2>
          <p style={{ opacity: 0.8, maxWidth: '900px', lineHeight: '1.6', marginTop: '10px' }}>
            Your session will be monitored via Camera, Microphone, and Screen recording. 
            Ensure you are in a quiet room with sufficient lighting.
          </p>
          <button onClick={startExam} style={s.btnStart} onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.target.style.transform = 'scale(1)'}>
            <PlayCircle size={22} /> START EXAM NOW
          </button>
        </div>

        {/* SYSTEM STATUS */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>System Readiness Check</h3>
          <div style={{ display: 'flex', gap: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={20} color="#10b981" />
              <span style={{ color: '#475569' }}>Camera Access Granted</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={20} color="#10b981" />
              <span style={{ color: '#475569' }}>Microphone Level OK</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={20} color="#10b981" />
              <span style={{ color: '#475569' }}>Screen Share Module Ready</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;