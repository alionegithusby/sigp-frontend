// ============================================================================
// ADAPTADORES  PocketBase  <->  shapes que as telas usam
// ----------------------------------------------------------------------------
// As telas continuam a receber os mesmos objectos de sempre; aqui traduzimos os
// registos do PocketBase para essas shapes (toUI) e, na escrita, de volta (toPB),
// resolvendo as relações. Alinhado às collections REAIS do SIGP (nomes PascalCase:
// Projeto, Tarefa, StatusReport, Custo, Decisao, Ocorrencia, Mitigacao, Perfil,
// Permissao, TipoProjeto, FaseProjeto, CategoriaCausa, LogAuditoria, PedidoAlteracao).
//
// LEITURA tolerante: aceita variantes de nome de campo e cai para defaults quando
// um campo não existe.
//
// >>> Se algum campo do teu PocketBase tiver outro nome, ajusta AQUI (um só sítio). <<<
// ============================================================================
import { pb } from "../http/pocketbase";

const norm = (s) =>
  String(s ?? "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]/g, "");
const up = (s) => String(s ?? "").toUpperCase();
const first = (...vals) => vals.find((v) => v !== undefined && v !== null && v !== "");
const dateOf = (...vals) => first(...vals) || "";
const codeOf = (v, fallback) => (v ? norm(v).toUpperCase() : fallback);

// Utilizador autenticado — usado para preencher automaticamente campos de
// autoria (registadoPor/autor/solicitadoPor) que o PocketBase exige mas que
// as telas não pedem explicitamente ao utilizador.
const currentUserId = () => pb?.authStore?.record?.id || "";

// ---- perfil.name  ->  código do frontend -----------------------------------
export function perfilToCode(nome) {
  const n = norm(nome);
  if (n.startsWith("admin")) return "ADMIN";
  if (n.includes("owner")) return "PROJECT_OWNER";
  if (n.startsWith("gestor")) return "GESTOR";
  if (["ADMIN", "GESTOR", "PROJECT_OWNER"].includes(up(nome))) return up(nome);
  return null; // perfil desconhecido: sem acesso, em vez de assumir um perfil por omissão
}

// ---- fase.nome  <->  código do frontend ------------------------------------
const FASE_CODE = {
  iniciacao: "INICIACAO",
  planeamento: "PLANEAMENTO",
  planejamento: "PLANEAMENTO",
  execucaocontrolo: "EXECUCAO_CONTROLO",
  execucaoecontrolo: "EXECUCAO_CONTROLO",
  execucao: "EXECUCAO_CONTROLO",
  encerramento: "ENCERRAMENTO",
};
export function faseToCode(nomeOuCodigo) {
  const raw = up(nomeOuCodigo);
  if (["INICIACAO", "PLANEAMENTO", "EXECUCAO_CONTROLO", "ENCERRAMENTO"].includes(raw)) return raw;
  return FASE_CODE[norm(nomeOuCodigo)] || "INICIACAO";
}

// ---- estado da ocorrência (PB -> código do frontend) -----------------------
function ocorrenciaEstadoToUI(v) {
  const raw = up(v);
  if (["PENDENTE", "EM_MITIGACAO", "ENCERRADA"].includes(raw)) return raw;
  const n = norm(v);
  if (["aberta", "pendente", "pendentederesolucao", "porresolver"].includes(n)) return "PENDENTE";
  if (["emtratamento", "emmitigacao", "mitigacao"].includes(n)) return "EM_MITIGACAO";
  if (["resolvida", "fechada", "encerrada", "concluida"].includes(n)) return "ENCERRADA";
  return "PENDENTE";
}
// código do frontend -> valor real aceite pelo select Ocorrencia.estado no PocketBase
function ocorrenciaEstadoToPB(v) {
  const map = { PENDENTE: "aberta", EM_MITIGACAO: "em tratamento", ENCERRADA: "resolvida" };
  return map[up(v)] || v;
}

// ---- cache de dados mestres (resolver nome/código -> id na escrita) ---------
let _mdPromise = null;
async function ensureMasterData() {
  if (_mdPromise) return _mdPromise;
  const promise = (async () => {
    const [tipos, fases] = await Promise.all([
      pb.collection("TipoProjeto").getFullList(),
      pb.collection("FaseProjeto").getFullList(),
    ]);
    const tiposByName = {};
    tipos.forEach((t) => { tiposByName[norm(t.nome)] = t.id; });
    const fasesByCode = {};
    fases.forEach((f) => { fasesByCode[faseToCode(f.nome)] = f.id; });
    return { tiposByName, fasesByCode };
  })();
  _mdPromise = promise;
  try {
    return await promise;
  } catch (e) {
    _mdPromise = null; // não guardar em cache uma falha transitória — tentar de novo na próxima
    throw e;
  }
}

// ============================================================================
export const adapters = {
  users: {
    expand: "perfil",
    entidade: "Utilizador",
    toUI: (r) => ({
      id: r.id,
      nome: first(r.nome, r.name) || r.email,
      email: r.email,
      perfil: perfilToCode(r.expand?.perfil?.name || r.perfil),
      estado: up(first(r.estado, "ativo")),
      criadoEm: dateOf(r.created),
    }),
    toPB: (d) => ({ ...d }),
  },

  projetos: {
    expand: "tipo,fase,gestor,projectOwner",
    entidade: "Projeto",
    toUI: (r) => ({
      id: r.id,
      codigo: first(r.codigo, r.id),
      nome: r.nome,
      cliente: first(r.cliente, ""),
      tipo: first(r.expand?.tipo?.nome, r.tipo, ""),
      fase: faseToCode(r.expand?.fase?.nome || r.fase),
      gestorId: first(r.gestor, r.gestorId, ""),
      ownerId: first(r.projectOwner, r.ownerId, ""),
      dataInicio: dateOf(r.dataInicio),
      dataFimEstimada: dateOf(r.dataFimEstimada, r.dataFimPrevista),
      orcamentoPlaneado: Number(first(r.orcamentoPlaneado, r.orcamento, 0)),
      estado: codeOf(first(r.estado, "ativo"), "ATIVO"),
      semaforo: up(first(r.semaforo, "verde")),
      progresso: Number(first(r.progresso, 0)),
      validado: Boolean(first(r.validado, false)),
    }),
    toPB: async (d) => {
      const md = await ensureMasterData();
      const out = { ...d };
      if (d.gestorId !== undefined) { out.gestor = d.gestorId; delete out.gestorId; }
      if (d.ownerId !== undefined) { out.projectOwner = d.ownerId; delete out.ownerId; }
      if (d.tipo !== undefined) { const id = md.tiposByName[norm(d.tipo)]; if (id) out.tipo = id; }
      if (d.fase !== undefined) { const id = md.fasesByCode[faseToCode(d.fase)]; if (id) out.fase = id; }
      if (d.dataFimEstimada !== undefined) out.dataFimEstimada = d.dataFimEstimada;
      if (d.orcamentoPlaneado !== undefined) { out.orcamentoPlaneado = Number(d.orcamentoPlaneado) || 0; }
      if (d.semaforo !== undefined) out.semaforo = norm(d.semaforo);
      if (d.estado !== undefined) out.estado = norm(d.estado);
      return out;
    },
  },

  tarefas: {
    expand: "projeto,responsavel",
    entidade: "Tarefa",
    toUI: (r) => ({
      id: r.id,
      projetoId: first(r.projeto, r.projetoId, ""),
      nome: r.nome,
      responsavelId: first(r.responsavel, r.responsavelId, ""),
      prioridade: up(first(r.prioridade, "media")),
      estado: up(first(r.estado, "pendente")),
      dataInicio: dateOf(r.dataInicio),
      dataFim: dateOf(r.dataFim),
      validadaPO: Boolean(first(r.validadaPO, false)),
      horasRetrabalho: Number(first(r.horasRetrabalho, 0)),
    }),
    toPB: (d) => {
      const out = { ...d };
      if (d.projetoId !== undefined) { out.projeto = d.projetoId; delete out.projetoId; }
      if (d.responsavelId !== undefined) { out.responsavel = d.responsavelId; delete out.responsavelId; }
      if (d.prioridade !== undefined) out.prioridade = String(d.prioridade).toLowerCase();
      if (d.estado !== undefined) out.estado = String(d.estado).toLowerCase();
      return out;
    },
  },

  status_reports: {
    expand: "projeto,autor",
    entidade: "StatusReport",
    toUI: (r) => ({
      id: r.id,
      projetoId: first(r.projeto, r.projetoId, ""),
      semana: first(r.semana, ""),
      semaforo: up(first(r.semaforo, "verde")),
      progresso: Number(first(r.progressoAcumulado, r.progresso, 0)),
      resumo: first(r.resumo, ""),
      autorId: first(r.autor, r.autorId, ""),
      data: dateOf(r.dataRegisto, r.data, r.created),
    }),
    toPB: (d) => {
      const out = { ...d };
      if (d.projetoId !== undefined) { out.projeto = d.projetoId; delete out.projetoId; }
      out.autor = d.autorId || currentUserId(); delete out.autorId;
      if (d.progresso !== undefined) { out.progressoAcumulado = Number(d.progresso) || 0; delete out.progresso; }
      if (d.data !== undefined) { out.dataRegisto = d.data; delete out.data; }
      if (d.semaforo !== undefined) out.semaforo = norm(d.semaforo);
      return out;
    },
  },

  custos: {
    expand: "projeto,registadoPor",
    entidade: "Custo",
    toUI: (r) => ({
      id: r.id,
      projetoId: first(r.projeto, r.projetoId, ""),
      tipo: first(r.categoriaCusto, r.tipoCusto, r.tipo, ""),
      valor: Number(first(r.valor, 0)),
      dataGasto: dateOf(r.dataGasto, r.data),
      documento: first(r.documentoSuporte, r.documento, ""),
    }),
    toPB: (d) => {
      const out = { ...d };
      if (d.projetoId !== undefined) { out.projeto = d.projetoId; delete out.projetoId; }
      if (d.tipo !== undefined) { out.categoriaCusto = d.tipo; delete out.tipo; }
      if (d.documento !== undefined) { out.documentoSuporte = d.documento; delete out.documento; }
      out.tipoCusto = "real"; // custos registados na app são sempre custo real (AC)
      out.registadoPor = d.registadoPor || currentUserId();
      return out;
    },
  },

  decisoes: {
    expand: "projeto,registadoPor",
    entidade: "Decisao",
    toUI: (r) => ({
      id: r.id,
      projetoId: first(r.projeto, r.projetoId, ""),
      descricao: first(r.descricao, ""),
      dataDecisao: dateOf(r.dataDecisao, r.data),
      participantes: first(r.participantes, ""),
      nivelImpacto: up(first(r.nivelImpacto, "medio")),
    }),
    toPB: (d) => {
      const out = { ...d };
      if (d.projetoId !== undefined) { out.projeto = d.projetoId; delete out.projetoId; }
      if (d.nivelImpacto !== undefined) out.nivelImpacto = norm(d.nivelImpacto);
      out.registadoPor = d.registadoPor || currentUserId();
      return out;
    },
  },

  ocorrencias: {
    expand: "projeto,tarefa,categoria,registadoPor,ocorrenciaOrigem",
    entidade: "Ocorrencia",
    toUI: (r) => ({
      id: r.id,
      projetoId: first(r.projeto, r.projetoId, ""),
      tarefaId: first(r.tarefa, r.tarefaId, ""),
      descricao: first(r.descricao, ""),
      categoriaCausaId: first(r.categoria, r.categoriaCausa, r.categoriaCausaId, ""),
      gravidade: up(first(r.gravidade, "media")),
      estado: ocorrenciaEstadoToUI(r.estado),
      ehRetrabalho: Boolean(first(r.classificacaoRetrabalho, r.ehRetrabalho, false)),
      ocorrenciaAnteriorId: first(r.ocorrenciaOrigem, r.ocorrenciaAnteriorId) || null,
      data: dateOf(r.dataRegisto, r.data, r.created),
    }),
    toPB: (d) => {
      const out = { ...d };
      if (d.projetoId !== undefined) { out.projeto = d.projetoId; delete out.projetoId; }
      if (d.tarefaId !== undefined) { out.tarefa = d.tarefaId; delete out.tarefaId; }
      if (d.categoriaCausaId !== undefined) { out.categoria = d.categoriaCausaId; delete out.categoriaCausaId; }
      if (d.ehRetrabalho !== undefined) { out.classificacaoRetrabalho = Boolean(d.ehRetrabalho); delete out.ehRetrabalho; }
      if (d.ocorrenciaAnteriorId !== undefined) { out.ocorrenciaOrigem = d.ocorrenciaAnteriorId || ""; delete out.ocorrenciaAnteriorId; }
      if (d.data !== undefined) { out.dataRegisto = d.data; delete out.data; }
      if (d.estado !== undefined) out.estado = ocorrenciaEstadoToPB(d.estado);
      if (d.gravidade !== undefined) out.gravidade = norm(d.gravidade);
      out.registadoPor = d.registadoPor || currentUserId();
      return out;
    },
  },

  mitigacoes: {
    expand: "ocorrencia,responsavel",
    entidade: "Mitigacao",
    toUI: (r) => ({
      id: r.id,
      ocorrenciaId: first(r.ocorrencia, r.ocorrenciaId, ""),
      plano: first(r.planoResolucao, r.descricaoResolucao, r.plano, r.descricao, ""),
      responsavelId: first(r.responsavel, r.responsavelId, ""),
      prazo: dateOf(r.prazo),
      estado: up(first(r.estado, "em_tratamento")),
    }),
    toPB: (d) => {
      const out = { ...d };
      if (d.ocorrenciaId !== undefined) { out.ocorrencia = d.ocorrenciaId; delete out.ocorrenciaId; }
      if (d.responsavelId !== undefined) { out.responsavel = d.responsavelId; delete out.responsavelId; }
      if (d.plano !== undefined) { out.planoResolucao = d.plano; delete out.plano; }
      return out;
    },
  },

  logs_auditoria: {
    expand: "utilizador",
    entidade: "LogAuditoria",
    toUI: (r) => ({
      id: r.id,
      data: dateOf(r.created, r.data),
      utilizadorId: first(r.utilizador, r.utilizadorId, ""),
      acao: up(first(r.acao, "")),
      entidade: first(r.entidade, ""),
      detalhe: first(r.dados?.detalhe, r.detalhe, ""),
    }),
    toPB: (d) => ({ ...d }),
  },

  pedidos_alteracao: {
    expand: "projeto,solicitadoPor",
    entidade: "PedidoAlteracao",
    toUI: (r) => ({
      id: r.id,
      projetoId: first(r.projeto, r.projetoId, ""),
      tipo: up(first(r.tipo, "")),
      descricao: first(r.descricao, ""),
      valorAnterior: first(r.valorAnterior, ""),
      valorProposto: first(r.valorProposto, ""),
      justificacao: first(r.justificacao, ""),
      estado: up(first(r.estado, "pendente")),
      solicitadoPorId: first(r.solicitadoPor, r.solicitadoPorId, ""),
      data: dateOf(r.created, r.data),
    }),
    toPB: (d) => {
      const out = { ...d };
      if (d.projetoId !== undefined) { out.projeto = d.projetoId; delete out.projetoId; }
      if (d.tipo !== undefined) out.tipo = norm(d.tipo);
      if (d.estado !== undefined) out.estado = norm(d.estado);
      out.solicitadoPor = d.solicitadoPorId || currentUserId(); delete out.solicitadoPorId;
      return out;
    },
  },

  categorias_causa: {
    entidade: "CategoriaCausa",
    toUI: (r) => ({
      id: r.id,
      nome: r.nome,
      ativo: r.ativo !== undefined ? Boolean(r.ativo) : norm(r.estado) !== "inativo",
    }),
    toPB: (d) => ({ ...d }),
  },
  tipos_projeto: {
    entidade: "TipoProjeto",
    toUI: (r) => ({ id: r.id, nome: r.nome }),
    toPB: (d) => ({ ...d }),
  },
  fases_projeto: {
    entidade: "FaseProjeto",
    toUI: (r) => ({ id: r.id, nome: r.nome, ordem: Number(first(r.ordem, 0)) }),
    toPB: (d) => ({ ...d }),
  },
  perfis: {
    expand: "permissao",
    entidade: "Perfil",
    toUI: (r) => ({
      id: r.id,
      nome: first(r.name, r.nome),
      descricao: first(r.description, r.descricao, ""),
      permissoes: (r.expand?.permissao || []).map((p) => ({ id: p.id, nome: p.nome || p.codigo })),
    }),
    toPB: (d) => {
      const out = { ...d };
      if (d.nome !== undefined) { out.name = d.nome; delete out.nome; }
      if (d.descricao !== undefined) { out.description = d.descricao; delete out.descricao; }
      if (d.permissoes !== undefined) { out.permissao = d.permissoes; delete out.permissoes; }
      return out;
    },
  },
  permissoes: {
    entidade: "Permissao",
    toUI: (r) => ({ id: r.id, codigo: first(r.codigo, ""), nome: first(r.nome, r.codigo, "") }),
    toPB: (d) => ({ ...d }),
  },
};
