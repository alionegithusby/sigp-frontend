import "./EmptyState.css";

export default function EmptyState({ title = "Sem registos", message, action }) {
  return (
    <div className="empty card">
      <div className="empty__mark" aria-hidden="true">◵</div>
      <h3>{title}</h3>
      {message && <p className="muted">{message}</p>}
      {action}
    </div>
  );
}
