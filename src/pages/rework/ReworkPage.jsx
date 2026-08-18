import { useNavigate } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import { occurrenceRepository, taskRepository, projectRepository } from "../../services/repositories";
import { formatDate } from "../../utils/format";
import PageHeader from "../../components/layout/PageHeader";
import Table from "../../components/data/Table";
import KpiCard from "../../components/charts/KpiCard";
import Badge from "../../components/ui/Badge";
import Loader from "../../components/feedback/Loader";
import ErrorState from "../../components/feedback/ErrorState";

export default function ReworkPage() {
  const navigate = useNavigate();
  const { data: occ, loading, error } = useFetch(() => occurrenceRepository.list(), []);
  const { data: tasks } = useFetch(() => taskRepository.list(), []);
  const { data: projects } = useFetch(() => projectRepository.list(), []);
  if (loading) return <Loader />;
  if (error) return <ErrorState />;

  const proj = (pid) => projects?.find((p) => p.id === pid)?.codigo || pid;
  const origemDe = (r) => (occ || []).find((o) => o.id === r.ocorrenciaAnteriorId);
  const retrabalho = occ.filter((o) => o.ehRetrabalho);

  const totalTasks = tasks?.length || 0;
  const rejeitadas = tasks?.filter((t) => t.horasRetrabalho > 0).length || 0;
  const pctRejeitadas = totalTasks ? Math.round((rejeitadas / totalTasks) * 100) : 0;
  const horas = tasks?.reduce((s, t) => s + (t.horasRetrabalho || 0), 0) || 0;

  const columns = [
    { key: "descricao", header: "Ocorrência recorrente", render: (r) => <strong>{r.descricao}</strong> },
    { key: "projetoId", header: "Projecto", render: (r) => proj(r.projetoId) },
    { key: "ocorrenciaAnteriorId", header: "Origem", render: (r) => {
      const o = origemDe(r);
      return (
        <button type="button" onClick={() => o && navigate(`/projects/${o.projetoId}`)}
          title={o ? `Ver origem: ${o.descricao}` : "Origem"}
          style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer" }}>
          <Badge tone="neutral">↩ {o ? o.descricao : r.ocorrenciaAnteriorId}</Badge>
        </button>
      );
    } },
    { key: "data", header: "Reaparição", align: "right", render: (r) => <span className="mono">{formatDate(r.data)}</span> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Análise" title="Retrabalho"
        description="Ocorrências que reaparecem pela mesma causa (RN10–RN12) e o custo acrescido ao cronograma original."
      />
      <section className="grid grid-3" style={{ marginBottom: 24 }}>
        <KpiCard label="Ocorrências de Retrabalho" value={retrabalho.length} tone={retrabalho.length ? "vermelho" : "verde"} />
        <KpiCard label="Tarefas com Retrabalho" value={`${pctRejeitadas}%`} tone={pctRejeitadas ? "amarelo" : "verde"} hint={`${rejeitadas} de ${totalTasks} tarefas`} />
        <KpiCard label="Custo em Horas" value={<span className="mono">{horas} h</span>} tone="vermelho" hint="acrescido ao cronograma" />
      </section>
      <h3 style={{ margin: "8px 0 12px" }}>Ocorrências classificadas como retrabalho</h3>
      <Table columns={columns} rows={retrabalho} empty={<div className="card muted" style={{ padding: 20 }}>Sem retrabalho registado.</div>} />
    </>
  );
}
