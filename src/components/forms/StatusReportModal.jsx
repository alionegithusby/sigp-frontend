import { useEffect, useState } from "react";
import { statusReportRepository } from "../../services/repositories";
import { SEMAFORO_LABEL } from "../../constants/enums";
import { isoWeek } from "../../utils/format";
import { useToast } from "../../context/ToastContext";
import Modal from "../ui/Modal";
import Select from "../ui/Select";
import Textarea from "../ui/Textarea";
import Input from "../ui/Input";
import Button from "../ui/Button";

const EMPTY = { resumo: "", semaforo: "VERDE", progresso: 0 };

// Formulário de registo de status report, reutilizado na StatusReportsPage
// (com selecção de projecto) e no ProjectDetailPage (projecto fixo).
export default function StatusReportModal({ open, onClose, projetos, projetoId, onSaved }) {
  const { push } = useToast();
  const fixo = !!projetoId;
  const [form, setForm] = useState({ ...EMPTY, projetoId: projetoId || projetos?.[0]?.id || "" });

  useEffect(() => {
    if (open) setForm({ ...EMPTY, projetoId: projetoId || projetos?.[0]?.id || "" });
  }, [open, projetoId, projetos]);

  const submit = async () => {
    if (!form.projetoId || !form.resumo) return push("Preencha projecto e resumo.", "error");
    const rec = await statusReportRepository.create({
      ...form, progresso: Number(form.progresso), semana: isoWeek(), data: new Date().toISOString().slice(0, 10),
    });
    onSaved?.(rec);
    onClose?.();
    push("Status report registado.");
  };

  return (
    <Modal open={open} title="Registar Status Report" onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={submit}>Guardar</Button></>}>
      {!fixo && (
        <Select label="Projecto" value={form.projetoId} onChange={(e) => setForm({ ...form, projetoId: e.target.value })}
          options={(projetos || []).map((p) => ({ value: p.id, label: `${p.codigo} · ${p.nome}` }))} />
      )}
      <Textarea label="Resumo da semana" rows={3} value={form.resumo} onChange={(e) => setForm({ ...form, resumo: e.target.value })} placeholder="Progresso, riscos, problemas e decisões necessárias…" />
      <div className="grid grid-2" style={{ gap: 16 }}>
        <Select label="Semáforo" value={form.semaforo} onChange={(e) => setForm({ ...form, semaforo: e.target.value })}
          options={Object.entries(SEMAFORO_LABEL).map(([value, label]) => ({ value, label }))} />
        <Input label="Progresso (%)" type="number" min="0" max="100" value={form.progresso} onChange={(e) => setForm({ ...form, progresso: e.target.value })} />
      </div>
    </Modal>
  );
}
