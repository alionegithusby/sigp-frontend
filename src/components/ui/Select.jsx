import "./Input.css";

export default function Select({ label, id, options = [], error, ...rest }) {
  return (
    <div className="field">
      {label && <label htmlFor={id} className="field__label">{label}</label>}
      <select id={id} className={`field__input ${error ? "field__input--error" : ""}`} {...rest}>
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}
