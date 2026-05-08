import { Navigate } from "react-router-dom";
import { getAuthToken, getAuthUser } from "../utils/authSession";

function ProtectedRoute({ children, allowedRole }) {
  const token = getAuthToken();
  const user = getAuthUser();

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
