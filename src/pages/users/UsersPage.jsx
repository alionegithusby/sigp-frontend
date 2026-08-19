import { useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { userRepository, perfilRepository } from "../../services/repositories";
import { perfilToCode } from "../../services/repositories/adapters";
import { PERFIL_LABEL } from "../../constants/roles";
import { formatDate, formatDateTime } from "../../utils/format";
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

const EMPTY_FORM = { nome: "", email: "", perfilId: "", password: "" };
const EMPTY_EDIT = { nome: "", perfilId: "", estado: "ATIVO", novaPassword: "" };

export default function UsersPage() {
  const { push } = useToast();
  const { data, loading, error } = useFetch(() => userRepository.list(), []);
  const { data: perfis } = useFetch(() => perfilRepository.list(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [rows, setRows] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [saving, setSaving] = useState(false);

  if (loading) return <Loader />;
  if (error) return <ErrorState />;

  const list = rows ?? data;

  const abrir = () => { setForm({ ...EMPTY_FORM, perfilId: perfis?.[0]?.id || "" }); setOpen(true); };

  const submit = async () => {
    if (!form.nome || !form.email || !form.perfilId || form.password.length < 8)
      return push("Preencha nome, email, perfil e uma password com 8+ caracteres.", "error");
    try {
      const rec = await userRepository.create({
        nome: form.nome, email: form.email, perfil: form.perfilId, estado: "ativo",
        password: form.password, passwordConfirm: form.password, emailVisibility: true,
      });
      setRows([rec, ...list]);
      setOpen(false);
      push(`Utilizador criado. Comunique a password inicial a ${form.email}.`);
    } catch {
      push("Não foi possível criar o utilizador. Verifique se o email já existe.", "error");
    }
  };

  const abrirEdicao = (u) => {
    const perfilAtual = (perfis || []).find((p) => perfilToCode(p.nome) === u.perfil);
    setEditForm({ nome: u.nome, perfilId: perfilAtual?.id || perfis?.[0]?.id || "", estado: u.estado, novaPassword: "" });
    setEditTarget(u);
  };

  const submitEdicao = async () => {
    if (!editForm.nome || !editForm.perfilId) return push("Preencha nome e perfil.", "error");
    if (editForm.novaPassword && editForm.novaPassword.length < 8)
      return push("A nova password deve ter pelo menos 8 caracteres.", "error");
    setSaving(true);
    try {
      const payload = { nome: editForm.nome, perfil: editForm.perfilId, estado: editForm.estado.toLowerCase() };
      if (editForm.novaPassword) {
        payload.password = editForm.novaPassword;
        payload.passwordConfirm = editForm.novaPassword;
      }
      const rec = await userRepository.update(editTarget.id, payload);
      setRows((list || []).map((u) => (u.id === editTarget.id ? rec : u)));
      setEditTarget(null);
      push(editForm.novaPassword ? "Utilizador actualizado e password redefinida." : "Utilizador actualizado.");
    } catch {
      push("Não foi possível actualizar o utilizador.", "error");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "nome", header: "Nome", render: (r) => <strong>{r.nome}</strong> },
    { key: "email", header: "Email", render: (r) => <span className="mono">{r.email}</span> },
    { key: "perfil", header: "Perfil", render: (r) => <Badge tone="accent">{PERFIL_LABEL[r.perfil] || r.perfil}</Badge> },
    { key: "estado", header: "Estado", render: (r) => <Badge tone={r.estado === "ATIVO" ? "verde" : "vermelho"}>{r.estado === "ATIVO" ? "Ativo" : "Inactivo"}</Badge> },
    { key: "ultimoLogin", header: "Último Login", render: (r) => <span className="mono">{formatDateTime(r.ultimoLogin)}</span> },
    { key: "criadoEm", header: "Registo", align: "right", render: (r) => <span className="mono">{formatDate(r.criadoEm)}</span> },
    { key: "acao", header: "", align: "right", render: (r) => <Button size="sm" variant="secondary" onClick={() => abrirEdicao(r)}>Editar</Button> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Administração" title="Utilizadores"
        description="Contas e perfis de acesso ao SIGP. As contas são desativadas, nunca eliminadas."
        actions={<Button icon={<Icon name="plus" size={16} />} onClick={abrir}>Novo Utilizador</Button>}
      />
      <Table columns={columns} rows={list} />

      <Modal open={open} title="Novo Utilizador" onClose={() => setOpen(false)}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={submit}>Criar</Button></>}>
        <Input label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nome@sonils.co.ao" />
        <div className="grid grid-2" style={{ gap: 16 }}>
          <Select label="Perfil" value={form.perfilId} onChange={(e) => setForm({ ...form, perfilId: e.target.value })}
            options={(perfis || []).map((p) => ({ value: p.id, label: p.nome }))} />
          <Input label="Password inicial" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="mínimo 8 caracteres" />
        </div>
      </Modal>

      <Modal open={!!editTarget} title="Editar Utilizador" onClose={() => setEditTarget(null)}
        footer={<><Button variant="secondary" onClick={() => setEditTarget(null)}>Cancelar</Button><Button onClick={submitEdicao} loading={saving}>Guardar</Button></>}>
        {editTarget && <p className="muted" style={{ marginTop: -4 }}>{editTarget.email}</p>}
        <Input label="Nome" value={editForm.nome} onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })} />
        <div className="grid grid-2" style={{ gap: 16 }}>
          <Select label="Perfil" value={editForm.perfilId} onChange={(e) => setEditForm({ ...editForm, perfilId: e.target.value })}
            options={(perfis || []).map((p) => ({ value: p.id, label: p.nome }))} />
          <Select label="Estado" value={editForm.estado} onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
            options={[{ value: "ATIVO", label: "Ativo" }, { value: "INATIVO", label: "Inactivo" }]} />
        </div>
        <Input label="Redefinir password (opcional)" type="text" value={editForm.novaPassword}
          onChange={(e) => setEditForm({ ...editForm, novaPassword: e.target.value })}
          placeholder="deixe em branco para não alterar" />
      </Modal>
    </>
  );
}
