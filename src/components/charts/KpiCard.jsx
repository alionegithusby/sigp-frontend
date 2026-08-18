import "./KpiCard.css";

// tone: neutral | verde | amarelo | vermelho | accent
export default function KpiCard({ label, value, hint, tone = "neutral", icon }) {
  return (
    <div className={`kpi kpi--${tone} card`}>
      <div className="kpi__top">
        <span className="kpi__label eyebrow">{label}</span>
        {icon && <span className="kpi__icon">{icon}</span>}
      </div>
      <div className="kpi__value mono">{value}</div>
      {hint && <div className="kpi__hint">{hint}</div>}
    </div>
  );
}
