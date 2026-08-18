import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Bloqueia o acesso a perfis não autorizados.
export default function RoleRoute({ allow = [] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return allow.includes(user.perfil) ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
