import { createRepository } from "./createRepository";
import { adapters } from "./adapters";
import { deriveIndicators } from "../derive";

// ---- entidades principais (nomes REAIS das collections do PocketBase) ------
export const userRepository         = createRepository("users",            adapters.users);
export const projectRepository      = createRepository("Projeto",          adapters.projetos);
export const taskRepository         = createRepository("Tarefa",           adapters.tarefas);
export const statusReportRepository = createRepository("StatusReport",     adapters.status_reports);
export const costRepository         = createRepository("Custo",            adapters.custos);
export const decisionRepository     = createRepository("Decisao",          adapters.decisoes);
export const occurrenceRepository   = createRepository("Ocorrencia",       adapters.ocorrencias);
export const mitigationRepository   = createRepository("Mitigacao",        adapters.mitigacoes);
export const auditRepository        = createRepository("LogAuditoria",     adapters.logs_auditoria);
export const changeRequestRepository = createRepository("PedidoAlteracao", adapters.pedidos_alteracao);

// ---- dados mestres ---------------------------------------------------------
export const categoriaCausaRepository = createRepository("CategoriaCausa", adapters.categorias_causa);
export const tipoProjetoRepository    = createRepository("TipoProjeto",    adapters.tipos_projeto);
export const faseProjetoRepository    = createRepository("FaseProjeto",    adapters.fases_projeto);
export const perfilRepository         = createRepository("Perfil",         adapters.perfis);
export const permissaoRepository      = createRepository("Permissao",      adapters.permissoes);

// ---- indicadores (derivados; não há collection) ----------------------------
export const indicatorRepository = {
  list: async (filter) => {
    const [proj, cst] = await Promise.all([projectRepository.list(), costRepository.list()]);
    const ind = deriveIndicators(proj, cst);
    return filter ? ind.filter(filter) : ind;
  },
  getById: async (id) => {
    const [proj, cst] = await Promise.all([projectRepository.list(), costRepository.list()]);
    return deriveIndicators(proj, cst).find((i) => i.projetoId === id) || null;
  },
  create: async () => { throw new Error("Indicadores são derivados, não se criam."); },
  update: async () => { throw new Error("Indicadores são derivados, não se editam."); },
  remove: async () => true,
};
