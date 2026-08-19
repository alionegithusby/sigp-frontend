import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { projectRepository, userRepository, tipoProjetoRepository } from "../../services/repositories";
import { PERFIS } from "../../constants/roles";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import PageHeader from "../../components/layout/PageHeader";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";

function gerarCodigo() {
  return `SONILS-${Date.now().toString(36).toUpperCase()}`;
}

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { push } = useToast();
  const [gestores, setGestores] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: "", cliente: "", dataInicio: "", dataFimEstimada: "",
    orcamentoPlaneado: "", gestorId: "", tipo: "",
  });

  useEffect(() => {
    userRepository.list((u) => u.perfil === PERFIS.GESTOR && u.estado === "ATIVO")
      .then((g) => { setGestores(g); setForm((f) => ({ ...f, gestorId: g[0]?.id || "" })); });
    tipoProjetoRepository.list((t) => t.ativo)
      .then((t) => { setTipos(t); setForm((f) => ({ ...f, tipo: t[0]?.nome || "" })); });
  }, []);

  const lancar = async () => {
    if (!form.nome || !form.cliente || !form.gestorId || !form.orcamentoPlaneado || !form.tipo)
      return push("Preencha nome, direcção, orçamento, tipo e gestor.", "error");
    setSaving(true);
    const payload = {
      ...form,
      orcamentoPlaneado: Number(form.orcamentoPlaneado),
      fase: "INICIACAO", estado: "ativo", ownerId: user.id,
      semaforo: "VERDE", progresso: 0, validado: true,
    };
    // codigo tem de ser único no PocketBase — tenta novo sufixo em caso de colisão.
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      try {
        await projectRepository.create({ ...payload, codigo: gerarCodigo() });
        push("Projecto lançado. Gestor notificado da atribuição.");
        navigate("/projects");
        return;
      } catch (err) {
        const isConflito = err?.status === 400 && err?.response?.data?.codigo;
        if (!isConflito || tentativa === 2) {
          setSaving(false);
          return push("Não foi possível criar o projecto. Tente novamente.", "error");
        }
      }
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Portefólio · Novo" title="Criar Projecto"
        description="Lançamento de um novo projecto no ecossistema, com orçamento planeado, datas globais e gestor responsável (CSU-PO01)."
      />
      <div className="card" style={{ padding: 24, maxWidth: 640 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input label="Nome do projecto" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <div className="grid grid-2" style={{ gap: 16 }}>
            <Input label="Direcção / Cliente" value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} />
            <Select label="Tipo de projecto" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              options={tipos.map((t) => t.nome)} />
          </div>
          <div className="grid grid-2" style={{ gap: 16 }}>
            <Input label="Data de início" type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />
            <Input label="Conclusão estimada" type="date" value={form.dataFimEstimada} onChange={(e) => setForm({ ...form, dataFimEstimada: e.target.value })} />
          </div>
          <div className="grid grid-2" style={{ gap: 16 }}>
            <Input label="Orçamento total (Kz)" type="number" min="0" value={form.orcamentoPlaneado} onChange={(e) => setForm({ ...form, orcamentoPlaneado: e.target.value })} />
            <Select label="Gestor responsável" value={form.gestorId} onChange={(e) => setForm({ ...form, gestorId: e.target.value })}
              options={gestores.map((g) => ({ value: g.id, label: g.nome }))} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Button variant="secondary" onClick={() => navigate("/projects")}>Cancelar</Button>
            <Button onClick={lancar} loading={saving}>Lançar Projecto</Button>
          </div>
        </div>
      </div>
    </>
  );
}
