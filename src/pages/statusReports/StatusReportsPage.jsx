import { useEffect, useState } from "react";
import { statusReportRepository, projectRepository } from "../../services/repositories";
import { PERFIS } from "../../constants/roles";
import { useAuth } from "../../hooks/useAuth";
import { formatDate, formatWeek } from "../../utils/format";
import PageHeader from "../../components/layout/PageHeader";
import Table from "../../components/data/Table";
import Button from "../../components/ui/Button";
import StatusReportModal from "../../components/forms/StatusReportModal";
import SemaphoreBadge from "../../components/charts/SemaphoreBadge";
import Loader from "../../components/feedback/Loader";
import ErrorState from "../../components/feedback/ErrorState";
import Icon from "../../components/ui/Icon";

export default function StatusReportsPage() {
  const { hasRole } = useAuth();
  const podeGerir = hasRole([PERFIS.GESTOR]);
  const [rows, setRows] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    Promise.all([statusReportRepository.list(), projectRepository.list((p) => p.estado === "ATIVO")])
      .then(([sr, pr]) => { setRows(sr); setProjects(pr); })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const proj = (pid) => projects.find((p) => p.id === pid)?.codigo || pid;

  if (loading) return <Loader />;
  if (error) return <ErrorState />;

  const columns = [
    { key: "projetoId", header: "Projecto", render: (r) => <strong>{proj(r.projetoId)}</strong> },
    { key: "semana", header: "Semana", render: (r) => <span className="mono">{formatWeek(r.semana)}</span> },
    { key: "resumo", header: "Resumo" },
    { key: "progresso", header: "Progresso", align: "right", render: (r) => <span className="mono">{r.progresso}%</span> },
    { key: "semaforo", header: "Semáforo", render: (r) => <SemaphoreBadge value={r.semaforo} /> },
    { key: "data", header: "Data", align: "right", render: (r) => <span className="mono">{formatDate(r.data)}</span> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Operação" title="Status Reports"
        description="Relatório semanal obrigatório para todo projecto em execução (RN03), com semáforo e progresso acumulado."
        actions={podeGerir && <Button icon={<Icon name="plus" size={16} />} onClick={() => setOpen(true)}>Registar Status Report</Button>}
      />
      <Table columns={columns} rows={rows} />

      <StatusReportModal open={open} onClose={() => setOpen(false)} projetos={projects}
        onSaved={(rec) => setRows((r) => [rec, ...r])} />
    </>
  );
}
