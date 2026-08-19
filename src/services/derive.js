// Indicadores derivados de dados REAIS (não há collection "indicadores").
// EVM: AC = custos reais APROVADOS; EV = orçamento × progresso; PV = orçamento × tempo decorrido.
// BAC = orçamento planeado (Budget at Completion).
export function deriveIndicators(projects = [], costs = []) {
  const now = Date.now();
  const aprovados = (costs || []).filter((c) => c.estado === "APROVADO");
  return (projects || []).map((p) => {
    const budget = Number(p.orcamentoPlaneado) || 0;
    const ac = aprovados
      .filter((c) => c.projetoId === p.id)
      .reduce((s, c) => s + (Number(c.valor) || 0), 0);
    const ev = budget * ((Number(p.progresso) || 0) / 100);
    const start = p.dataInicio ? new Date(p.dataInicio).getTime() : now;
    const end = p.dataFimEstimada ? new Date(p.dataFimEstimada).getTime() : now;
    let frac = end > start ? (now - start) / (end - start) : 1;
    frac = Math.max(0, Math.min(1, frac));
    return { projetoId: p.id, PV: Math.round(budget * frac), EV: Math.round(ev), AC: Math.round(ac), BAC: Math.round(budget) };
  });
}

// Curva-S (% acumulada) dos status reports (EV) + custos aprovados (AC). Sem reports → [].
export function deriveEvmSeries(projects = [], costs = [], statusReports = []) {
  const totalBudget = (projects || []).reduce((s, p) => s + (Number(p.orcamentoPlaneado) || 0), 0) || 1;
  const aprovados = (costs || []).filter((c) => c.estado === "APROVADO");
  const reps = [...(statusReports || [])].filter((r) => r.data).sort((a, b) => new Date(a.data) - new Date(b.data));
  if (reps.length === 0) return [];
  const n = reps.length;
  return reps.map((r, i) => {
    const upto = new Date(r.data).getTime();
    const accCost = aprovados
      .filter((c) => c.dataGasto && new Date(c.dataGasto).getTime() <= upto)
      .reduce((s, c) => s + (Number(c.valor) || 0), 0);
    return {
      semana: r.semana || `S${i + 1}`,
      PV: Math.round(((i + 1) / n) * 100),
      EV: Math.round(Number(r.progresso) || 0),
      AC: Math.round((accCost / totalBudget) * 100),
    };
  });
}
