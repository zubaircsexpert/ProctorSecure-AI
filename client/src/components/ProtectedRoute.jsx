import { Navigate } from "react-router-dom";

const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem("user");
    if (!rawUser || rawUser === "undefined") {
      return null;
    }
    return JSON.parse(rawUser);
  } catch (error) {
    console.error("Protected route user parse error:", error);
    return null;
  }
};

function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return (
      <Navigate
        to={
          user.role === "admin"
            ? "/admin-panel"
            : user.role === "teacher"
            ? "/teacher-panel"
            : "/dashboard"
        }
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;
