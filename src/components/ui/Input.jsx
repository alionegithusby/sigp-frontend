import "./Input.css";

export default function Input({ label, error, id, ...rest }) {
  return (
    <div className="field">
      {label && <label htmlFor={id} className="field__label">{label}</label>}
      <input id={id} className={`field__input ${error ? "field__input--error" : ""}`} {...rest} />
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}
