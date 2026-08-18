import { useState } from "react";
import { changeRequestRepository } from "../../services/repositories";
import { useToast } from "../../context/ToastContext";
import Modal from "../ui/Modal";
import Select from "../ui/Select";
import Textarea from "../ui/Textarea";
import Input from "../ui/Input";
import Button from "../ui/Button";

const EMPTY = { tipo: "ORCAMENTO", valorAnterior: "", valorProposto: "", justificacao: "" };

// Pedido de alteração de orçamento/cronograma (CSU-PO05) — submetido pelo
// Gestor a partir da ficha do projecto, aprovado/rejeitado em ValidationsPage.
export default function ChangeRequestModal({ open, onClose, projeto, onSaved }) {
  const { push } = useToast();
  const [form, setForm] = useState(EMPTY);

  const submit = async () => {
    if (!form.valorProposto || !form.justificacao) return push("Preencha o valor proposto e a justificação.", "error");
    const rec = await changeRequestRepository.create({
      projetoId: projeto.id, tipo: form.tipo, estado: "PENDENTE",
      descricao: form.tipo === "ORCAMENTO" ? "Alteração de orçamento" : "Alteração de cronograma",
      valorAnterior: form.valorAnterior, valorProposto: form.valorProposto, justificacao: form.justificacao,
    });
    onSaved?.(rec);
    setForm(EMPTY);
    onClose?.();
    push("Pedido de alteração submetido ao Project Owner.");
  };

  return (
    <Modal open={open} title="Solicitar Alteração" onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={submit}>Submeter</Button></>}>
      <Select label="Tipo de alteração" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
        options={[{ value: "ORCAMENTO", label: "Orçamento" }, { value: "CRONOGRAMA", label: "Cronograma" }]} />
      <div className="grid grid-2" style={{ gap: 16 }}>
        <Input label={form.tipo === "ORCAMENTO" ? "Orçamento actual (Kz)" : "Data fim actual"}
          type={form.tipo === "ORCAMENTO" ? "number" : "date"}
          value={form.valorAnterior} onChange={(e) => setForm({ ...form, valorAnterior: e.target.value })} />
        <Input label={form.tipo === "ORCAMENTO" ? "Orçamento proposto (Kz)" : "Nova data fim"}
          type={form.tipo === "ORCAMENTO" ? "number" : "date"}
          value={form.valorProposto} onChange={(e) => setForm({ ...form, valorProposto: e.target.value })} />
      </div>
      <Textarea label="Justificação" rows={3} value={form.justificacao} onChange={(e) => setForm({ ...form, justificacao: e.target.value })} />
    </Modal>
  );
}
