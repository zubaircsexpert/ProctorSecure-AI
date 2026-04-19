import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LayoutDashboard, PlayCircle, LogOut, ShieldCheck, History, User, Folder, CheckCircle } from "lucide-react";

function Dashboard() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 850);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 850);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const startExam = () => {
    navigate("/exam");
  };

  const s = {
    container: { 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row', 
      minHeight: '100vh', 
      width: '100%', // Fixed: 100vw ki wajah se scroll aata hai
      backgroundColor: '#f8fafc', 
      fontFamily: '"Inter", sans-serif',
      boxSizing: 'border-box'
    },
    sidebar: { 
      width: isMobile ? '100%' : '260px', 
      backgroundColor: '#1e293b', 
      color: 'white', 
      padding: isMobile ? '10px 15px' : '25px', 
      display: 'flex', 
      flexDirection: isMobile ? 'row' : 'column', 
      alignItems: isMobile ? 'center' : 'stretch',
      justifyContent: isMobile ? 'space-between' : 'flex-start',
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
      zIndex: 100,
      position: isMobile ? 'sticky' : 'relative',
      top: 0,
      boxSizing: 'border-box'
    },
    main: { 
      flex: 1, 
      padding: isMobile ? '15px' : '30px 40px', 
      width: '100%',
      boxSizing: 'border-box', // Padding ko width ke andar rakhne ke liye
      overflowX: 'hidden' // Mobile screen se bahar jane se rokne ke liye
    },
    navLink: { 
      display: isMobile ? 'none' : 'flex', 
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
      padding: isMobile ? '6px 12px' : '12px 16px', 
      backgroundColor: '#3b82f6', 
      color: 'white', 
      borderRadius: '8px', 
      textDecoration: 'none',
      fontSize: isMobile ? '0.8rem' : '1rem'
    },
    statsGrid: { 
      display: 'grid', 
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))', 
      gap: isMobile ? '10px' : '20px', 
      marginBottom: '25px' 
    },
    card: { 
      backgroundColor: 'white', 
      padding: isMobile ? '15px' : '20px', 
      borderRadius: '12px', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)', 
      borderLeft: '4px solid #3b82f6' 
    },
    hero: { 
      background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 100%)', 
      color: 'white', 
      padding: isMobile ? '20px' : '40px', 
      borderRadius: '16px', 
      marginBottom: '25px',
      textAlign: isMobile ? 'center' : 'left',
      boxSizing: 'border-box'
    },
    btnStart: { 
      backgroundColor: 'white', 
      color: '#1e3a8a', 
      border: 'none', 
      padding: '12px 24px', 
      borderRadius: '8px', 
      fontWeight: '700', 
      cursor: 'pointer', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '10px', 
      marginTop: '15px',
      width: isMobile ? '100%' : 'auto',
      justifyContent: 'center'
    },
    btnLogout: { 
      backgroundColor: 'transparent', 
      color: '#f87171', 
      border: isMobile ? 'none' : '1px solid #f87171', 
      padding: '8px 12px', 
      borderRadius: '8px', 
      cursor: 'pointer', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '5px',
      fontSize: isMobile ? '0.75rem' : '1rem'
    }
  };

  return (
    <div style={s.container}>
      <aside style={s.sidebar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck color="#60a5fa" size={isMobile ? 22 : 30} />
          <h2 style={{ fontSize: isMobile ? '0.9rem' : '1.2rem', fontWeight: 'bold', margin: 0 }}>ProctorSecure</h2>
        </div>
        
        {!isMobile && (
          <nav style={{marginTop: '20px'}}>
            <Link to="/dashboard" style={s.navLinkActive}><LayoutDashboard size={18} /> Dashboard</Link>
            <Link to="/assignment-list" style={s.navLink}><Folder size={18} /> Assignments</Link>
            <Link to="/history" style={s.navLink}><History size={18} /> History</Link>
            <Link to="/profile" style={s.navLink}><User size={18} /> Profile</Link>
          </nav>
        )}

        <button onClick={handleLogout} style={s.btnLogout}>
          <LogOut size={16} /> {isMobile ? "" : "Logout"}
        </button>
      </aside>

      <main style={s.main}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#0f172a', fontSize: isMobile ? '1.2rem' : '2rem' }}>Hi, Zubair! 👋</h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.8rem' }}>System is secure.</p>
          </div>
          <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>ZC</div>
        </div>

        <div style={s.statsGrid}>
          <div style={s.card}>
            <p style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '800', margin: 0 }}>PERFORMANCE</p>
            <h3 style={{ margin: '5px 0 0 0' }}>85%</h3>
          </div>
          <div style={{ ...s.card, borderLeftColor: '#10b981' }}>
            <p style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '800', margin: 0 }}>INTEGRITY</p>
            <h3 style={{ margin: '5px 0 0 0', color: '#059669' }}>High</h3>
          </div>
        </div>

        <div style={s.hero}>
          <h2 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.5rem' }}>AI Proctoring Active</h2>
          <p style={{ opacity: 0.9, fontSize: '0.8rem', marginTop: '8px' }}>Monitoring via Camera & Screen.</p>
          <button onClick={startExam} style={s.btnStart}>
            <PlayCircle size={20} /> START EXAM
          </button>
        </div>

        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>Readiness Check</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <StatusItem text="Camera OK" />
            <StatusItem text="Mic OK" />
            <StatusItem text="Screen OK" />
          </div>
        </div>
      </main>
    </div>
  );
}

const StatusItem = ({ text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <CheckCircle size={16} color="#10b981" />
    <span style={{ color: '#475569', fontSize: '0.85rem' }}>{text}</span>
  </div>
);

export default Dashboard;