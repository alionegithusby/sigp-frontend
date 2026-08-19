// Cálculo de indicadores Earned Value Management (EVM).
export function computeEVM({ PV = 0, EV = 0, AC = 0, BAC = 0 }) {
  const cpi = AC ? EV / AC : 0;        // Cost Performance Index
  const spi = PV ? EV / PV : 0;        // Schedule Performance Index
  const cv = EV - AC;                  // Cost Variance
  const sv = EV - PV;                  // Schedule Variance
  const eac = cpi ? BAC / cpi : BAC;   // Estimate at Completion
  return { PV, EV, AC, BAC, cpi, spi, cv, sv, eac };
}

// Glossário dos indicadores EVM — usado como tooltip (title) onde aparecem.
export const EVM_GLOSSARY = {
  PV: "Valor Planeado (Planned Value) — valor do trabalho planeado até à data.",
  EV: "Valor Ganho (Earned Value) — valor do trabalho realmente concluído até à data.",
  AC: "Custo Real (Actual Cost) — custo efectivamente incorrido até à data.",
  CPI: "Índice de Desempenho de Custo (Cost Performance Index = EV / AC). Acima de 1 é favorável.",
  SPI: "Índice de Desempenho de Prazo (Schedule Performance Index = EV / PV). Acima de 1 é favorável.",
  CV: "Variação de Custo (Cost Variance = EV − AC). Negativo indica derrapagem de custo.",
  SV: "Variação de Prazo (Schedule Variance = EV − PV). Negativo indica atraso.",
  BAC: "Orçamento no Términus (Budget at Completion) — orçamento total planeado do projecto.",
  EAC: "Estimativa no Términus (Estimate at Completion = BAC / CPI) — previsão do custo final do projecto.",
};

// Traduz um índice (CPI/SPI) num estado de semáforo.
export function evmSemaforo(index) {
  if (index >= 1) return "VERDE";
  if (index >= 0.9) return "AMARELO";
  return "VERMELHO";
}

// Agrega uma lista de registos EVM (para o portefólio do Project Owner).
export function aggregateEVM(list = []) {
  const total = list.reduce(
    (acc, r) => ({ PV: acc.PV + r.PV, EV: acc.EV + r.EV, AC: acc.AC + r.AC, BAC: acc.BAC + (r.BAC || 0) }),
    { PV: 0, EV: 0, AC: 0, BAC: 0 }
  );
  return computeEVM(total);
}
