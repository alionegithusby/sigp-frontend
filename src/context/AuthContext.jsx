import { createContext, useState, useCallback } from "react";
import { authRepository } from "../services/repositories/authRepository";

// Default seguro (utilizador não autenticado) para o caso raro de um consumidor
// renderizar antes do Provider montar (ex.: durante hot-reload em desenvolvimento).
const DEFAULT_CONTEXT = {
  user: null,
  login: async () => { throw new Error("AuthProvider não montado."); },
  logout: async () => {},
  hasRole: () => false,
  hasPermission: () => false,
};

export const AuthContext = createContext(DEFAULT_CONTEXT);

const STORAGE_KEY = "sigp_user";

export function AuthProvider({ children }) {
  // Sessão persistida: pb.authStore restaura o token do localStorage;
  // authRepository.current() reconstrói o utilizador. Fallback: cópia guardada.
  const [user, setUser] = useState(() => {
    try {
      const restored = authRepository.current ? authRepository.current() : null;
      if (restored) return restored;
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email, password) => {
    const logged = await authRepository.login(email, password);
    setUser(logged);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logged));
    return logged;
  }, []);

  const logout = useCallback(async () => {
    await authRepository.logout();
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const hasRole = useCallback(
    (roles) => (roles ? roles.includes(user?.perfil) : true),
    [user]
  );

  // RBAC fino: users -> perfil -> permissoes.
  const hasPermission = useCallback(
    (perm) => {
      if (!perm) return true;
      const list = user?.permissoes || [];
      return Array.isArray(perm) ? perm.some((p) => list.includes(p)) : list.includes(perm);
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}
