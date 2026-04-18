import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate
} from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Dashboard from "./pages/StudentPanel/Dashboard";
import Register from "./pages/Register";
import Exam from "./pages/StudentPanel/Exam";
import Results from "./pages/StudentPanel/Results";
import Navbar from "./components/Navbar";
import Notifications from "./pages/StudentPanel/Notifications";
import TeacherPanel from "./pages/TeacherPanel/TeacherPanel";
import ProtectedRoute from "./components/ProtectedRoute";
import AssignmentList from "./pages/StudentPanel/AssignmentList"; // Is line ko add karein

// ================= NAVBAR CONTROL =================
const NavbarWrapper = () => {
  const location = useLocation();

  const hideNavbar =
    location.pathname === "/" ||
    location.pathname === "/register";

  return !hideNavbar ? <Navbar /> : null;
};

// ================= MAIN APP =================
function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem("user");
    if (data && data !== "undefined") {
      setUser(JSON.parse(data));
    }
  }, []);

  return (
    <Router>
      {/* Navbar */}
      <NavbarWrapper />

      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* STUDENT DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {user?.role === "student" ? (
                <div style={{ paddingTop: "60px" }}>     
                  <Dashboard />
                </div>
              ) : (
                <Navigate to="/teacher-panel" replace />
              )}
            </ProtectedRoute>
          }
        />

        {/* TEACHER PANEL */}
        <Route
          path="/teacher-panel"
          element={
            <ProtectedRoute>
              {user?.role === "teacher" ? (
                <div style={{ paddingTop: "40px" }}>
                <TeacherPanel />
                </div>
              ) : (
                <Navigate to="/dashboard" replace />
              )}
            </ProtectedRoute>
          }
        />

        {/* NOTIFICATIONS */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <div style={{ paddingTop: "50px" }}> 
                <Notifications />
              </div>
            </ProtectedRoute>
          }
        />

       {/* ✅ ASSIGNMENTS ROUTE (Fixed) */}
<Route
  path="/assignment-list"
  element={
    <ProtectedRoute>
      <div style={{ paddingTop: "60px" }}>
        {/* Sirf h2 nahi, pura component yahan aayega */}
        <AssignmentList /> 
      </div>
    </ProtectedRoute>
  }
/>
        {/* ✅ SCHEDULE ROUTE */}
        <Route
          path="/schedule"
          element={
            <ProtectedRoute>
              <div style={{ paddingTop: "60px", textAlign: "center" }}>
                <h2>Academic Schedule</h2>
              </div>
            </ProtectedRoute>
          }
        />

        {/* EXAM */}
        <Route
          path="/exam"
          element={
            <ProtectedRoute>
              <Exam />
            </ProtectedRoute>
          }
        />

        {/* RESULTS */}
        <Route
          path="/results"
          element={
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          }
        />

        {/* DEFAULT REDIRECT */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;