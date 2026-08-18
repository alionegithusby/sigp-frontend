import "../data/EmptyState.css";

export default function ErrorState({ title = "Não foi possível carregar", message, action }) {
  return (
    <div className="empty card">
      <div className="empty__mark" aria-hidden="true">⚠</div>
      <h3>{title}</h3>
      <p className="muted">{message || "Verifique a ligação e tente novamente."}</p>
      {action}
    </div>
  );
}
