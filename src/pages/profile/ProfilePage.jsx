import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { authRepository } from "../../services/repositories/authRepository";
import { PERFIL_LABEL } from "../../constants/roles";
import PageHeader from "../../components/layout/PageHeader";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

const EMPTY = { oldPassword: "", password: "", passwordConfirm: "" };

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.oldPassword || !form.password || !form.passwordConfirm)
      return push("Preencha a password actual e a nova password.", "error");
    if (form.password.length < 8) return push("A nova password deve ter pelo menos 8 caracteres.", "error");
    if (form.password !== form.passwordConfirm) return push("A confirmação não coincide com a nova password.", "error");
    setSaving(true);
    try {
      await authRepository.changePassword(user.id, form.oldPassword, form.password, form.passwordConfirm);
      // O PocketBase invalida a sessão actual ao mudar a password (rotação do
      // token) — termina a sessão e pede novo login para evitar um estado
      // "autenticado" mas com o token inválido (listas silenciosamente vazias).
      await logout();
      push("Password alterada. Inicie sessão novamente com a nova password.");
      navigate("/login");
    } catch {
      push("Não foi possível alterar a password. Verifique a password actual.", "error");
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="A minha conta" title="Perfil"
        description="Dados da conta e alteração de password."
      />
      <div className="card" style={{ padding: 24, maxWidth: 520, marginBottom: 20 }}>
        <dl className="deflist">
          <div><dt>Nome</dt><dd>{user?.nome}</dd></div>
          <div><dt>Email</dt><dd>{user?.email}</dd></div>
          <div><dt>Perfil</dt><dd>{PERFIL_LABEL[user?.perfil]}</dd></div>
        </dl>
      </div>

      <div className="card" style={{ padding: 24, maxWidth: 520 }}>
        <span className="eyebrow" style={{ display: "block", marginBottom: 16 }}>Alterar Password</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input label="Password actual" type="password" value={form.oldPassword}
            onChange={(e) => setForm({ ...form, oldPassword: e.target.value })} />
          <Input label="Nova password" type="password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="mínimo 8 caracteres" />
          <Input label="Confirmar nova password" type="password" value={form.passwordConfirm}
            onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })} />
          <div>
            <Button onClick={submit} loading={saving}>Alterar Password</Button>
          </div>
        </div>
      </div>
    </>
  );
}
