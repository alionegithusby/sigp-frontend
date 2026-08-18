import { useState } from "react";
import { useParams } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import {
  projectRepository, indicatorRepository, taskRepository, costRepository,
  occurrenceRepository, statusReportRepository, decisionRepository, userRepository,
  categoriaCausaRepository,
} from "../../services/repositories";
import { PERFIS } from "../../constants/roles";
import {
  FASES, ESTADO_TAREFA, ESTADO_OCORRENCIA, PRIORIDADE, NIVEL_IMPACTO,
} from "../../constants/enums";
import { computeEVM, evmSemaforo } from "../../utils/evm";
import { formatAOA, formatDate, formatNumber } from "../../utils/format";
import PageHeader from "../../components/layout/PageHeader";
import Table from "../../components/data/Table";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import StatusReportModal from "../../components/forms/StatusReportModal";
import ChangeRequestModal from "../../components/forms/ChangeRequestModal";
import SemaphoreBadge from "../../components/charts/SemaphoreBadge";
import KpiCard from "../../components/charts/KpiCard";
import Loader from "../../components/feedback/Loader";
import ErrorState from "../../components/feedback/ErrorState";
import Icon from "../../components/ui/Icon";

const TABS = ["Visão Geral", "Tarefas", "Status Reports", "Custos", "Decisões", "Ocorrências"];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const { push } = useToast();
  const [tab, setTab] = useState("Visão Geral");
  const [srOpen, setSrOpen] = useState(false);
  const [crOpen, setCrOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: project, loading, error } = useFetch(() => projectRepository.getById(id), [id, refreshKey]);
  const { data: ind } = useFetch(() => indicatorRepository.list((r) => r.projetoId === id), [id, refreshKey]);
  const { data: tasks } = useFetch(() => taskRepository.list((t) => t.projetoId === id), [id]);
  const { data: costs } = useFetch(() => costRepository.list((c) => c.projetoId === id), [id]);
  const { data: occ } = useFetch(() => occurrenceRepository.list((o) => o.projetoId === id), [id]);
  const { data: reports } = useFetch(() => statusReportRepository.list((r) => r.projetoId === id), [id, refreshKey]);
  const { data: decisions } = useFetch(() => decisionRepository.list((d) => d.projetoId === id), [id]);
  const { data: users } = useFetch(() => userRepository.list(), []);
  const { data: categorias } = useFetch(() => categoriaCausaRepository.list(), []);

  if (loading) return <Loader />;
  if (error) return <ErrorState />;
  if (!project) return <p className="muted">Projecto não encontrado.</p>;

  const evm = ind?.length ? computeEVM(ind[0]) : null;
  const resp = (uid) => users?.find((u) => u.id === uid)?.nome || uid;
  const cat = (cid) => (categorias || []).find((c) => c.id === cid)?.nome || cid;

  const validar = async () => {
    await projectRepository.update(project.id, { validado: true });
    push("Projecto validado.");
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      <PageHeader
        eyebrow={`Projectos · ${project.codigo}`}
        title={project.nome}
        description={`${FASES[project.fase]} · ${project.tipo} · ${project.cliente}`}
        actions={
          <>
            <Button variant="secondary" icon={<Icon name="report" size={16} />} onClick={() => setSrOpen(true)}>Status Report</Button>
            {hasRole([PERFIS.GESTOR]) && (
              <Button variant="secondary" icon={<Icon name="decisions" size={16} />} onClick={() => setCrOpen(true)}>Solicitar Alteração</Button>
            )}
            {!project.validado && hasRole([PERFIS.PROJECT_OWNER]) && (
              <Button icon={<Icon name="tasks" size={16} />} onClick={validar}>Validar</Button>
            )}
          </>
        }
      />
      <StatusReportModal open={srOpen} onClose={() => setSrOpen(false)} projetoId={project.id}
        onSaved={() => setRefreshKey((k) => k + 1)} />
      <ChangeRequestModal open={crOpen} onClose={() => setCrOpen(false)} projeto={project} />

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <SemaphoreBadge value={project.semaforo} size="lg" />
        <Badge tone={project.validado ? "verde" : "amarelo"}>{project.validado ? "Validado" : "Por validar"}</Badge>
        <span className="mono muted">{formatDate(project.dataInicio)} → {formatDate(project.dataFimEstimada)}</span>
      </div>

      {evm && (
        <section className="grid grid-4" style={{ marginBottom: 24 }}>
          <KpiCard label="CPI" value={formatNumber(evm.cpi)} tone={evmSemaforo(evm.cpi).toLowerCase()} hint="custo" />
          <KpiCard label="SPI" value={formatNumber(evm.spi)} tone={evmSemaforo(evm.spi).toLowerCase()} hint="prazo" />
          <KpiCard label="Progresso" value={`${project.progresso}%`} tone="accent" />
          <KpiCard label="Orçamento" value={formatAOA(project.orcamentoPlaneado)} hint={`AC ${formatAOA(evm.AC)}`} />
        </section>
      )}

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab ${t === tab ? "is-active" : ""}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        {tab === "Visão Geral" && (
          <div className="grid grid-2">
            <div className="card" style={{ padding: 20 }}>
              <span className="eyebrow" style={{ display: "block", marginBottom: 12 }}>Ficha do projecto</span>
              <dl className="deflist">
                <div><dt>Código</dt><dd>{project.codigo}</dd></div>
                <div><dt>Direcção</dt><dd>{project.cliente}</dd></div>
                <div><dt>Gestor</dt><dd>{resp(project.gestorId)}</dd></div>
                <div><dt>Fase</dt><dd>{FASES[project.fase]}</dd></div>
                <div><dt>Orçamento planeado</dt><dd className="mono">{formatAOA(project.orcamentoPlaneado)}</dd></div>
              </dl>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <span className="eyebrow" style={{ display: "block", marginBottom: 12 }}>Resumo operacional</span>
              <dl className="deflist">
                <div><dt>Tarefas</dt><dd>{tasks?.length ?? 0}</dd></div>
                <div><dt>Ocorrências abertas</dt><dd>{occ?.filter((o) => o.estado === "PENDENTE").length ?? 0}</dd></div>
                <div><dt>Custos registados</dt><dd className="mono">{formatAOA((costs || []).reduce((s, c) => s + c.valor, 0))}</dd></div>
                <div><dt>Status reports</dt><dd>{reports?.length ?? 0}</dd></div>
                <div><dt>Decisões</dt><dd>{decisions?.length ?? 0}</dd></div>
              </dl>
            </div>
          </div>
        )}

        {tab === "Tarefas" && (
          <Table rowKey="id" rows={tasks || []}
            empty={<Empty>Sem tarefas neste projecto.</Empty>}
            columns={[
              { key: "nome", header: "Tarefa", render: (r) => <strong>{r.nome}</strong> },
              { key: "responsavelId", header: "Responsável", render: (r) => resp(r.responsavelId) },
              { key: "prioridade", header: "Prioridade", render: (r) => <Badge tone={r.prioridade === "ALTA" ? "vermelho" : r.prioridade === "MEDIA" ? "amarelo" : "neutral"}>{PRIORIDADE[r.prioridade]}</Badge> },
              { key: "estado", header: "Estado", render: (r) => <Badge tone={r.estado === "ENCERRADA" ? "verde" : r.estado === "EM_PROGRESSO" ? "amarelo" : r.estado === "CONCLUIDA" ? "accent" : "neutral"}>{ESTADO_TAREFA[r.estado]}</Badge> },
              { key: "dataFim", header: "Prazo", align: "right", render: (r) => <span className="mono">{formatDate(r.dataFim)}</span> },
            ]} />
        )}

        {tab === "Status Reports" && (
          <Table rowKey="id" rows={reports || []}
            empty={<Empty>Sem status reports registados.</Empty>}
            columns={[
              { key: "semana", header: "Semana", render: (r) => <span className="mono">{r.semana}</span> },
              { key: "resumo", header: "Resumo" },
              { key: "progresso", header: "Progresso", align: "right", render: (r) => <span className="mono">{r.progresso}%</span> },
              { key: "semaforo", header: "Semáforo", render: (r) => <SemaphoreBadge value={r.semaforo} /> },
              { key: "data", header: "Data", align: "right", render: (r) => <span className="mono">{formatDate(r.data)}</span> },
            ]} />
        )}

        {tab === "Custos" && (
          <Table rowKey="id" rows={costs || []}
            empty={<Empty>Sem custos registados.</Empty>}
            columns={[
              { key: "tipo", header: "Tipo", render: (r) => <Badge>{r.tipo}</Badge> },
              { key: "valor", header: "Valor", align: "right", render: (r) => <span className="mono">{formatAOA(r.valor)}</span> },
              { key: "dataGasto", header: "Data", render: (r) => <span className="mono">{formatDate(r.dataGasto)}</span> },
              { key: "documento", header: "Documento", render: (r) => r.documento || "—" },
            ]} />
        )}

        {tab === "Decisões" && (
          <Table rowKey="id" rows={decisions || []}
            empty={<Empty>Sem decisões registadas.</Empty>}
            columns={[
              { key: "descricao", header: "Decisão", render: (r) => <strong>{r.descricao}</strong> },
              { key: "participantes", header: "Participantes" },
              { key: "nivelImpacto", header: "Impacto", render: (r) => <Badge tone={r.nivelImpacto === "ALTO" ? "vermelho" : r.nivelImpacto === "MEDIO" ? "amarelo" : "neutral"}>{NIVEL_IMPACTO[r.nivelImpacto]}</Badge> },
              { key: "dataDecisao", header: "Data", align: "right", render: (r) => <span className="mono">{formatDate(r.dataDecisao)}</span> },
            ]} />
        )}

        {tab === "Ocorrências" && (
          <Table rowKey="id" rows={occ || []}
            empty={<Empty>Sem ocorrências registadas.</Empty>}
            columns={[
              { key: "descricao", header: "Ocorrência", render: (r) => <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><strong>{r.descricao}</strong>{r.ehRetrabalho && <Badge tone="vermelho">Retrabalho</Badge>}</span> },
              { key: "categoriaCausaId", header: "Causa", render: (r) => cat(r.categoriaCausaId) },
              { key: "gravidade", header: "Gravidade", render: (r) => <Badge tone={r.gravidade === "BAIXA" ? "neutral" : r.gravidade === "MEDIA" ? "amarelo" : "vermelho"}>{r.gravidade}</Badge> },
              { key: "estado", header: "Estado", render: (r) => <Badge tone={r.estado === "PENDENTE" ? "vermelho" : r.estado === "EM_MITIGACAO" ? "amarelo" : "verde"}>{ESTADO_OCORRENCIA[r.estado]}</Badge> },
            ]} />
        )}
      </div>

      <style>{`
        .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--line); overflow-x: auto; }
        .tab { padding: 10px 14px; font-size: 13.5px; font-weight: 600; color: var(--muted); border-bottom: 2px solid transparent; white-space: nowrap; }
        .tab:hover { color: var(--ink); }
        .tab.is-active { color: var(--ink); border-bottom-color: var(--brand-yellow); }
        .deflist { display: flex; flex-direction: column; gap: 10px; }
        .deflist > div { display: flex; justify-content: space-between; gap: 16px; padding-bottom: 10px; border-bottom: 1px solid var(--line); }
        .deflist > div:last-child { border-bottom: none; padding-bottom: 0; }
        .deflist dt { color: var(--muted); font-size: 13px; }
        .deflist dd { font-weight: 600; font-size: 13.5px; text-align: right; }
      `}</style>
    </>
  );
}

function Empty({ children }) {
  return <div className="card muted" style={{ padding: 20 }}>{children}</div>;
}
