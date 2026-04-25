import { useState } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/StudentPanel/Dashboard";
import Exam from "./pages/StudentPanel/Exam";
import Results from "./pages/StudentPanel/Results";
import Notifications from "./pages/StudentPanel/Notifications";
import AssignmentList from "./pages/StudentPanel/AssignmentList";
import TeacherPanel from "./pages/TeacherPanel/TeacherPanel";

const NAVBAR_OFFSET = 104;

const NavbarWrapper = () => {
  const location = useLocation();
  const hideNavbar = location.pathname === "/" || location.pathname === "/register";

  return hideNavbar ? null : <Navbar />;
};

const PageShell = ({ children, top = NAVBAR_OFFSET, style = {} }) => (
  <div
    style={{
      minHeight: "100vh",
      paddingTop: `${top}px`,
      boxSizing: "border-box",
      width: "100%",
      ...style,
    }}
  >
    {children}
  </div>
);

function App() {
  const [user] = useState(() => {
    try {
      const data = localStorage.getItem("user");
      if (data && data !== "undefined") {
        return JSON.parse(data);
      }
    } catch (err) {
      console.error("Failed to parse saved user:", err);
    }
    return null;
  });

  return (
    <Router>
      <NavbarWrapper />

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {user?.role === "student" ? (
                <PageShell>
                  <Dashboard />
                </PageShell>
              ) : (
                <Navigate to="/teacher-panel" replace />
              )}
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher-panel"
          element={
            <ProtectedRoute>
              {user?.role === "teacher" ? (
                <PageShell>
                  <TeacherPanel />
                </PageShell>
              ) : (
                <Navigate to="/dashboard" replace />
              )}
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <PageShell>
                <Notifications />
              </PageShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/assignment-list"
          element={
            <ProtectedRoute>
              <PageShell>
                <AssignmentList />
              </PageShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/schedule"
          element={
            <ProtectedRoute>
              <PageShell>
                <div
                  style={{
                    minHeight: "calc(100vh - 104px)",
                    display: "grid",
                    placeItems: "center",
                    padding: "24px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "720px",
                      padding: "36px",
                      borderRadius: "28px",
                      background: "rgba(255,255,255,0.92)",
                      boxShadow: "0 24px 48px rgba(15, 23, 42, 0.08)",
                    }}
                  >
                    <div
                      style={{
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        fontSize: "12px",
                        color: "#7c3aed",
                        marginBottom: "12px",
                      }}
                    >
                      Academic Calendar
                    </div>
                    <h2 style={{ margin: 0, fontSize: "clamp(30px, 5vw, 48px)" }}>
                      Schedule module is ready for your next update
                    </h2>
                    <p style={{ margin: "14px 0 0 0", color: "#64748b" }}>
                      We kept this page clean and aligned below the navbar so future
                      timetable content can drop in without layout overlap.
                    </p>
                  </div>
                </div>
              </PageShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/exam"
          element={
            <ProtectedRoute>
              <PageShell>
                <Exam />
              </PageShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/results"
          element={
            <ProtectedRoute>
              <PageShell>
                <Results />
              </PageShell>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
