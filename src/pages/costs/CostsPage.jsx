import { useEffect, useState } from "react";
import { costRepository, projectRepository } from "../../services/repositories";
import { TIPO_CUSTO } from "../../constants/enums";
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

export default function CostsPage() {
  const { push } = useToast();
  const [rows, setRows] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ projetoId: "", tipo: TIPO_CUSTO[0], valor: "", dataGasto: new Date().toISOString().slice(0, 10), documento: "" });

  useEffect(() => {
    Promise.all([costRepository.list(), projectRepository.list()])
      .then(([c, p]) => { setRows(c); setProjects(p); setForm((f) => ({ ...f, projetoId: p[0]?.id || "" })); })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const proj = (pid) => projects.find((p) => p.id === pid)?.codigo || pid;

  const submit = async () => {
    if (!form.projetoId || !form.valor || !form.dataGasto) return push("Preencha projecto, valor e data do gasto.", "error");
    const rec = await costRepository.create({ ...form, valor: Number(form.valor) });
    setRows((r) => [rec, ...r]);
    setOpen(false);
    push("Custo registado. CPI recalculado.");
  };

  if (loading) return <Loader />;
  if (error) return <ErrorState />;
  const total = rows.reduce((s, c) => s + c.valor, 0);

  const columns = [
    { key: "projetoId", header: "Projecto", render: (r) => <strong>{proj(r.projetoId)}</strong> },
    { key: "tipo", header: "Tipo", render: (r) => <Badge>{r.tipo}</Badge> },
    { key: "valor", header: "Valor", align: "right", render: (r) => <span className="mono">{formatAOA(r.valor)}</span> },
    { key: "dataGasto", header: "Data", render: (r) => <span className="mono">{formatDate(r.dataGasto)}</span> },
    { key: "documento", header: "Documento", render: (r) => r.documento || "—" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Financeiro" title="Custos"
        description="Registo de custos reais (AC) que alimentam o cálculo do CPI (RN05). Não substitui o sistema financeiro da organização."
        actions={<Button icon={<Icon name="plus" size={16} />} onClick={() => setOpen(true)}>Adicionar Custo</Button>}
      />
      <div className="card" style={{ padding: "14px 20px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="eyebrow">Custo real acumulado (AC)</span>
        <span className="mono" style={{ fontSize: 22, fontWeight: 600 }}>{formatAOA(total)}</span>
      </div>
      <Table columns={columns} rows={rows} />

      <Modal open={open} title="Adicionar Custo" onClose={() => setOpen(false)}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={submit}>Guardar</Button></>}>
        <Select label="Projecto" value={form.projetoId} onChange={(e) => setForm({ ...form, projetoId: e.target.value })}
          options={projects.map((p) => ({ value: p.id, label: `${p.codigo} · ${p.nome}` }))} />
        <div className="grid grid-2" style={{ gap: 16 }}>
          <Select label="Tipo de custo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} options={TIPO_CUSTO} />
          <Input label="Valor (Kz)" type="number" min="0" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
        </div>
        <div className="grid grid-2" style={{ gap: 16 }}>
          <Input label="Data do gasto" type="date" value={form.dataGasto} onChange={(e) => setForm({ ...form, dataGasto: e.target.value })} />
          <Input label="Documento de suporte" value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} placeholder="fatura-000.pdf" />
        </div>
      </Modal>
    </>
  );
}
