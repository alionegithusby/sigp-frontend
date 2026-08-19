import { useEffect, useState } from "react";
import { occurrenceRepository, mitigationRepository, projectRepository, userRepository } from "../../services/repositories";
import { PERFIS } from "../../constants/roles";
import { useAuth } from "../../hooks/useAuth";
import { formatDate } from "../../utils/format";
import { useToast } from "../../context/ToastContext";
import PageHeader from "../../components/layout/PageHeader";
import Table from "../../components/data/Table";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Textarea from "../../components/ui/Textarea";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Badge from "../../components/ui/Badge";
import Loader from "../../components/feedback/Loader";
import ErrorState from "../../components/feedback/ErrorState";
import Icon from "../../components/ui/Icon";

export default function MitigationsPage() {
  const { push } = useToast();
  const { hasRole } = useAuth();
  const podeGerir = hasRole([PERFIS.GESTOR]);
  const [occ, setOcc] = useState([]);
  const [mits, setMits] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [target, setTarget] = useState(null); // ocorrência a mitigar
  const [form, setForm] = useState({ plano: "", prazo: "", responsavelId: "" });

  const load = () =>
    Promise.all([occurrenceRepository.list(), mitigationRepository.list(), projectRepository.list(), userRepository.list()])
      .then(([o, m, p, u]) => { setOcc(o); setMits(m); setProjects(p); setUsers(u); });

  useEffect(() => { load().catch(setError).finally(() => setLoading(false)); }, []);

  const proj = (pid) => projects.find((p) => p.id === pid)?.codigo || pid;
  const resp = (uid) => users.find((u) => u.id === uid)?.nome || uid;

  const openFor = (o) => { setTarget(o); setForm({ plano: "", prazo: "", responsavelId: users[0]?.id || "" }); };

  const submit = async () => {
    if (!form.plano || !form.prazo) return push("Preencha plano e prazo.", "error");
    await mitigationRepository.create({ ocorrenciaId: target.id, ...form, estado: "em curso" });
    await occurrenceRepository.update(target.id, { estado: "EM_MITIGACAO" });
    await load();
    setTarget(null);
    push("Mitigação registada. Ocorrência em mitigação.");
  };

  if (loading) return <Loader />;
  if (error) return <ErrorState />;

  const pendentes = occ.filter((o) => o.estado === "PENDENTE");

  const pendCols = [
    { key: "descricao", header: "Ocorrência pendente", render: (r) => <strong>{r.descricao}</strong> },
    { key: "projetoId", header: "Projecto", render: (r) => proj(r.projetoId) },
    { key: "gravidade", header: "Gravidade", render: (r) => <Badge tone={r.gravidade === "BAIXA" ? "neutral" : r.gravidade === "MEDIA" ? "amarelo" : "vermelho"}>{r.gravidade}</Badge> },
    { key: "acao", header: "", align: "right", render: (r) => podeGerir && <Button size="sm" onClick={() => openFor(r)}>Registar Mitigação</Button> },
  ];

  const mitCols = [
    { key: "plano", header: "Plano de mitigação", render: (r) => <strong>{r.plano}</strong> },
    { key: "responsavelId", header: "Responsável", render: (r) => resp(r.responsavelId) },
    { key: "prazo", header: "Prazo", render: (r) => <span className="mono">{formatDate(r.prazo)}</span> },
    { key: "estado", header: "Estado", render: (r) => <Badge tone={r.estado === "CONCLUIDA" ? "verde" : r.estado === "EM ATRASO" ? "vermelho" : "amarelo"}>{r.estado}</Badge> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Controlo de qualidade" title="Mitigações"
        description="Nenhuma ocorrência é dada como resolvida sem mitigação registada (RN09)."
      />

      <h3 style={{ margin: "8px 0 12px" }}>Ocorrências pendentes de mitigação</h3>
      {pendentes.length
        ? <Table columns={pendCols} rows={pendentes} />
        : <div className="card muted" style={{ padding: 20 }}>Sem ocorrências pendentes.</div>}

      <h3 style={{ margin: "28px 0 12px" }}>Mitigações registadas</h3>
      <Table columns={mitCols} rows={mits} />

      <Modal open={!!target} title="Registar Mitigação" onClose={() => setTarget(null)}
        footer={<><Button variant="secondary" onClick={() => setTarget(null)}>Cancelar</Button><Button onClick={submit}>Guardar</Button></>}>
        {target && <p className="muted" style={{ marginTop: -4 }}>Ocorrência: <strong>{target.descricao}</strong></p>}
        <Textarea label="Plano de resolução" rows={3} value={form.plano} onChange={(e) => setForm({ ...form, plano: e.target.value })} />
        <div className="grid grid-2" style={{ gap: 16 }}>
          <Input label="Prazo" type="date" value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} />
          <Select label="Responsável" value={form.responsavelId} onChange={(e) => setForm({ ...form, responsavelId: e.target.value })}
            options={users.map((u) => ({ value: u.id, label: u.nome }))} />
        </div>
      </Modal>
    </>
  );
}
