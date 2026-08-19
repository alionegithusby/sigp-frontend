import { useState, useEffect } from "react";
import { tipoProjetoRepository, categoriaCausaRepository } from "../../services/repositories";
import { useToast } from "../../context/ToastContext";
import PageHeader from "../../components/layout/PageHeader";
import Table from "../../components/data/Table";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Icon from "../../components/ui/Icon";

const TABS = ["Tipos de Projecto", "Categorias de Causa"];

export default function SettingsPage() {
  const { push } = useToast();
  const [tab, setTab] = useState(TABS[0]);
  const [tipos, setTipos] = useState([]);
  const [cats, setCats] = useState([]);
  const [novo, setNovo] = useState("");

  useEffect(() => {
    tipoProjetoRepository.list().then(setTipos).catch(() => push("Não foi possível carregar os tipos de projecto.", "error"));
    categoriaCausaRepository.list().then(setCats).catch(() => push("Não foi possível carregar as categorias de causa.", "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = async () => {
    if (!novo.trim()) return;
    try {
      if (tab === TABS[0]) {
        const r = await tipoProjetoRepository.create({ nome: novo, estado: "ativo" });
        setTipos((x) => [...x, r]);
      } else {
        const r = await categoriaCausaRepository.create({ nome: novo, estado: "ativo" });
        setCats((x) => [...x, r]);
      }
      setNovo("");
      push("Registo adicionado aos dados mestres.");
    } catch (e) {
      push("Não foi possível gravar (apenas o Administrador SIG pode parametrizar).", "error");
    }
  };

  const alternarEstado = async (r) => {
    try {
      const novoEstado = r.ativo ? "inativo" : "ativo";
      if (tab === TABS[0]) {
        const rec = await tipoProjetoRepository.update(r.id, { estado: novoEstado });
        setTipos((x) => x.map((t) => (t.id === r.id ? rec : t)));
      } else {
        const rec = await categoriaCausaRepository.update(r.id, { estado: novoEstado });
        setCats((x) => x.map((c) => (c.id === r.id ? rec : c)));
      }
      push(r.ativo ? "Registo desactivado." : "Registo reactivado.");
    } catch {
      push("Não foi possível alterar o estado.", "error");
    }
  };

  const cols = [
    { key: "nome", header: tab === TABS[0] ? "Tipo" : "Categoria", render: (r) => <strong>{r.nome}</strong> },
    { key: "ativo", header: "Estado", render: (r) => <Badge tone={r.ativo ? "verde" : "neutral"}>{r.ativo ? "Activo" : "Inactivo"}</Badge> },
    { key: "acao", header: "", align: "right", render: (r) => (
      <Button size="sm" variant="secondary" onClick={() => alternarEstado(r)}>{r.ativo ? "Desactivar" : "Reactivar"}</Button>
    ) },
  ];

  const rows = tab === TABS[0] ? tipos : cats;

  return (
    <>
      <PageHeader
        eyebrow="Administração" title="Dados Mestres"
        description="Parametrização reservada ao Administrador SIG (RN14): tipos de projecto e categorias de causa. Registos desactivados deixam de estar disponíveis para selecção, mas mantêm-se nos registos existentes."
      />
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab ${t === tab ? "is-active" : ""}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      <div className="card" style={{ padding: 16, margin: "16px 0", display: "flex", gap: 10 }}>
        <input className="field__input" style={{ flex: 1 }} placeholder={`Adicionar a "${tab}"…`} value={novo}
          onChange={(e) => setNovo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <Button icon={<Icon name="plus" size={16} />} onClick={add}>Adicionar</Button>
      </div>
      <Table columns={cols} rows={rows} />
      <style>{`
        .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--line); }
        .tab { padding: 10px 14px; font-size: 13.5px; font-weight: 600; color: var(--muted); border-bottom: 2px solid transparent; }
        .tab:hover { color: var(--ink); }
        .tab.is-active { color: var(--accent); border-bottom-color: var(--accent); }
      `}</style>
    </>
  );
}
