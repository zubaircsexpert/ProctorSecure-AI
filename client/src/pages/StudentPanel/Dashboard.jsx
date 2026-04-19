import { useState, useEffect } from "react"; // Hooks add kiye
import { useNavigate, Link } from "react-router-dom";
import { LayoutDashboard, PlayCircle, LogOut, ShieldCheck, History, User, Folder, CheckCircle, Menu, X } from "lucide-react";

function Dashboard() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Screen size monitor karne ke liye
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const startExam = () => {
    navigate("/exam");
  };

  // Responsive Styles Object
  const s = {
    container: { 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row', // Mobile par upar-niche
      height: '100vh', 
      width: '100vw', 
      backgroundColor: '#f1f5f9', 
      fontFamily: '"Inter", sans-serif', 
      overflow: isMobile ? 'auto' : 'hidden' 
    },
    sidebar: { 
      width: isMobile ? '100%' : '260px', 
      backgroundColor: '#1e293b', 
      color: 'white', 
      padding: isMobile ? '15px' : '24px', 
      display: 'flex', 
      flexDirection: isMobile ? 'row' : 'column', // Mobile par horizontal bar
      alignItems: isMobile ? 'center' : 'stretch',
      justifyContent: isMobile ? 'space-between' : 'flex-start',
      boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
      zIndex: 10
    },
    main: { 
      flex: 1, 
      padding: isMobile ? '20px' : '40px', 
      overflowY: 'auto',
      width: '100%'
    },
    navLink: { 
      display: isMobile ? 'none' : 'flex', // Mobile par menu icons hide (space bachane ke liye)
      alignItems: 'center', 
      gap: '12px', 
      padding: '12px 16px', 
      color: '#94a3b8', 
      borderRadius: '8px', 
      cursor: 'pointer', 
      marginBottom: '10px', 
      textDecoration: 'none', 
      transition: '0.3s' 
    },
    navLinkActive: { 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px', 
      padding: isMobile ? '8px 12px' : '12px 16px', 
      backgroundColor: '#3b82f6', 
      color: 'white', 
      borderRadius: '8px', 
      textDecoration: 'none',
      fontSize: isMobile ? '0.8rem' : '1rem'
    },
    statsGrid: { 
      display: 'grid', 
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', // Mobile par single column
      gap: '15px', 
      marginBottom: '32px' 
    },
    card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderBottom: '4px solid #3b82f6' },
    hero: { 
      background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 100%)', 
      color: 'white', 
      padding: isMobile ? '25px' : '40px', 
      borderRadius: '20px', 
      marginBottom: '32px',
      textAlign: isMobile ? 'center' : 'left'
    },
    btnStart: { 
      backgroundColor: 'white', 
      color: '#1e3a8a', 
      border: 'none', 
      padding: '14px 28px', 
      borderRadius: '10px', 
      fontWeight: '800', 
      cursor: 'pointer', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '10px', 
      marginTop: '20px',
      width: isMobile ? '100%' : 'auto',
      justifyContent: 'center'
    },
    btnLogout: { 
      backgroundColor: 'transparent', 
      color: '#f87171', 
      border: '1px solid #f87171', 
      padding: isMobile ? '8px' : '10px', 
      borderRadius: '8px', 
      cursor: 'pointer', 
      marginTop: isMobile ? '0' : 'auto', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px',
      fontSize: isMobile ? '0.7rem' : '1rem'
    }
  };

  return (
    <div style={s.container}>
      {/* SIDEBAR / TOPBAR */}
      <aside style={s.sidebar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck color="#60a5fa" size={isMobile ? 24 : 32} />
          <h2 style={{ fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: 'bold', margin: 0 }}>ProctorSecure</h2>
        </div>
        
        {!isMobile && (
          <>
            <Link to="/dashboard" style={s.navLinkActive}><LayoutDashboard size={20} /> Dashboard</Link>
            <Link to="/assignment-list" style={s.navLink}><Folder size={20} /> Assignments</Link>
            <Link to="/history" style={s.navLink}><History size={20} /> History</Link>
            <Link to="/profile" style={s.navLink}><User size={20} /> Profile</Link>
          </>
        )}

        <button onClick={handleLogout} style={s.btnLogout}>
          <LogOut size={18} /> {isMobile ? "Logout" : "Logout Candidate"}
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main style={s.main}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#0f172a', fontSize: isMobile ? '1.4rem' : '2rem' }}>Welcome, Zubair! 👋</h1>
            <p style={{ color: '#64748b', marginTop: '5px', fontSize: isMobile ? '0.8rem' : '1rem' }}>System is ready for exam.</p>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>ZC</div>
        </div>

        {/* STATS */}
        <div style={s.statsGrid}>
          <div style={s.card}>
            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700' }}>PERFORMANCE</span>
            <h2 style={{ margin: '5px 0 0 0' }}>85%</h2>
          </div>
          <div style={{ ...s.card, borderColor: '#10b981' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700' }}>INTEGRITY</span>
            <h2 style={{ margin: '5px 0 0 0', color: '#059669' }}>High</h2>
          </div>
          {!isMobile && (
            <div style={{ ...s.card, borderColor: '#8b5cf6' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700' }}>SESSIONS</span>
              <h2 style={{ margin: '5px 0 0 0' }}>24</h2>
            </div>
          )}
        </div>

        {/* HERO SECTION */}
        <div style={s.hero}>
          <h2 style={{ margin: 0, fontSize: isMobile ? '1.2rem' : '1.5rem' }}>AI Proctoring Active</h2>
          <p style={{ opacity: 0.8, fontSize: isMobile ? '0.85rem' : '1rem', marginTop: '10px' }}>
            Session will be monitored via Camera and Screen.
          </p>
          <button onClick={startExam} style={s.btnStart}>
            <PlayCircle size={22} /> START EXAM
          </button>
        </div>

        {/* SYSTEM STATUS */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: isMobile ? '1rem' : '1.1rem' }}>Readiness Check</h3>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '10px' : '30px' }}>
            <StatusItem text="Camera OK" />
            <StatusItem text="Mic OK" />
            <StatusItem text="Screen OK" />
          </div>
        </div>
      </main>
    </div>
  );
}

// Chota helper component status ke liye
const StatusItem = ({ text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <CheckCircle size={18} color="#10b981" />
    <span style={{ color: '#475569', fontSize: '0.9rem' }}>{text}</span>
  </div>
);

export default Dashboard;