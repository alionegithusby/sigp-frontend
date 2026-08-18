import { useState, useEffect } from "react";
import {
  tipoProjetoRepository, faseProjetoRepository, categoriaCausaRepository,
} from "../../services/repositories";
import { useToast } from "../../context/ToastContext";
import PageHeader from "../../components/layout/PageHeader";
import Table from "../../components/data/Table";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Icon from "../../components/ui/Icon";

const TABS = ["Tipos de Projecto", "Fases do Projecto", "Categorias de Causa"];

export default function SettingsPage() {
  const { push } = useToast();
  const [tab, setTab] = useState(TABS[0]);
  const [tipos, setTipos] = useState([]);
  const [fases, setFases] = useState([]);
  const [cats, setCats] = useState([]);
  const [novo, setNovo] = useState("");

  useEffect(() => {
    tipoProjetoRepository.list().then(setTipos).catch(() => push("Não foi possível carregar os tipos de projecto.", "error"));
    faseProjetoRepository.list().then(setFases).catch(() => push("Não foi possível carregar as fases.", "error"));
    categoriaCausaRepository.list().then(setCats).catch(() => push("Não foi possível carregar as categorias de causa.", "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = async () => {
    if (!novo.trim()) return;
    try {
      if (tab === TABS[0]) {
        const r = await tipoProjetoRepository.create({ nome: novo, estado: "ativo" });
        setTipos((x) => [...x, r]);
      } else if (tab === TABS[1]) {
        const r = await faseProjetoRepository.create({ nome: novo, ordem: fases.length + 1, estado: "ativo" });
        setFases((x) => [...x, r]);
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

  const cols = tab === TABS[1]
    ? [{ key: "ordem", header: "Ordem", render: (r) => <span className="mono">{r.ordem}</span> }, { key: "nome", header: "Fase", render: (r) => <strong>{r.nome}</strong> }]
    : tab === TABS[2]
      ? [{ key: "nome", header: "Categoria", render: (r) => <strong>{r.nome}</strong> }, { key: "ativo", header: "Estado", render: (r) => <Badge tone={r.ativo ? "verde" : "neutral"}>{r.ativo ? "Activa" : "Inactiva"}</Badge> }]
      : [{ key: "nome", header: "Tipo", render: (r) => <strong>{r.nome}</strong> }];

  const rows = tab === TABS[0] ? tipos : tab === TABS[1] ? fases : cats;

  return (
    <>
      <PageHeader
        eyebrow="Administração" title="Dados Mestres"
        description="Parametrização reservada ao Administrador SIG (RN14): tipos de projecto, fases do modelo G1 e categorias de causa."
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
