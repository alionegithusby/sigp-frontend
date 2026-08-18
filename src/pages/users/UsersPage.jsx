import { useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { userRepository, perfilRepository } from "../../services/repositories";
import { PERFIL_LABEL } from "../../constants/roles";
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

const EMPTY_FORM = { nome: "", email: "", perfilId: "", password: "" };

export default function UsersPage() {
  const { push } = useToast();
  const { data, loading, error } = useFetch(() => userRepository.list(), []);
  const { data: perfis } = useFetch(() => perfilRepository.list(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [rows, setRows] = useState(null);

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

  const columns = [
    { key: "nome", header: "Nome", render: (r) => <strong>{r.nome}</strong> },
    { key: "email", header: "Email", render: (r) => <span className="mono">{r.email}</span> },
    { key: "perfil", header: "Perfil", render: (r) => <Badge tone="accent">{PERFIL_LABEL[r.perfil] || r.perfil}</Badge> },
    { key: "estado", header: "Estado", render: (r) => <Badge tone={r.estado === "ATIVO" ? "verde" : "vermelho"}>{r.estado === "ATIVO" ? "Ativo" : "Inactivo"}</Badge> },
    { key: "criadoEm", header: "Registo", align: "right", render: (r) => <span className="mono">{formatDate(r.criadoEm)}</span> },
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
    </>
  );
}
