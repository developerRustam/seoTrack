import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../shared/auth/useAuth";


export function ProtectedRoute() {
  const {loading, user} = useAuth();

  if (loading) return null;
  if (user === null) return <Navigate to="/login" replace />;
  return <Outlet />;
}
