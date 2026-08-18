// Fases do modelo G1 (RN02)
export const FASES = {
  INICIACAO: "Iniciação",
  PLANEAMENTO: "Planeamento",
  EXECUCAO_CONTROLO: "Execução / Controlo",
  ENCERRAMENTO: "Encerramento",
};

// Estado do projecto
export const ESTADO_PROJETO = {
  ATIVO: "Activo",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
  PLANEJAMENTO: "Planeamento",
};

// Estado da tarefa (CSU-GP02 / CSU-PO06)
export const ESTADO_TAREFA = {
  PENDENTE: "Pendente",
  EM_PROGRESSO: "Em Progresso",
  CONCLUIDA: "Concluída",           // marcada pelo Gestor
  ENCERRADA: "Encerrada",           // validada pelo Project Owner (CSU-PO06)
  CANCELADA: "Cancelada",
};

export const PRIORIDADE = { BAIXA: "Baixa", MEDIA: "Média", ALTA: "Alta" };

// Semáforo (CSU-GP06) — linguagem do domínio
export const SEMAFORO = { VERDE: "VERDE", AMARELO: "AMARELO", VERMELHO: "VERMELHO" };
export const SEMAFORO_LABEL = { VERDE: "Verde", AMARELO: "Amarelo", VERMELHO: "Vermelho" };

// Estado da ocorrência (CSU-GP09 → CSU-GP10)
export const ESTADO_OCORRENCIA = {
  PENDENTE: "Pendente de Resolução",
  EM_MITIGACAO: "Em Mitigação",
  ENCERRADA: "Encerrada",
};

export const GRAVIDADE = { BAIXA: "Baixa", MEDIA: "Média", ALTA: "Alta", CRITICA: "Crítica" };

// Nível de impacto de uma decisão (CSU-GP08)
export const NIVEL_IMPACTO = { BAIXO: "Baixo", MEDIO: "Médio", ALTO: "Alto" };

// Tipos de custo (CSU-GP07)
export const TIPO_CUSTO = ["Material", "Mão de obra", "Equipamento", "Serviços", "Outros"];
