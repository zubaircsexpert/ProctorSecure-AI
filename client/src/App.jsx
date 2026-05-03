import { lazy, Suspense } from "react";
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

const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const Schedule = lazy(() => import("./pages/Schedule"));
const AssignmentList = lazy(() => import("./pages/StudentPanel/AssignmentList"));
const AiTutor = lazy(() => import("./pages/StudentPanel/AiTutor"));
const Dashboard = lazy(() => import("./pages/StudentPanel/Dashboard"));
const Exam = lazy(() => import("./pages/StudentPanel/Exam"));
const Notifications = lazy(() => import("./pages/StudentPanel/Notifications"));
const PerformanceAnalytics = lazy(() => import("./pages/StudentPanel/PerformanceAnalytics"));
const Results = lazy(() => import("./pages/StudentPanel/Results"));
const StudyVault = lazy(() => import("./pages/StudentPanel/StudyVault"));
const SystemChecks = lazy(() => import("./pages/StudentPanel/SystemChecks"));
const StudyVaultManager = lazy(() => import("./pages/TeacherPanel/StudyVaultManager"));
const TeacherPanel = lazy(() => import("./pages/TeacherPanel/TeacherPanel"));

const NAVBAR_OFFSET = 104;

const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem("user");
    if (!rawUser || rawUser === "undefined") {
      return null;
    }
    return JSON.parse(rawUser);
  } catch (error) {
    console.error("Stored user parse error:", error);
    return null;
  }
};

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

const PageLoader = () => (
  <div
    style={{
      minHeight: "calc(100vh - 104px)",
      display: "grid",
      placeItems: "center",
      color: "#334155",
      fontWeight: 800,
      background: "linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)",
    }}
  >
    Loading workspace...
  </div>
);

function App() {
  const user = getStoredUser();

  return (
    <Router>
      <NavbarWrapper />

      <Suspense fallback={<PageShell><PageLoader /></PageShell>}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <PageShell>
                <Dashboard />
              </PageShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher-panel"
          element={
            <ProtectedRoute allowedRole="teacher">
              <PageShell>
                <TeacherPanel />
              </PageShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher-study-vault"
          element={
            <ProtectedRoute allowedRole="teacher">
              <PageShell>
                <StudyVaultManager />
              </PageShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-panel"
          element={
            <ProtectedRoute allowedRole="admin">
              <PageShell>
                <AdminPanel />
              </PageShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRole="student">
              <PageShell>
                <Notifications />
              </PageShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/assignment-list"
          element={
            <ProtectedRoute allowedRole="student">
              <PageShell>
                <AssignmentList />
              </PageShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ai-tutor"
          element={
            <ProtectedRoute allowedRole="student">
              <PageShell>
                <AiTutor />
              </PageShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/study-vault"
          element={
            <ProtectedRoute allowedRole="student">
              <PageShell>
                <StudyVault />
              </PageShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/system-checks"
          element={
            <ProtectedRoute allowedRole="student">
              <PageShell>
                <SystemChecks />
              </PageShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/performance-analytics"
          element={
            <ProtectedRoute allowedRole="student">
              <PageShell>
                <PerformanceAnalytics />
              </PageShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/schedule"
          element={
            <ProtectedRoute>
              <PageShell>
                <Schedule />
              </PageShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/exam"
          element={
            <ProtectedRoute allowedRole="student">
              <PageShell>
                <Exam />
              </PageShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/quiz"
          element={
            <ProtectedRoute allowedRole="student">
              <PageShell>
                <Exam assessmentFilter="quiz" />
              </PageShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/results"
          element={
            <ProtectedRoute allowedRole="student">
              <PageShell>
                <Results />
              </PageShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to={
                user?.role === "admin"
                  ? "/admin-panel"
                  : user?.role === "teacher"
                  ? "/teacher-panel"
                  : user?.role === "student"
                  ? "/dashboard"
                  : "/"
              }
              replace
            />
          }
        />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
