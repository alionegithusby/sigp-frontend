import { useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { useAuth } from "../../hooks/useAuth";
import { taskRepository, projectRepository, userRepository } from "../../services/repositories";
import { ESTADO_TAREFA, PRIORIDADE } from "../../constants/enums";
import { PERFIS } from "../../constants/roles";
import { formatDate } from "../../utils/format";
import { useToast } from "../../context/ToastContext";
import PageHeader from "../../components/layout/PageHeader";
import Table from "../../components/data/Table";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import Input from "../../components/ui/Input";
import Loader from "../../components/feedback/Loader";
import ErrorState from "../../components/feedback/ErrorState";
import Icon from "../../components/ui/Icon";

const estadoTone = { ENCERRADA: "verde", CONCLUIDA: "accent", EM_PROGRESSO: "amarelo", PENDENTE: "neutral", CANCELADA: "vermelho" };
const prioTone = { ALTA: "vermelho", MEDIA: "amarelo", BAIXA: "neutral" };

const EMPTY_FORM = { projetoId: "", nome: "", responsavelId: "", prioridade: "MEDIA", dataInicio: "", dataFim: "" };

export default function TasksPage() {
  const { push } = useToast();
  const { hasRole } = useAuth();
  const podeGerir = hasRole([PERFIS.GESTOR]);
  const { data: tasks, loading, error } = useFetch(() => taskRepository.list(), []);
  const { data: projects } = useFetch(() => projectRepository.list(), []);
  const { data: users } = useFetch(() => userRepository.list(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [rows, setRows] = useState(null);

  if (loading) return <Loader />;
  if (error) return <ErrorState />;

  const list = rows ?? tasks;
  const proj = (pid) => projects?.find((p) => p.id === pid)?.codigo || pid;
  const resp = (uid) => users?.find((u) => u.id === uid)?.nome || uid;

  const abrir = () => {
    setForm({
      ...EMPTY_FORM, projetoId: projects?.[0]?.id || "", responsavelId: users?.[0]?.id || "",
      dataInicio: new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.projetoId || !form.nome || !form.responsavelId || !form.dataInicio)
      return push("Preencha projecto, nome, responsável e data de início.", "error");
    const rec = await taskRepository.create({ ...form, estado: "PENDENTE", validadaPO: false, horasRetrabalho: 0 });
    setRows([rec, ...list]);
    setOpen(false);
    push("Tarefa criada.");
  };

  // RN04: o Gestor avança o estado da tarefa; a conclusão só fica definitiva
  // depois de validada pelo Project Owner em Validações (CSU-PO06).
  const avancar = async (t) => {
    const proximo = t.estado === "PENDENTE" ? "EM_PROGRESSO" : "CONCLUIDA";
    const rec = await taskRepository.update(t.id, { estado: proximo });
    setRows((list ?? tasks).map((x) => (x.id === t.id ? rec : x)));
    push(proximo === "CONCLUIDA" ? "Tarefa concluída. Aguarda validação do Project Owner." : "Tarefa iniciada.");
  };

  const columns = [
    { key: "nome", header: "Tarefa", render: (r) => <strong>{r.nome}</strong> },
    { key: "projetoId", header: "Projecto", render: (r) => proj(r.projetoId) },
    { key: "responsavelId", header: "Responsável", render: (r) => resp(r.responsavelId) },
    { key: "prioridade", header: "Prioridade", render: (r) => <Badge tone={prioTone[r.prioridade]}>{PRIORIDADE[r.prioridade]}</Badge> },
    { key: "estado", header: "Estado", render: (r) => <Badge tone={estadoTone[r.estado]}>{ESTADO_TAREFA[r.estado]}</Badge> },
    { key: "dataFim", header: "Prazo", align: "right", render: (r) => <span className="mono">{formatDate(r.dataFim)}</span> },
    { key: "acao", header: "", align: "right", render: (r) => (
      podeGerir && (r.estado === "PENDENTE" || r.estado === "EM_PROGRESSO")
        ? <Button size="sm" variant="secondary" onClick={() => avancar(r)}>{r.estado === "PENDENTE" ? "Iniciar" : "Concluir"}</Button>
        : null
    ) },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Execução" title="Tarefas"
        description="Tarefas de todos os projectos. Cada tarefa exige projecto e responsável (RN04)."
        actions={podeGerir && <Button icon={<Icon name="plus" size={16} />} onClick={abrir}>Nova Tarefa</Button>}
      />
      <Table columns={columns} rows={list} />

      <Modal open={open} title="Nova Tarefa" onClose={() => setOpen(false)}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={submit}>Guardar</Button></>}>
        <Select label="Projecto" value={form.projetoId} onChange={(e) => setForm({ ...form, projetoId: e.target.value })}
          options={(projects || []).map((p) => ({ value: p.id, label: `${p.codigo} · ${p.nome}` }))} />
        <Input label="Nome da tarefa" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        <div className="grid grid-2" style={{ gap: 16 }}>
          <Select label="Responsável" value={form.responsavelId} onChange={(e) => setForm({ ...form, responsavelId: e.target.value })}
            options={(users || []).map((u) => ({ value: u.id, label: u.nome }))} />
          <Select label="Prioridade" value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value })}
            options={Object.entries(PRIORIDADE).map(([value, label]) => ({ value, label }))} />
        </div>
        <div className="grid grid-2" style={{ gap: 16 }}>
          <Input label="Data de início" type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />
          <Input label="Prazo" type="date" value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })} />
        </div>
      </Modal>
    </>
  );
}
