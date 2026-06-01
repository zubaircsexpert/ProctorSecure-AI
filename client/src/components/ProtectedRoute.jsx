import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  clearAuthSession,
  clearSessionBackgrounded,
  getAuthToken,
  getAuthUser,
  hasBackgroundSessionExpired,
  markSessionBackgrounded,
} from "../utils/authSession";

function ProtectedRoute({ children, allowedRole }) {
  const [expired, setExpired] = useState(() => hasBackgroundSessionExpired());
  const token = getAuthToken();
  const user = getAuthUser();

  useEffect(() => {
    const expireIfNeeded = () => {
      if (hasBackgroundSessionExpired()) {
        clearAuthSession();
        setExpired(true);
        return true;
      }
      return false;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        markSessionBackgrounded();
        return;
      }

      if (!expireIfNeeded()) {
        clearSessionBackgrounded();
      }
    };

    expireIfNeeded();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", markSessionBackgrounded);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", markSessionBackgrounded);
    };
  }, []);

  if (expired || !token || !user) {
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
