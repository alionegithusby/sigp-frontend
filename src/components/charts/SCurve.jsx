// Curva-S (PV / EV / AC) em SVG puro — zero dependências.
export default function SCurve({ series = [], height = 200 }) {
  const width = 520;
  const pad = { l: 34, r: 12, t: 14, b: 24 };
  const max = Math.max(...series.flatMap((d) => [d.PV, d.EV, d.AC]), 1);
  const x = (i) => pad.l + (i * (width - pad.l - pad.r)) / Math.max(series.length - 1, 1);
  const y = (v) => pad.t + (height - pad.t - pad.b) * (1 - v / max);
  const line = (key) => series.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d[key])}`).join(" ");
  const lines = [
    { key: "PV", color: "var(--muted)", label: "PV" },
    { key: "EV", color: "var(--ink)", label: "EV" },
    { key: "AC", color: "var(--vermelho)", label: "AC" },
  ];

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="Curva-S PV EV AC">
        {[0, 0.5, 1].map((t) => (
          <line key={t} x1={pad.l} x2={width - pad.r} y1={y(max * t)} y2={y(max * t)} stroke="var(--line)" />
        ))}
        {series.map((d, i) => (
          <text key={i} x={x(i)} y={height - 8} fontSize="10" fill="var(--muted)" textAnchor="middle">{d.semana}</text>
        ))}
        {lines.map((l) => (
          <path key={l.key} d={line(l.key)} fill="none" stroke={l.color} strokeWidth="2.2" strokeLinejoin="round" />
        ))}
      </svg>
      <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
        {lines.map((l) => (
          <span key={l.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
            <span style={{ width: 14, height: 3, borderRadius: 2, background: l.color }} /> {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
