import { useFetch } from "../../hooks/useFetch";
import { indicatorRepository, projectRepository } from "../../services/repositories";
import { computeEVM, evmSemaforo, aggregateEVM } from "../../utils/evm";
import { formatNumber, formatAOA } from "../../utils/format";
import PageHeader from "../../components/layout/PageHeader";
import Table from "../../components/data/Table";
import KpiCard from "../../components/charts/KpiCard";
import SemaphoreBadge from "../../components/charts/SemaphoreBadge";
import Loader from "../../components/feedback/Loader";
import ErrorState from "../../components/feedback/ErrorState";

export default function PerformancePage() {
  const { data: ind, loading, error } = useFetch(() => indicatorRepository.list(), []);
  const { data: projects } = useFetch(() => projectRepository.list(), []);
  if (loading) return <Loader />;
  if (error) return <ErrorState />;

  const agg = aggregateEVM(ind);
  const proj = (pid) => projects?.find((p) => p.id === pid)?.codigo || pid;

  const rows = ind.map((r) => ({ ...r, ...computeEVM(r) }));
  const columns = [
    { key: "projetoId", header: "Projeto", render: (r) => <strong>{proj(r.projetoId)}</strong> },
    { key: "PV", header: "PV", align: "right", render: (r) => <span className="mono">{formatAOA(r.PV)}</span> },
    { key: "EV", header: "EV", align: "right", render: (r) => <span className="mono">{formatAOA(r.EV)}</span> },
    { key: "AC", header: "AC", align: "right", render: (r) => <span className="mono">{formatAOA(r.AC)}</span> },
    { key: "cpi", header: "CPI", align: "right", render: (r) => <span className="mono">{formatNumber(r.cpi)}</span> },
    { key: "spi", header: "SPI", align: "right", render: (r) => <span className="mono">{formatNumber(r.spi)}</span> },
    { key: "sem", header: "Estado", render: (r) => <SemaphoreBadge value={evmSemaforo(Math.min(r.cpi, r.spi))} showLabel={false} /> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Análise" title="Indicadores de Performance"
        description="Valor ganho (EVM) consolidado e por projeto: PV, EV, AC, CPI, SPI, CV e SV."
      />
      <section className="grid grid-4" style={{ marginBottom: 24 }}>
        <KpiCard label="CPI Global" value={formatNumber(agg.cpi)} tone={evmSemaforo(agg.cpi).toLowerCase()} hint="custo" />
        <KpiCard label="SPI Global" value={formatNumber(agg.spi)} tone={evmSemaforo(agg.spi).toLowerCase()} hint="prazo" />
        <KpiCard label="CV" value={formatAOA(agg.cv)} tone={agg.cv >= 0 ? "verde" : "vermelho"} hint="variação de custo" />
        <KpiCard label="SV" value={formatAOA(agg.sv)} tone={agg.sv >= 0 ? "verde" : "vermelho"} hint="variação de prazo" />
      </section>
      <Table columns={columns} rows={rows} rowKey="projetoId" />
    </>
  );
}
