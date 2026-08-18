import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { PERFIS } from "../../constants/roles";
import { useToast } from "../../context/ToastContext";
import {
  projectRepository, costRepository, taskRepository, occurrenceRepository, indicatorRepository,
} from "../../services/repositories";
import { computeEVM } from "../../utils/evm";
import { formatAOA, formatDate } from "../../utils/format";
import { exportCSV, exportPrintable } from "../../utils/export";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";

const OPERACIONAIS = [
  {
    nome: "Custos Acumulados", desc: "Despesas reais por projecto e categoria.",
    fetch: async () => (await costRepository.list()).map((c) => ({ ...c })),
    columns: [
      { header: "Projecto", value: (r) => r.projetoId },
      { header: "Tipo", value: (r) => r.tipo },
      { header: "Valor", value: (r) => formatAOA(r.valor) },
      { header: "Data", value: (r) => formatDate(r.dataGasto) },
    ],
  },
  {
    nome: "Desvio de Cronograma", desc: "Comparação entre datas planeadas e reais.",
    fetch: async () => projectRepository.list(),
    columns: [
      { header: "Código", value: (r) => r.codigo },
      { header: "Projecto", value: (r) => r.nome },
      { header: "Início", value: (r) => formatDate(r.dataInicio) },
      { header: "Fim estimado", value: (r) => formatDate(r.dataFimEstimada) },
      { header: "Progresso", value: (r) => `${r.progresso}%` },
    ],
  },
  {
    nome: "Progresso das Tarefas", desc: "Estado e nível de conclusão por projecto.",
    fetch: async () => taskRepository.list(),
    columns: [
      { header: "Tarefa", value: (r) => r.nome },
      { header: "Estado", value: (r) => r.estado },
      { header: "Prioridade", value: (r) => r.prioridade },
      { header: "Prazo", value: (r) => formatDate(r.dataFim) },
    ],
  },
];

const EXECUTIVOS = [
  {
    nome: "Evolução da Carteira", desc: "Saúde e avanço do portefólio ao longo do tempo.",
    fetch: async () => projectRepository.list(),
    columns: [
      { header: "Código", value: (r) => r.codigo },
      { header: "Projecto", value: (r) => r.nome },
      { header: "Fase", value: (r) => r.fase },
      { header: "Semáforo", value: (r) => r.semaforo },
      { header: "Progresso", value: (r) => `${r.progresso}%` },
    ],
  },
  {
    nome: "Desvio Orçamental", desc: "Planeado vs. realizado, agregado por projecto.",
    fetch: async () => (await indicatorRepository.list()).map((r) => ({ ...r, ...computeEVM(r) })),
    columns: [
      { header: "Projecto", value: (r) => r.projetoId },
      { header: "PV", value: (r) => formatAOA(r.PV) },
      { header: "EV", value: (r) => formatAOA(r.EV) },
      { header: "AC", value: (r) => formatAOA(r.AC) },
      { header: "CV", value: (r) => formatAOA(r.cv) },
    ],
  },
  {
    nome: "Ocorrências Críticas", desc: "Incidentes de gravidade alta e retrabalho.",
    fetch: async () => (await occurrenceRepository.list()).filter((o) => o.gravidade === "ALTA" || o.gravidade === "CRITICA" || o.ehRetrabalho),
    columns: [
      { header: "Ocorrência", value: (r) => r.descricao },
      { header: "Projecto", value: (r) => r.projetoId },
      { header: "Gravidade", value: (r) => r.gravidade },
      { header: "Retrabalho", value: (r) => (r.ehRetrabalho ? "Sim" : "Não") },
      { header: "Data", value: (r) => formatDate(r.data) },
    ],
  },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const [exporting, setExporting] = useState(null);
  const isOwner = user.perfil === PERFIS.PROJECT_OWNER;
  const lista = isOwner ? EXECUTIVOS : OPERACIONAIS;

  const exportar = async (relatorio, fmt) => {
    setExporting(`${relatorio.nome}-${fmt}`);
    try {
      const rows = await relatorio.fetch();
      if (fmt === "PDF") exportPrintable(relatorio.nome, relatorio.columns, rows);
      else exportCSV(relatorio.nome, relatorio.columns, rows);
      push(`Relatório "${relatorio.nome}" exportado (${fmt}).`);
    } catch {
      push("Não foi possível gerar o relatório.", "error");
    } finally {
      setExporting(null);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Análise" title={isOwner ? "Relatórios Executivos" : "Relatórios"}
        description={isOwner
          ? "Relatórios de gestão para apresentação à direcção, com exportação em PDF ou Excel."
          : "Relatórios operacionais consolidados sobre custos, cronograma e progresso."}
      />
      <div className="grid grid-3">
        {lista.map((r) => (
          <div key={r.nome} className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="eyebrow">Relatório</span>
            <h3>{r.nome}</h3>
            <p className="muted" style={{ flex: 1 }}>{r.desc}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Button size="sm" variant="secondary" icon={<Icon name="report" size={15} />}
                loading={exporting === `${r.nome}-PDF`} onClick={() => exportar(r, "PDF")}>PDF</Button>
              <Button size="sm" variant="secondary" icon={<Icon name="reports" size={15} />}
                loading={exporting === `${r.nome}-Excel`} onClick={() => exportar(r, "Excel")}>Excel</Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
