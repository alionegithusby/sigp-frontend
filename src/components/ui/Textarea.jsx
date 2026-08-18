import "./Input.css";

export default function Textarea({ label, id, error, rows = 3, ...rest }) {
  return (
    <div className="field">
      {label && <label htmlFor={id} className="field__label">{label}</label>}
      <textarea id={id} rows={rows} className={`field__input ${error ? "field__input--error" : ""}`} style={{ resize: "vertical" }} {...rest} />
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}
