import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import {
  occurrenceRepository, taskRepository, projectRepository, mitigationRepository, userRepository, categoriaCausaRepository,
} from "../../services/repositories";
import { ESTADO_OCORRENCIA, GRAVIDADE } from "../../constants/enums";
import { formatDate } from "../../utils/format";
import PageHeader from "../../components/layout/PageHeader";
import KpiCard from "../../components/charts/KpiCard";
import Badge from "../../components/ui/Badge";
import Loader from "../../components/feedback/Loader";
import ErrorState from "../../components/feedback/ErrorState";
import Icon from "../../components/ui/Icon";

const estadoTone = { PENDENTE: "vermelho", EM_MITIGACAO: "amarelo", ENCERRADA: "verde" };

export default function ReworkPage() {
  const navigate = useNavigate();
  const { data: occ, loading, error } = useFetch(() => occurrenceRepository.list(), []);
  const { data: tasks } = useFetch(() => taskRepository.list(), []);
  const { data: projects } = useFetch(() => projectRepository.list(), []);
  const { data: mits } = useFetch(() => mitigationRepository.list(), []);
  const { data: users } = useFetch(() => userRepository.list(), []);
  const { data: categorias } = useFetch(() => categoriaCausaRepository.list(), []);
  const [expandido, setExpandido] = useState(null);

  if (loading) return <Loader />;
  if (error) return <ErrorState />;

  const proj = (pid) => projects?.find((p) => p.id === pid)?.codigo || pid;
  const cat = (cid) => (categorias || []).find((c) => c.id === cid)?.nome || cid;
  const nome = (uid) => users?.find((u) => u.id === uid)?.nome || uid;
  const origemDe = (r) => (occ || []).find((o) => o.id === r.ocorrenciaAnteriorId);
  const retrabalho = occ.filter((o) => o.ehRetrabalho);

  const totalTasks = tasks?.length || 0;
  const rejeitadas = tasks?.filter((t) => t.horasRetrabalho > 0).length || 0;
  const pctRejeitadas = totalTasks ? Math.round((rejeitadas / totalTasks) * 100) : 0;
  const horas = tasks?.reduce((s, t) => s + (t.horasRetrabalho || 0), 0) || 0;

  return (
    <>
      <PageHeader
        eyebrow="Análise" title="Retrabalho"
        description="Ocorrências que reaparecem pela mesma causa (RN10–RN12) e o custo acrescido ao cronograma original."
      />
      <section className="grid grid-3" style={{ marginBottom: 24 }}>
        <KpiCard label="Ocorrências de Retrabalho" value={retrabalho.length} tone={retrabalho.length ? "vermelho" : "verde"} />
        <KpiCard label="Tarefas com Retrabalho" value={`${pctRejeitadas}%`} tone={pctRejeitadas ? "amarelo" : "verde"} hint={`${rejeitadas} de ${totalTasks} tarefas`} />
        <KpiCard label="Custo em Horas" value={<span className="mono">{horas} h</span>} tone="vermelho" hint="acrescido ao cronograma" />
      </section>

      <h3 style={{ margin: "8px 0 12px" }}>Ocorrências classificadas como retrabalho</h3>
      {retrabalho.length === 0 && <div className="card muted" style={{ padding: 20 }}>Sem retrabalho registado.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {retrabalho.map((r) => {
          const origem = origemDe(r);
          const isOpen = expandido === r.id;
          const mitigsRelacionadas = (mits || []).filter((m) => m.ocorrenciaId === r.id || (origem && m.ocorrenciaId === origem.id));
          const responsaveis = Array.from(new Set([
            r.registadoPorId, origem?.registadoPorId, ...mitigsRelacionadas.map((m) => m.responsavelId),
          ].filter(Boolean)));

          return (
            <div key={r.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div
                style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, cursor: "pointer" }}
                onClick={() => setExpandido(isOpen ? null : r.id)}
              >
                <div>
                  <strong>{r.descricao}</strong>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                    {proj(r.projetoId)} · Reaberta em {formatDate(r.data)}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Badge tone={estadoTone[r.estado]}>{ESTADO_OCORRENCIA[r.estado]}</Badge>
                  <Icon name="chevron" size={16} style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
                </div>
              </div>

              {isOpen && (
                <div style={{ padding: "0 16px 18px", borderTop: "1px solid var(--line)" }}>
                  <div className="grid grid-2" style={{ gap: 16, marginTop: 16 }}>
                    <div className="card" style={{ padding: 14, background: "var(--surface-2)" }}>
                      <span className="eyebrow" style={{ display: "block", marginBottom: 8 }}>Ocorrência original</span>
                      {origem ? (
                        <>
                          <p style={{ margin: "0 0 6px" }}>
                            <button type="button" onClick={() => navigate(`/projects/${origem.projetoId}`)}
                              style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer", textAlign: "left", color: "var(--ink)", fontWeight: 600 }}>
                              {origem.descricao}
                            </button>
                          </p>
                          <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>
                            Causa: {cat(origem.categoriaCausaId)} · Gravidade: {GRAVIDADE[origem.gravidade]}<br />
                            Data: {formatDate(origem.data)} · Registada por: {nome(origem.registadoPorId)}
                          </p>
                        </>
                      ) : <p className="muted" style={{ margin: 0 }}>Origem não encontrada.</p>}
                    </div>

                    <div className="card" style={{ padding: 14, background: "var(--surface-2)" }}>
                      <span className="eyebrow" style={{ display: "block", marginBottom: 8 }}>Reaparição</span>
                      <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>
                        Data de reabertura: {formatDate(r.data)}<br />
                        Estado actual: {ESTADO_OCORRENCIA[r.estado]}<br />
                        Registada por: {nome(r.registadoPorId)}
                      </p>
                    </div>
                  </div>

                  <span className="eyebrow" style={{ display: "block", margin: "16px 0 8px" }}>Histórico de mitigações</span>
                  {mitigsRelacionadas.length === 0
                    ? <p className="muted" style={{ margin: 0, fontSize: 13 }}>Sem mitigações registadas para nenhuma das duas ocorrências.</p>
                    : (
                      <ul style={{ display: "flex", flexDirection: "column", gap: 8, margin: 0, padding: 0, listStyle: "none" }}>
                        {mitigsRelacionadas.map((m) => (
                          <li key={m.id} style={{ fontSize: 13, borderBottom: "1px solid var(--line)", paddingBottom: 8 }}>
                            <strong>{m.plano}</strong>
                            <div className="muted" style={{ fontSize: 12 }}>
                              Responsável: {nome(m.responsavelId)} · Prazo: {formatDate(m.prazo)} · Estado: {m.estado}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                  <span className="eyebrow" style={{ display: "block", margin: "16px 0 8px" }}>Responsáveis envolvidos</span>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {responsaveis.length === 0
                      ? <span className="muted" style={{ fontSize: 13 }}>Sem responsáveis identificados.</span>
                      : responsaveis.map((uid) => <Badge key={uid} tone="neutral">{nome(uid)}</Badge>)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
