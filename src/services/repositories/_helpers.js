import { MOCK_LATENCY } from "../config";

// Simula uma chamada assíncrona ao "servidor" com latência,
// para o código das telas já ser escrito como se falasse com uma API real.
export function delay(data, ms = MOCK_LATENCY) {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export function genId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}
