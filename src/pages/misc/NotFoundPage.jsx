import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center", padding: 24 }}>
      <div>
        <p className="eyebrow">Erro 404</p>
        <h1 style={{ fontSize: 40, margin: "8px 0" }}>Página não encontrada</h1>
        <p className="muted" style={{ marginBottom: 20 }}>O endereço que procuras não existe no SIGP.</p>
        <Link to="/dashboard"><Button>Voltar ao Dashboard</Button></Link>
      </div>
    </div>
  );
}
