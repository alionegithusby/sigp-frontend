import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import "./LoginPage.css";

const DEMO_PASSWORD = "Sigp@2026";
const DEMO = [
  { label: "Gestor", email: "gestor@sonils.co.ao" },
  { label: "Project Owner", email: "projectowner@sonils.co.ao" },
  { label: "Administrador", email: "admin@sonils.co.ao" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <p className="eyebrow">Acesso ao sistema</p>
      <h2 className="login__title">Iniciar sessão</h2>
      <p className="muted login__sub">Introduz as tuas credenciais para aceder ao painel do teu perfil.</p>

      <div className="login__form">
        <Input
          id="email" label="Email" type="email" placeholder="nome@sonils.co.ao"
          value={email} onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />
        <Input
          id="password" label="Palavra-passe" type="password" placeholder="••••••••"
          value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />
        {error && <div className="login__error">{error}</div>}
        <Button size="lg" loading={loading} onClick={handleLogin}>Entrar</Button>
      </div>

      <div className="login__demo">
        <span className="login__demolabel">Contas de demonstração:</span>
        <div className="login__demogrid">
          {DEMO.map((d) => (
            <button key={d.email} className="login__demobtn" onClick={() => { setEmail(d.email); setPassword(DEMO_PASSWORD); }}>
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
