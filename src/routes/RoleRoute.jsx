import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { PERFIS } from "../constants/roles";

// Bloqueia o acesso a perfis não autorizados e, opcionalmente, exige uma
// permissão concreta do perfil (Gestor/Project Owner). O Administrador SIG
// nunca é bloqueado por permissão — a visibilidade dele sobre os módulos
// operacionais é só de leitura, por desenho, não por permissão atribuível.
export default function RoleRoute({ allow = [], permission }) {
  const { user, hasPermission } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.perfil)) return <Navigate to="/dashboard" replace />;
  if (permission && user.perfil !== PERFIS.ADMIN && !hasPermission(permission))
    return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
