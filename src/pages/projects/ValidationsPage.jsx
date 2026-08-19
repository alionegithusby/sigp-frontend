import { useEffect, useState } from "react";
import { taskRepository, projectRepository, changeRequestRepository } from "../../services/repositories";
import { PERFIS } from "../../constants/roles";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { formatDate, formatAOA } from "../../utils/format";
import PageHeader from "../../components/layout/PageHeader";
import Table from "../../components/data/Table";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Loader from "../../components/feedback/Loader";
import ErrorState from "../../components/feedback/ErrorState";

export default function ValidationsPage() {
  const { push } = useToast();
  const { hasRole } = useAuth();
  const podeAprovar = hasRole([PERFIS.PROJECT_OWNER]);
  const [changes, setChanges] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([taskRepository.list(), projectRepository.list(), changeRequestRepository.list((c) => c.estado === "PENDENTE")])
      .then(([t, p, c]) => { setTasks(t); setProjects(p); setChanges(c); })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (error) return <ErrorState />;
  const proj = (pid) => projects.find((p) => p.id === pid)?.codigo || pid;

  // CSU-PO06: tarefas marcadas como Concluídas pelo Gestor, à espera de validação
  const porValidar = tasks.filter((t) => t.estado === "CONCLUIDA" && !t.validadaPO);

  const decidir = async (ch, aprovar) => {
    await changeRequestRepository.update(ch.id, { estado: aprovar ? "APROVADO" : "REJEITADO" });
    if (aprovar) {
      const projecto = projects.find((p) => p.id === ch.projetoId);
      if (projecto && ch.tipo === "ORCAMENTO" && ch.valorProposto) {
        await projectRepository.update(projecto.id, { orcamentoPlaneado: Number(ch.valorProposto) });
      } else if (projecto && ch.tipo === "CRONOGRAMA" && ch.valorProposto) {
        await projectRepository.update(projecto.id, { dataFimEstimada: ch.valorProposto });
      }
    }
    setChanges((c) => c.filter((x) => x.id !== ch.id));
    push(aprovar ? "Alteração aprovada e aplicada." : "Alteração rejeitada. Gestor notificado.");
  };

  const validarTarefa = async (t) => {
    await taskRepository.update(t.id, { estado: "ENCERRADA", validadaPO: true });
    setTasks((ts) => ts.map((x) => (x.id === t.id ? { ...x, estado: "ENCERRADA", validadaPO: true } : x)));
    push("Conclusão validada. Tarefa encerrada.");
  };

  const chCols = [
    { key: "tipo", header: "Tipo", render: (r) => <Badge tone="amarelo">{r.tipo === "ORCAMENTO" ? "Orçamento" : "Cronograma"}</Badge> },
    { key: "projetoId", header: "Projecto", render: (r) => proj(r.projetoId) },
    { key: "descricao", header: "Alteração proposta", render: (r) => (
      <span>
        <strong>{r.descricao}</strong><br />
        <small className="muted">
          {r.tipo === "ORCAMENTO" ? formatAOA(r.valorAnterior) : formatDate(r.valorAnterior)} → {r.tipo === "ORCAMENTO" ? formatAOA(r.valorProposto) : formatDate(r.valorProposto)} · {r.justificacao}
        </small>
      </span>
    ) },
    { key: "acao", header: "", align: "right", render: (r) => podeAprovar && (
      <span style={{ display: "inline-flex", gap: 8 }}>
        <Button size="sm" variant="secondary" onClick={() => decidir(r, false)}>Rejeitar</Button>
        <Button size="sm" onClick={() => decidir(r, true)}>Aprovar</Button>
      </span>
    ) },
  ];

  const tCols = [
    { key: "nome", header: "Tarefa concluída", render: (r) => <strong>{r.nome}</strong> },
    { key: "projetoId", header: "Projecto", render: (r) => proj(r.projetoId) },
    { key: "dataFim", header: "Concluída em", render: (r) => <span className="mono">{formatDate(r.dataFim)}</span> },
    { key: "acao", header: "", align: "right", render: (r) => podeAprovar && <Button size="sm" onClick={() => validarTarefa(r)}>Validar Conclusão</Button> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Project Owner" title="Validações"
        description="Aprovação de alterações de orçamento/cronograma (CSU-PO05) e validação da conclusão de tarefas (CSU-PO06)."
      />
      <h3 style={{ margin: "8px 0 12px" }}>Alterações pendentes de aprovação</h3>
      <Table columns={chCols} rows={changes} empty={<div className="card muted" style={{ padding: 20 }}>Sem alterações pendentes.</div>} />

      <h3 style={{ margin: "28px 0 12px" }}>Tarefas por validar</h3>
      <Table columns={tCols} rows={porValidar} empty={<div className="card muted" style={{ padding: 20 }}>Sem tarefas à espera de validação.</div>} />
    </>
  );
}
