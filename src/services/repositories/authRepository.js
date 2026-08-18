import { pb } from "../http/pocketbase";
import { perfilToCode } from "./adapters";

// Constrói a shape de utilizador que o AuthContext/telas esperam.
function toAuthUser(record) {
  const perfilRec = record.expand?.perfil;
  const permissoes = (perfilRec?.expand?.permissao || [])
    .map((p) => p.nome || p.codigo)
    .filter(Boolean);
  return {
    id: record.id,
    nome: record.nome || record.name || record.email,
    email: record.email,
    perfil: perfilToCode(perfilRec?.name || record.perfil),
    estado: String(record.estado || "ativo").toUpperCase(),
    permissoes,
  };
}

export const authRepository = {
  login: async (email, password) => {
    const auth = await pb
      .collection("users")
      .authWithPassword(email.trim(), password, { expand: "perfil.permissao" });
    if (String(auth.record.estado || "ativo").toLowerCase() === "inativo") {
      pb.authStore.clear();
      throw new Error("Conta inativa. Contacte o Administrador SIG.");
    }
    const user = toAuthUser(auth.record);
    if (!user.perfil) {
      pb.authStore.clear();
      throw new Error("Perfil de utilizador não reconhecido. Contacte o Administrador SIG.");
    }
    return user;
  },
  logout: async () => {
    pb.authStore.clear();
    return true;
  },
  // Sessão persistida (pb.authStore restaura do localStorage).
  current: () => (pb.authStore.isValid && pb.authStore.record ? toAuthUser(pb.authStore.record) : null),
};
