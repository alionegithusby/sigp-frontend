import { useEffect, useState } from "react";
import { auditRepository, userRepository } from "../../services/repositories";
import { formatDateTime } from "../../utils/format";
import PageHeader from "../../components/layout/PageHeader";
import Table from "../../components/data/Table";
import Select from "../../components/ui/Select";
import Badge from "../../components/ui/Badge";
import Loader from "../../components/feedback/Loader";
import ErrorState from "../../components/feedback/ErrorState";

const acaoTone = { CRIAR: "verde", EDITAR: "amarelo", ELIMINAR: "vermelho" };

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fUser, setFUser] = useState("");
  const [fAcao, setFAcao] = useState("");

  useEffect(() => {
    Promise.all([auditRepository.list(), userRepository.list()])
      .then(([l, u]) => { setLogs(l); setUsers(u); })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (error) return <ErrorState />;
  const nome = (uid) => users.find((u) => u.id === uid)?.nome || uid;
  const filtered = logs.filter((l) => (!fUser || l.utilizadorId === fUser) && (!fAcao || l.acao === fAcao));

  const columns = [
    { key: "data", header: "Data / Hora", render: (r) => <span className="mono">{formatDateTime(r.data)}</span> },
    { key: "utilizadorId", header: "Utilizador", render: (r) => nome(r.utilizadorId) },
    { key: "acao", header: "Acção", render: (r) => <Badge tone={acaoTone[r.acao] || "neutral"}>{r.acao}</Badge> },
    { key: "entidade", header: "Entidade" },
    { key: "detalhe", header: "Detalhe" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Administração" title="Auditoria"
        description="Trilha cronológica de todas as operações realizadas no sistema (RN15), ordenada da mais recente."
      />
      <div className="card" style={{ padding: 16, marginBottom: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ minWidth: 200 }}>
          <Select label="Utilizador" value={fUser} onChange={(e) => setFUser(e.target.value)}
            options={[{ value: "", label: "Todos" }, ...users.map((u) => ({ value: u.id, label: u.nome }))]} />
        </div>
        <div style={{ minWidth: 200 }}>
          <Select label="Acção" value={fAcao} onChange={(e) => setFAcao(e.target.value)}
            options={[{ value: "", label: "Todas" }, "CRIAR", "EDITAR", "ELIMINAR"]} />
        </div>
      </div>
      <Table columns={columns} rows={filtered} empty={<div className="card muted" style={{ padding: 20 }}>Sem registos para os filtros.</div>} />
    </>
  );
}
