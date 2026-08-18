import "./PageHeader.css";

export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="pagehead">
      <div>
        {eyebrow && <span className="pagehead__eyebrow eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p className="pagehead__desc muted">{description}</p>}
      </div>
      {actions && <div className="pagehead__actions">{actions}</div>}
    </div>
  );
}
