// Cálculo de indicadores Earned Value Management (EVM).
export function computeEVM({ PV = 0, EV = 0, AC = 0 }) {
  const cpi = AC ? EV / AC : 0; // Cost Performance Index
  const spi = PV ? EV / PV : 0; // Schedule Performance Index
  const cv = EV - AC;           // Cost Variance
  const sv = EV - PV;           // Schedule Variance
  return { PV, EV, AC, cpi, spi, cv, sv };
}

// Traduz um índice (CPI/SPI) num estado de semáforo.
export function evmSemaforo(index) {
  if (index >= 1) return "VERDE";
  if (index >= 0.9) return "AMARELO";
  return "VERMELHO";
}

// Agrega uma lista de registos EVM (para o portefólio do Project Owner).
export function aggregateEVM(list = []) {
  const total = list.reduce(
    (acc, r) => ({ PV: acc.PV + r.PV, EV: acc.EV + r.EV, AC: acc.AC + r.AC }),
    { PV: 0, EV: 0, AC: 0 }
  );
  return computeEVM(total);
}
