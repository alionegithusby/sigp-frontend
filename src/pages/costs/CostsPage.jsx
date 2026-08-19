import { useEffect, useState } from "react";
import { costRepository, projectRepository } from "../../services/repositories";
import { TIPO_CUSTO } from "../../constants/enums";
import { PERFIS } from "../../constants/roles";
import { useAuth } from "../../hooks/useAuth";
import { formatAOA, formatDate } from "../../utils/format";
import { useToast } from "../../context/ToastContext";
import PageHeader from "../../components/layout/PageHeader";
import Table from "../../components/data/Table";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import Loader from "../../components/feedback/Loader";
import ErrorState from "../../components/feedback/ErrorState";
import Icon from "../../components/ui/Icon";

const estadoTone = { PENDENTE_APROVACAO: "amarelo", APROVADO: "verde", REJEITADO: "vermelho" };
const estadoLabel = { PENDENTE_APROVACAO: "Pendente de Aprovação", APROVADO: "Aprovado", REJEITADO: "Rejeitado" };
const EMPTY_FORM = { projetoId: "", tipo: TIPO_CUSTO[0], valor: "", dataGasto: new Date().toISOString().slice(0, 10), documento: null };

export default function CostsPage() {
  const { push } = useToast();
  const { user, hasRole } = useAuth();
  const podeGerir = hasRole([PERFIS.GESTOR, PERFIS.PROJECT_OWNER]);
  const podeAprovar = hasRole([PERFIS.PROJECT_OWNER]);
  const [rows, setRows] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = () => Promise.all([costRepository.list(), projectRepository.list()])
    .then(([c, p]) => { setRows(c); setProjects(p); setForm((f) => ({ ...f, projetoId: p[0]?.id || "" })); });

  useEffect(() => { load().catch(setError).finally(() => setLoading(false)); }, []);

  const proj = (pid) => projects.find((p) => p.id === pid)?.codigo || pid;

  const submit = async () => {
    if (!form.projetoId || !form.valor || !form.dataGasto) return push("Preencha projecto, valor e data do gasto.", "error");
    const payload = { ...form, valor: Number(form.valor), estado: "PENDENTE_APROVACAO" };
    if (!payload.documento) delete payload.documento;
    const rec = await costRepository.create(payload);
    setRows((r) => [rec, ...r]);
    setOpen(false);
    setForm({ ...EMPTY_FORM, projetoId: projects[0]?.id || "" });
    push("Custo registado. Aguarda aprovação do Project Owner.");
  };

  const decidir = async (custo, aprovar) => {
    await costRepository.update(custo.id, { estado: aprovar ? "APROVADO" : "REJEITADO", aprovadoPorId: user.id });
    await load();
    push(aprovar ? "Custo aprovado. Já entra no cálculo do CPI." : "Custo rejeitado.");
  };

  if (loading) return <Loader />;
  if (error) return <ErrorState />;
  const aprovados = rows.filter((c) => c.estado === "APROVADO");
  const pendentes = rows.filter((c) => c.estado === "PENDENTE_APROVACAO");
  const total = aprovados.reduce((s, c) => s + c.valor, 0);
  const totalPendente = pendentes.reduce((s, c) => s + c.valor, 0);

  const columns = [
    { key: "projetoId", header: "Projecto", render: (r) => <strong>{proj(r.projetoId)}</strong> },
    { key: "tipo", header: "Tipo", render: (r) => <Badge>{r.tipo}</Badge> },
    { key: "valor", header: "Valor", align: "right", render: (r) => <span className="mono">{formatAOA(r.valor)}</span> },
    { key: "dataGasto", header: "Data", render: (r) => <span className="mono">{formatDate(r.dataGasto)}</span> },
    { key: "estado", header: "Estado", render: (r) => <Badge tone={estadoTone[r.estado]}>{estadoLabel[r.estado] || r.estado}</Badge> },
    { key: "documento", header: "Documento", render: (r) => r.documentoUrl
      ? <a href={r.documentoUrl} target="_blank" rel="noreferrer">Descarregar</a>
      : "—" },
  ];

  const pendCols = [
    { key: "projetoId", header: "Projecto", render: (r) => <strong>{proj(r.projetoId)}</strong> },
    { key: "tipo", header: "Tipo", render: (r) => <Badge>{r.tipo}</Badge> },
    { key: "valor", header: "Valor", align: "right", render: (r) => <span className="mono">{formatAOA(r.valor)}</span> },
    { key: "documento", header: "Documento", render: (r) => r.documentoUrl
      ? <a href={r.documentoUrl} target="_blank" rel="noreferrer">Ver</a>
      : "—" },
    { key: "acao", header: "", align: "right", render: (r) => (
      <span style={{ display: "inline-flex", gap: 8 }}>
        <Button size="sm" variant="secondary" onClick={() => decidir(r, false)}>Rejeitar</Button>
        <Button size="sm" onClick={() => decidir(r, true)}>Aprovar</Button>
      </span>
    ) },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Financeiro" title="Custos"
        description="Registo de custos reais (AC) que alimentam o cálculo do CPI (RN05), sujeitos a aprovação do Project Owner. Não substitui o sistema financeiro da organização."
        actions={podeGerir && <Button icon={<Icon name="plus" size={16} />} onClick={() => setOpen(true)}>Adicionar Custo</Button>}
      />
      <div className="card" style={{ padding: "14px 20px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="eyebrow">Custo real acumulado (AC) · aprovados</span>
        <span className="mono" style={{ fontSize: 22, fontWeight: 600 }}>
          {formatAOA(total)}
          {pendentes.length > 0 && <span className="muted" style={{ fontSize: 13, fontWeight: 400, marginLeft: 10 }}>+ {formatAOA(totalPendente)} pendente ({pendentes.length})</span>}
        </span>
      </div>

      {podeAprovar && pendentes.length > 0 && (
        <>
          <h3 style={{ margin: "8px 0 12px" }}>Custos pendentes de aprovação</h3>
          <Table columns={pendCols} rows={pendentes} />
          <h3 style={{ margin: "28px 0 12px" }}>Todos os custos</h3>
        </>
      )}
      <Table columns={columns} rows={rows} />

      <Modal open={open} title="Adicionar Custo" onClose={() => setOpen(false)}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={submit}>Guardar</Button></>}>
        <Select label="Projecto" value={form.projetoId} onChange={(e) => setForm({ ...form, projetoId: e.target.value })}
          options={projects.map((p) => ({ value: p.id, label: `${p.codigo} · ${p.nome}` }))} />
        <div className="grid grid-2" style={{ gap: 16 }}>
          <Select label="Tipo de custo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} options={TIPO_CUSTO} />
          <Input label="Valor (Kz)" type="number" min="0" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
        </div>
        <Input label="Data do gasto" type="date" value={form.dataGasto} onChange={(e) => setForm({ ...form, dataGasto: e.target.value })} />
        <Input label="Documento de suporte (opcional)" type="file" accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setForm({ ...form, documento: e.target.files?.[0] || null })} />
      </Modal>
    </>
  );
}
