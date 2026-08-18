import "./Loader.css";

export default function Loader({ label = "A carregar…" }) {
  return (
    <div className="loader">
      <span className="loader__ring" />
      <span className="loader__label">{label}</span>
    </div>
  );
}
