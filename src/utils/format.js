export const formatAOA = (v) =>
  new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);

export const formatNumber = (v, d = 2) => (Number(v) || 0).toFixed(d);

export const formatPercent = (v) => `${Math.round(Number(v) || 0)}%`;

export const formatDate = (iso) =>
  iso
    ? new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso))
    : "—";

export const initials = (nome = "") =>
  nome.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();

// Semana ISO-8601 (ex.: "2026-W20") a partir de uma data.
export const isoWeek = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};
