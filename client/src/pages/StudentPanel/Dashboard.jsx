import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LayoutDashboard, PlayCircle, LogOut, ShieldCheck, History, User, Folder, CheckCircle } from "lucide-react";

function Dashboard() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Screen size monitor karne ke liye optimized effect
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
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

  // Professional Styles Object (Dynamic based on screen size)
  const s = {
    container: { 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row', 
      height: '100vh', 
      width: '100vw', 
      backgroundColor: '#f8fafc', 
      fontFamily: '"Inter", sans-serif', 
      overflow: isMobile ? 'auto' : 'hidden' 
    },
    sidebar: { 
      width: isMobile ? '100%' : '280px', 
      backgroundColor: '#1e293b', 
      color: 'white', 
      padding: isMobile ? '15px 20px' : '30px 24px', 
      display: 'flex', 
      flexDirection: isMobile ? 'row' : 'column', 
      alignItems: isMobile ? 'center' : 'stretch',
      justifyContent: isMobile ? 'space-between' : 'flex-start',
      boxShadow: '4px 0 15px rgba(0,0,0,0.1)',
      zIndex: 100,
      position: isMobile ? 'sticky' : 'relative',
      top: 0
    },
    main: { 
      flex: 1, 
      padding: isMobile ? '20px' : '40px 60px', 
      overflowY: 'auto',
      width: '100%',
      maxWidth: '1600px', // Laptop par content ko bohot phailne se rokay ga
      margin: '0 auto'
    },
    navLink: { 
      display: isMobile ? 'none' : 'flex', 
      alignItems: 'center', 
      gap: '12px', 
      padding: '14px 16px', 
      color: '#94a3b8', 
      borderRadius: '10px', 
      cursor: 'pointer', 
      marginBottom: '8px', 
      textDecoration: 'none', 
      transition: '0.3s ease',
      fontSize: '0.95rem'
    },
    navLinkActive: { 
      display: 'flex', 
      alignItems: 'center', 
      gap: isMobile ? '6px' : '12px', 
      padding: isMobile ? '8px 15px' : '14px 16px', 
      backgroundColor: '#3b82f6', 
      color: 'white', 
      borderRadius: '10px', 
      textDecoration: 'none',
      fontSize: isMobile ? '0.85rem' : '0.95rem',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
    },
    statsGrid: { 
      display: 'grid', 
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', 
      gap: isMobile ? '12px' : '24px', 
      marginBottom: '32px' 
    },
    card: { 
      backgroundColor: 'white', 
      padding: isMobile ? '15px' : '24px', 
      borderRadius: '16px', 
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', 
      borderLeft: '5px solid #3b82f6',
      transition: 'transform 0.2s'
    },
    hero: { 
      background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 100%)', 
      color: 'white', 
      padding: isMobile ? '30px 20px' : '50px', 
      borderRadius: '24px', 
      marginBottom: '32px',
      textAlign: isMobile ? 'center' : 'left',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
    },
    btnStart: { 
      backgroundColor: 'white', 
      color: '#1e3a8a', 
      border: 'none', 
      padding: '16px 32px', 
      borderRadius: '12px', 
      fontWeight: '800', 
      cursor: 'pointer', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '10px', 
      marginTop: '25px',
      width: isMobile ? '100%' : 'fit-content',
      justifyContent: 'center',
      fontSize: '1rem',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)'
    },
    btnLogout: { 
      backgroundColor: isMobile ? 'transparent' : 'rgba(248, 113, 113, 0.1)', 
      color: '#f87171', 
      border: isMobile ? 'none' : '1px solid rgba(248, 113, 113, 0.3)', 
      padding: isMobile ? '5px' : '12px', 
      borderRadius: '10px', 
      cursor: 'pointer', 
      marginTop: isMobile ? '0' : 'auto', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px',
      justifyContent: 'center',
      fontSize: isMobile ? '0.8rem' : '0.9rem'
    }
  };

  return (
    <div style={s.container}>
      {/* SIDEBAR / TOPBAR */}
      <aside style={s.sidebar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck color="#60a5fa" size={isMobile ? 26 : 34} />
          <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.4rem', fontWeight: '800', margin: 0, letterSpacing: '0.5px' }}>ProctorSecure</h2>
        </div>
        
        {!isMobile && (
          <nav style={{ marginTop: '40px', display: 'flex', flexDirection: 'column' }}>
            <Link to="/dashboard" style={s.navLinkActive}><LayoutDashboard size={20} /> Dashboard</Link>
            <Link to="/assignment-list" style={s.navLink}><Folder size={20} /> Assignments</Link>
            <Link to="/history" style={s.navLink}><History size={20} /> History</Link>
            <Link to="/profile" style={s.navLink}><User size={20} /> Profile</Link>
          </nav>
        )}

        <button onClick={handleLogout} style={s.btnLogout}>
          <LogOut size={isMobile ? 20 : 18} /> {isMobile ? "" : "Logout Candidate"}
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main style={s.main}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#0f172a', fontSize: isMobile ? '1.5rem' : '2.4rem', fontWeight: '800' }}>Welcome back, Zubair! 👋</h1>
            <p style={{ color: '#64748b', marginTop: '8px', fontSize: isMobile ? '0.85rem' : '1.05rem' }}>Your workspace is secure and ready.</p>
          </div>
          <div style={{ width: isMobile ? '45px' : '55px', height: isMobile ? '45px' : '55px', borderRadius: '50%', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#1e293b', border: '3px solid white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            ZC
          </div>
        </header>

        {/* STATS SECTION */}
        <div style={s.statsGrid}>
          <div style={s.card}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Performance</span>
            <h2 style={{ margin: '10px 0 0 0', color: '#1e293b', fontSize: '1.8rem' }}>85%</h2>
          </div>
          <div style={{ ...s.card, borderColor: '#10b981' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Integrity</span>
            <h2 style={{ margin: '10px 0 0 0', color: '#059669', fontSize: '1.8rem' }}>High</h2>
          </div>
          {!isMobile && (
            <div style={{ ...s.card, borderColor: '#8b5cf6' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Sessions</span>
              <h2 style={{ margin: '10px 0 0 0', color: '#1e293b', fontSize: '1.8rem' }}>24</h2>
            </div>
          )}
        </div>

        {/* HERO SECTION */}
        <section style={s.hero}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
             <div style={{ width: '10px', height: '100%', backgroundColor: '#10b981', borderRadius: '5px' }}></div>
             <h2 style={{ margin: 0, fontSize: isMobile ? '1.3rem' : '1.8rem', fontWeight: '700' }}>AI Proctoring Active</h2>
          </div>
          <p style={{ opacity: 0.9, fontSize: isMobile ? '0.9rem' : '1.1rem', maxWidth: '800px', lineHeight: '1.7' }}>
            To maintain exam integrity, we are monitoring your environment. Ensure your camera and microphone are properly positioned.
          </p>
          <button onClick={startExam} style={s.btnStart}>
            <PlayCircle size={24} /> START EXAMINATION
          </button>
        </section>

        {/* READINESS CHECK */}
        <div style={{ backgroundColor: 'white', padding: isMobile ? '20px' : '30px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '1.1rem', fontWeight: '700' }}>System Readiness Check</h3>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '15px' : '40px' }}>
            <StatusItem text="Camera Stream OK" />
            <StatusItem text="Audio Capture Active" />
            <StatusItem text="Screen Sync Ready" />
          </div>
        </div>
      </main>
    </div>
  );
}

const StatusItem = ({ text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <CheckCircle size={22} color="#10b981" />
    <span style={{ color: '#475569', fontSize: '0.95rem', fontWeight: '500' }}>{text}</span>
  </div>
);

export default Dashboard;