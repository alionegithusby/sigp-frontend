import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import { useAuth } from "../../hooks/useAuth";
import { occurrenceRepository, projectRepository, categoriaCausaRepository, taskRepository } from "../../services/repositories";
import { ESTADO_OCORRENCIA, GRAVIDADE } from "../../constants/enums";
import { PERFIS } from "../../constants/roles";
import { formatDate } from "../../utils/format";
import { useToast } from "../../context/ToastContext";
import PageHeader from "../../components/layout/PageHeader";
import Table from "../../components/data/Table";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import Loader from "../../components/feedback/Loader";
import ErrorState from "../../components/feedback/ErrorState";
import Icon from "../../components/ui/Icon";

const estadoTone = { PENDENTE: "vermelho", EM_MITIGACAO: "amarelo", ENCERRADA: "verde" };
const gravTone = { CRITICA: "vermelho", ALTA: "vermelho", MEDIA: "amarelo", BAIXA: "neutral" };
const EMPTY_FORM = { projetoId: "", tarefaId: "", descricao: "", categoriaCausaId: "", gravidade: "MEDIA", ocorrenciaAnteriorId: "" };

export default function OccurrencesPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { hasRole } = useAuth();
  const podeGerir = hasRole([PERFIS.GESTOR]);
  const { data, loading, error } = useFetch(() => occurrenceRepository.list(), []);
  const { data: projects } = useFetch(() => projectRepository.list(), []);
  const { data: categorias } = useFetch(() => categoriaCausaRepository.list(), []);
  const { data: tasks } = useFetch(() => taskRepository.list(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [rows, setRows] = useState(null);

  if (loading) return <Loader />;
  if (error) return <ErrorState />;

  const list = rows ?? data;
  const proj = (pid) => projects?.find((p) => p.id === pid)?.codigo || pid;
  const cat = (cid) => (categorias || []).find((c) => c.id === cid)?.nome || cid;
  const origem = (r) => (list || []).find((o) => o.id === r.ocorrenciaAnteriorId);
  const irParaOrigem = (r) => { const o = origem(r); if (o) navigate(`/projects/${o.projetoId}`); };

  const categoriasAtivas = (categorias || []).filter((c) => c.ativo);

  const abrir = () => {
    setForm({ ...EMPTY_FORM, projetoId: projects?.[0]?.id || "", categoriaCausaId: categoriasAtivas[0]?.id || "" });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.projetoId || !form.descricao || !form.categoriaCausaId)
      return push("Preencha projecto, descrição e categoria de causa.", "error");
    const rec = await occurrenceRepository.create({
      ...form, estado: "PENDENTE",
      ehRetrabalho: !!form.ocorrenciaAnteriorId, // RN10: associar uma ocorrência anterior classifica automaticamente como potencial retrabalho
      data: new Date().toISOString().slice(0, 10),
    });
    setRows([rec, ...list]);
    setOpen(false);
    push(form.ocorrenciaAnteriorId ? "Ocorrência registada e classificada como potencial retrabalho." : "Ocorrência registada.");
  };

  const anteriorSelecionada = (list || []).find((o) => o.id === form.ocorrenciaAnteriorId);

  const columns = [
    { key: "descricao", header: "Ocorrência", render: (r) => (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <strong>{r.descricao}</strong>
        {r.ehRetrabalho && (
          <button type="button" onClick={() => irParaOrigem(r)}
            title={origem(r) ? `Origem: ${origem(r).descricao}` : "Ver ocorrência de origem"}
            style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer" }}>
            <Badge tone="vermelho">↩ Retrabalho Identificado</Badge>
          </button>
        )}
      </span>
    ) },
    { key: "projetoId", header: "Projecto", render: (r) => proj(r.projetoId) },
    { key: "categoriaCausaId", header: "Causa", render: (r) => cat(r.categoriaCausaId) },
    { key: "gravidade", header: "Gravidade", render: (r) => <Badge tone={gravTone[r.gravidade]}>{GRAVIDADE[r.gravidade]}</Badge> },
    { key: "estado", header: "Estado", render: (r) => <Badge tone={estadoTone[r.estado]}>{ESTADO_OCORRENCIA[r.estado]}</Badge> },
    { key: "data", header: "Data", align: "right", render: (r) => <span className="mono">{formatDate(r.data)}</span> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Controlo de qualidade" title="Ocorrências"
        description="Incidentes por projecto e tarefa (RN07/RN08). Uma ocorrência que reaparece pela mesma causa é retrabalho (RN10)."
        actions={podeGerir && <Button icon={<Icon name="plus" size={16} />} onClick={abrir}>Nova Ocorrência</Button>}
      />
      <Table columns={columns} rows={list} />

      <Modal open={open} title="Nova Ocorrência" onClose={() => setOpen(false)}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={submit}>Guardar</Button></>}>
        <Select label="Projecto" value={form.projetoId} onChange={(e) => setForm({ ...form, projetoId: e.target.value })}
          options={(projects || []).map((p) => ({ value: p.id, label: `${p.codigo} · ${p.nome}` }))} />
        <Textarea label="Descrição" rows={3} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        <div className="grid grid-2" style={{ gap: 16 }}>
          <Select label="Categoria de causa" value={form.categoriaCausaId} onChange={(e) => setForm({ ...form, categoriaCausaId: e.target.value })}
            options={categoriasAtivas.map((c) => ({ value: c.id, label: c.nome }))} />
          <Select label="Gravidade" value={form.gravidade} onChange={(e) => setForm({ ...form, gravidade: e.target.value })}
            options={Object.entries(GRAVIDADE).map(([value, label]) => ({ value, label }))} />
        </div>
        <Select label="Tarefa (opcional)" value={form.tarefaId} onChange={(e) => setForm({ ...form, tarefaId: e.target.value })}
          options={[{ value: "", label: "Sem tarefa associada" }, ...(tasks || []).filter((t) => t.projetoId === form.projetoId).map((t) => ({ value: t.id, label: t.nome }))]} />
        <Select label="Ocorrência anterior (opcional)" value={form.ocorrenciaAnteriorId}
          onChange={(e) => setForm({ ...form, ocorrenciaAnteriorId: e.target.value })}
          options={[{ value: "", label: "Nenhuma — ocorrência nova" }, ...(list || []).filter((o) => o.projetoId === form.projetoId).map((o) => ({ value: o.id, label: o.descricao }))]} />
        {anteriorSelecionada && (
          <div className="card muted" style={{ padding: 14, fontSize: 13 }}>
            <strong style={{ color: "var(--ink)" }}>Confirma a origem:</strong> {anteriorSelecionada.descricao}<br />
            Causa: {cat(anteriorSelecionada.categoriaCausaId)} · Gravidade: {GRAVIDADE[anteriorSelecionada.gravidade]} · Estado: {ESTADO_OCORRENCIA[anteriorSelecionada.estado]}
            <br />Esta nova ocorrência será classificada automaticamente como <strong>potencial retrabalho</strong>.
          </div>
        )}
      </Modal>
    </>
  );
}
