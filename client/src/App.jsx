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
import Schedule from "./pages/Schedule";
import AssignmentList from "./pages/StudentPanel/AssignmentList";
import Dashboard from "./pages/StudentPanel/Dashboard";
import Exam from "./pages/StudentPanel/Exam";
import Notifications from "./pages/StudentPanel/Notifications";
import Results from "./pages/StudentPanel/Results";
import TeacherPanel from "./pages/TeacherPanel/TeacherPanel";

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

function App() {
  const user = getStoredUser();

  return (
    <Router>
      <NavbarWrapper />

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
              to={user?.role === "teacher" ? "/teacher-panel" : user?.role === "student" ? "/dashboard" : "/"}
              replace
            />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
