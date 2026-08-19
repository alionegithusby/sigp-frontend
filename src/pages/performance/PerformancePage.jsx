import { useFetch } from "../../hooks/useFetch";
import { indicatorRepository, projectRepository } from "../../services/repositories";
import { computeEVM, evmSemaforo, aggregateEVM, EVM_GLOSSARY } from "../../utils/evm";
import { formatNumber, formatAOA } from "../../utils/format";
import PageHeader from "../../components/layout/PageHeader";
import Table from "../../components/data/Table";
import KpiCard from "../../components/charts/KpiCard";
import SemaphoreBadge from "../../components/charts/SemaphoreBadge";
import Loader from "../../components/feedback/Loader";
import ErrorState from "../../components/feedback/ErrorState";

const Th = ({ children }) => <span title={EVM_GLOSSARY[children]}>{children}</span>;

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
    { key: "PV", header: <Th>PV</Th>, align: "right", render: (r) => <span className="mono">{formatAOA(r.PV)}</span> },
    { key: "EV", header: <Th>EV</Th>, align: "right", render: (r) => <span className="mono">{formatAOA(r.EV)}</span> },
    { key: "AC", header: <Th>AC</Th>, align: "right", render: (r) => <span className="mono">{formatAOA(r.AC)}</span> },
    { key: "BAC", header: <Th>BAC</Th>, align: "right", render: (r) => <span className="mono">{formatAOA(r.BAC)}</span> },
    { key: "eac", header: <Th>EAC</Th>, align: "right", render: (r) => <span className="mono">{formatAOA(r.eac)}</span> },
    { key: "cpi", header: <Th>CPI</Th>, align: "right", render: (r) => <span className="mono">{formatNumber(r.cpi)}</span> },
    { key: "spi", header: <Th>SPI</Th>, align: "right", render: (r) => <span className="mono">{formatNumber(r.spi)}</span> },
    { key: "sem", header: "Estado", render: (r) => <SemaphoreBadge value={evmSemaforo(Math.min(r.cpi, r.spi))} showLabel={false} /> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Análise" title="Indicadores de Performance"
        description="Valor ganho (EVM) consolidado e por projeto: PV, EV, AC, BAC, EAC, CPI, SPI, CV e SV."
      />
      <section className="grid grid-4" style={{ marginBottom: 24 }}>
        <KpiCard label="CPI Global" value={formatNumber(agg.cpi)} tone={evmSemaforo(agg.cpi).toLowerCase()} hint="custo" title={EVM_GLOSSARY.CPI} />
        <KpiCard label="SPI Global" value={formatNumber(agg.spi)} tone={evmSemaforo(agg.spi).toLowerCase()} hint="prazo" title={EVM_GLOSSARY.SPI} />
        <KpiCard label="CV" value={formatAOA(agg.cv)} tone={agg.cv >= 0 ? "verde" : "vermelho"} hint="variação de custo" title={EVM_GLOSSARY.CV} />
        <KpiCard label="SV" value={formatAOA(agg.sv)} tone={agg.sv >= 0 ? "verde" : "vermelho"} hint="variação de prazo" title={EVM_GLOSSARY.SV} />
      </section>
      <Table columns={columns} rows={rows} rowKey="projetoId" />
    </>
  );
}
