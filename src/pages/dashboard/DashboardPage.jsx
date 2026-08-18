import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useFetch } from "../../hooks/useFetch";
import { PERFIS } from "../../constants/roles";
import { FASES } from "../../constants/enums";
import {
  projectRepository, occurrenceRepository, indicatorRepository,
  statusReportRepository, taskRepository, costRepository,
} from "../../services/repositories";
import { deriveEvmSeries } from "../../services/derive";
import { aggregateEVM, evmSemaforo } from "../../utils/evm";
import { formatNumber, formatAOA } from "../../utils/format";

import PageHeader from "../../components/layout/PageHeader";
import KpiCard from "../../components/charts/KpiCard";
import SemaphoreBadge from "../../components/charts/SemaphoreBadge";
import Donut from "../../components/charts/Donut";
import SCurve from "../../components/charts/SCurve";
import Loader from "../../components/feedback/Loader";
import ErrorState from "../../components/feedback/ErrorState";
import Icon from "../../components/ui/Icon";
import "./DashboardPage.css";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: projects, loading: lp, error: ep } = useFetch(() => projectRepository.list(), []);
  const { data: occ, loading: lo, error: eo } = useFetch(() => occurrenceRepository.list(), []);
  const { data: ind, loading: li, error: ei } = useFetch(() => indicatorRepository.list(), []);
  const { data: reports, loading: lr, error: er } = useFetch(() => statusReportRepository.list(), []);
  const { data: tasks, loading: lt, error: et } = useFetch(() => taskRepository.list(), []);
  const { data: costs, loading: lc, error: ec } = useFetch(() => costRepository.list(), []);

  if (lp || lo || li || lr || lt || lc) return <Loader label="A preparar o painel…" />;
  if (ep || eo || ei || er || et || ec) return <ErrorState />;

  const evmSeries = deriveEvmSeries(projects, costs, reports);

  const isAdmin = user.perfil === PERFIS.ADMIN;
  const ativos = projects.filter((p) => p.fase !== "ENCERRAMENTO");
  const concluidos = projects.filter((p) => p.fase === "ENCERRAMENTO");
  const abertas = occ.filter((o) => o.estado === "PENDENTE");
  const retrabalho = occ.filter((o) => o.ehRetrabalho);
  const semReport = ativos.filter(
    (p) => !(reports || []).some((sr) => sr.projetoId === p.id)
  );
  const evm = aggregateEVM(ind);
  const criticos = projects.filter((p) => p.semaforo !== "VERDE" && p.fase !== "ENCERRAMENTO");

  const taskByState = ["PENDENTE", "EM_PROGRESSO", "CONCLUIDA", "ENCERRADA", "CANCELADA"].map((s) => ({
    label: { PENDENTE: "Pendente", EM_PROGRESSO: "Em progresso", CONCLUIDA: "Concluída", ENCERRADA: "Encerrada", CANCELADA: "Cancelada" }[s],
    value: tasks.filter((t) => t.estado === s).length,
    color: { PENDENTE: "var(--muted)", EM_PROGRESSO: "var(--ink)", CONCLUIDA: "var(--accent)", ENCERRADA: "var(--verde)", CANCELADA: "var(--vermelho)" }[s],
  })).filter((x) => x.value > 0);

  return (
    <>
      <PageHeader
        eyebrow={`Bem-vindo, ${user.nome.split(" ")[0]}`}
        title="Painel de Controlo"
        description={
          isAdmin
            ? "Estado da administração do SIGP: utilizadores, dados mestres e auditoria."
            : "Saúde do portefólio, desvios de custo e cronograma, e pontos que exigem atenção."
        }
      />

      {/* ---- KPIs ---- */}
      <section className="grid grid-4 dash__kpis">
        <KpiCard label="Projectos Activos" value={ativos.length} tone="accent" hint={`${concluidos.length} concluídos`} icon={<Icon name="projects" size={18} />} />
        {!isAdmin && <KpiCard label="Ocorrências Abertas" value={abertas.length} tone={abertas.length ? "vermelho" : "verde"} hint={`${retrabalho.length} de retrabalho`} icon={<Icon name="occurrences" size={18} />} />}
        {!isAdmin && <KpiCard label="Status Reports em Falta" value={semReport.length} tone={semReport.length ? "amarelo" : "verde"} hint="projectos activos sem report" icon={<Icon name="report" size={18} />} />}
        {!isAdmin && <KpiCard label="Custo Real (AC)" value={formatAOA(evm.AC)} hint={`Orçado ${formatAOA(evm.PV)}`} icon={<Icon name="costs" size={18} />} />}
        {isAdmin && <KpiCard label="Projectos no Sistema" value={projects.length} icon={<Icon name="projects" size={18} />} />}
        {isAdmin && <KpiCard label="Ocorrências Registadas" value={occ.length} icon={<Icon name="occurrences" size={18} />} />}
      </section>

      {!isAdmin && (
        <>
          {/* ---- Indicadores EVM ---- */}
          <section className="grid grid-2 dash__evm">
            <div className="card dash__panel">
              <div className="dash__panelhead">
                <span className="eyebrow">Desempenho EVM · Portefólio</span>
                <SemaphoreBadge value={evmSemaforo(Math.min(evm.cpi, evm.spi))} size="md" />
              </div>
              <div className="dash__gauges">
                <Gauge label="CPI" value={formatNumber(evm.cpi)} sem={evmSemaforo(evm.cpi)} caption="Eficiência de custo" />
                <Gauge label="SPI" value={formatNumber(evm.spi)} sem={evmSemaforo(evm.spi)} caption="Eficiência de prazo" />
                <Gauge label="CV" value={formatAOA(evm.cv)} sem={evm.cv >= 0 ? "VERDE" : "VERMELHO"} caption="Variação de custo" mono={false} />
                <Gauge label="SV" value={formatAOA(evm.sv)} sem={evm.sv >= 0 ? "VERDE" : "VERMELHO"} caption="Variação de prazo" mono={false} />
              </div>
            </div>

            <div className="card dash__panel">
              <span className="eyebrow">Curva-S · PV vs EV vs AC (% acumulada)</span>
              <SCurve series={evmSeries} />
            </div>
          </section>

          {/* ---- Alertas + Semáforos + Ocorrências ---- */}
          <section className="grid grid-2 dash__lists">
            <div className="card dash__panel">
              <span className="eyebrow">Projectos que exigem atenção</span>
              <ul className="dash__semlist">
                {criticos.length === 0 && <li className="muted dash__none">Todos os projectos activos em Verde.</li>}
                {criticos.map((p) => (
                  <li key={p.id} className="dash__semitem" onClick={() => navigate(`/projects/${p.id}`)}>
                    <div>
                      <strong>{p.codigo}</strong>
                      <span className="muted"> · {p.nome}</span>
                      <div className="dash__phase">{FASES[p.fase]} · {p.progresso}%</div>
                    </div>
                    <SemaphoreBadge value={p.semaforo} showLabel={false} />
                  </li>
                ))}
              </ul>
            </div>

            <div className="card dash__panel">
              <span className="eyebrow">Distribuição de tarefas</span>
              <div className="dash__donut"><Donut segments={taskByState} /></div>
            </div>
          </section>
        </>
      )}
    </>
  );
}

function Gauge({ label, value, sem, caption, mono = true }) {
  return (
    <div className={`gauge gauge--${sem}`}>
      <span className="gauge__label">{label}</span>
      <span className={`gauge__value ${mono ? "mono" : ""}`}>{value}</span>
      <span className="gauge__caption">{caption}</span>
    </div>
  );
}
