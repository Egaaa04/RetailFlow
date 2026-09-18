import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getCurrentUser } from "../services/authService";

function ProtectedRoute() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const verifyAuthentication = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setAuthenticated(false);
        setChecking(false);
        return;
      }

      try {
        const result = await getCurrentUser();

        if (result.success) {
            setAuthenticated(true);

            if (result.user) {
                localStorage.setItem(
                "user",
                JSON.stringify(result.user)
                );
            }
        } else {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");

          setAuthenticated(false);
        }
      } catch (error) {
        console.error(error);

        localStorage.removeItem("access_token");
        localStorage.removeItem("user");

        setAuthenticated(false);
      } finally {
        setChecking(false);
      }
    };

    verifyAuthentication();
  }, []);

  if (checking) {
    return <div>Memeriksa autentikasi...</div>;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;