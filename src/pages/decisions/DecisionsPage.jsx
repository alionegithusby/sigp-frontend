import { useEffect, useState } from "react";
import { decisionRepository, projectRepository } from "../../services/repositories";
import { NIVEL_IMPACTO } from "../../constants/enums";
import { formatDate } from "../../utils/format";
import { useToast } from "../../context/ToastContext";
import PageHeader from "../../components/layout/PageHeader";
import Table from "../../components/data/Table";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import Loader from "../../components/feedback/Loader";
import ErrorState from "../../components/feedback/ErrorState";
import Icon from "../../components/ui/Icon";

const impactoTone = { ALTO: "vermelho", MEDIO: "amarelo", BAIXO: "neutral" };

export default function DecisionsPage() {
  const { push } = useToast();
  const [rows, setRows] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ projetoId: "", descricao: "", dataDecisao: new Date().toISOString().slice(0, 10), participantes: "", nivelImpacto: "MEDIO" });

  useEffect(() => {
    Promise.all([decisionRepository.list(), projectRepository.list()])
      .then(([d, p]) => { setRows(d); setProjects(p); setForm((f) => ({ ...f, projetoId: p[0]?.id || "" })); })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const proj = (pid) => projects.find((p) => p.id === pid)?.codigo || pid;

  const submit = async () => {
    if (!form.projetoId || !form.descricao || !form.dataDecisao) return push("Preencha projecto, descrição e data.", "error");
    const rec = await decisionRepository.create(form);
    setRows((r) => [rec, ...r]);
    setOpen(false);
    push("Decisão registada no histórico.");
  };

  if (loading) return <Loader />;
  if (error) return <ErrorState />;

  const columns = [
    { key: "descricao", header: "Decisão", render: (r) => <strong>{r.descricao}</strong> },
    { key: "projetoId", header: "Projecto", render: (r) => proj(r.projetoId) },
    { key: "participantes", header: "Participantes" },
    { key: "nivelImpacto", header: "Impacto", render: (r) => <Badge tone={impactoTone[r.nivelImpacto]}>{NIVEL_IMPACTO[r.nivelImpacto]}</Badge> },
    { key: "dataDecisao", header: "Data", align: "right", render: (r) => <span className="mono">{formatDate(r.dataDecisao)}</span> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Governança" title="Decisões"
        description="Registo formal das deliberações do comité de acompanhamento, garantindo rastreabilidade do histórico decisório (RN06)."
        actions={<Button icon={<Icon name="plus" size={16} />} onClick={() => setOpen(true)}>Registar Decisão</Button>}
      />
      <Table columns={columns} rows={rows} />

      <Modal open={open} title="Registar Decisão" onClose={() => setOpen(false)}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={submit}>Guardar</Button></>}>
        <Select label="Projecto" value={form.projetoId} onChange={(e) => setForm({ ...form, projetoId: e.target.value })}
          options={projects.map((p) => ({ value: p.id, label: `${p.codigo} · ${p.nome}` }))} />
        <Textarea label="Descrição da decisão" rows={3} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        <div className="grid grid-2" style={{ gap: 16 }}>
          <Input label="Data da decisão" type="date" value={form.dataDecisao} onChange={(e) => setForm({ ...form, dataDecisao: e.target.value })} />
          <Select label="Nível de impacto" value={form.nivelImpacto} onChange={(e) => setForm({ ...form, nivelImpacto: e.target.value })}
            options={Object.entries(NIVEL_IMPACTO).map(([value, label]) => ({ value, label }))} />
        </div>
        <Input label="Participantes" value={form.participantes} onChange={(e) => setForm({ ...form, participantes: e.target.value })} placeholder="Gestor, Project Owner, Direcção…" />
      </Modal>
    </>
  );
}
