import { useState, useEffect } from "react";
import { perfilRepository, permissaoRepository } from "../../services/repositories";
import { useToast } from "../../context/ToastContext";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import Loader from "../../components/feedback/Loader";
import ErrorState from "../../components/feedback/ErrorState";
import "./PerfisPage.css";

export default function PerfisPage() {
  const { push } = useToast();
  const [perfis, setPerfis] = useState([]);
  const [catalogo, setCatalogo] = useState([]); // [{id, nome}]
  const [matrix, setMatrix] = useState({}); // { [perfilId]: [permissaoId, ...] }
  const [sel, setSel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([perfilRepository.list(), permissaoRepository.list()])
      .then(([listaPerfis, listaPerms]) => {
        setPerfis(listaPerfis);
        const m = {};
        listaPerfis.forEach((p) => { m[p.id] = (p.permissoes || []).map((x) => x.id); });
        setMatrix(m);
        setSel(listaPerfis[0]?.id || null);
        setCatalogo(listaPerms);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const toggle = (permId) => {
    if (!sel) return;
    setMatrix((m) => {
      const has = (m[sel] || []).includes(permId);
      return { ...m, [sel]: has ? m[sel].filter((p) => p !== permId) : [...(m[sel] || []), permId] };
    });
  };

  const guardar = async () => {
    if (!sel) return;
    setSaving(true);
    try {
      await perfilRepository.update(sel, { permissoes: matrix[sel] || [] });
      push("Permissões actualizadas.");
    } catch {
      push("Não foi possível gravar as permissões.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;
  if (error) return <ErrorState />;

  return (
    <>
      <PageHeader
        eyebrow="Administração" title="Perfis"
        description="Parametrização dos privilégios de acesso por perfil (RN13). Marque as permissões concedidas a cada perfil."
        actions={<Button onClick={guardar} loading={saving}>Guardar Permissões</Button>}
      />
      <div className="perfis">
        <aside className="perfis__list">
          {perfis.map((p) => (
            <button key={p.id} className={`perfis__item ${p.id === sel ? "is-active" : ""}`} onClick={() => setSel(p.id)}>
              <strong>{p.nome}</strong>
              <small>{p.descricao}</small>
            </button>
          ))}
        </aside>
        <div className="perfis__perms card">
          <span className="eyebrow" style={{ display: "block", marginBottom: 12 }}>Permissões do perfil</span>
          <div className="perfis__grid">
            {catalogo.map((perm) => {
              const on = (matrix[sel] || []).includes(perm.id);
              return (
                <label key={perm.id} className={`perm ${on ? "is-on" : ""}`}>
                  <input type="checkbox" checked={on} onChange={() => toggle(perm.id)} />
                  <span>{perm.nome}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
