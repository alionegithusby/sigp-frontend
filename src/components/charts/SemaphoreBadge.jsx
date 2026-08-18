import { SEMAFORO_LABEL } from "../../constants/enums";
import "./SemaphoreBadge.css";

// Semáforo do domínio SIGP, tratado como indicador físico de sala de controlo.
export default function SemaphoreBadge({ value = "VERDE", showLabel = true, size = "md" }) {
  const order = ["VERMELHO", "AMARELO", "VERDE"];
  return (
    <span className={`semaforo semaforo--${size}`}>
      <span className="semaforo__lights" aria-hidden="true">
        {order.map((c) => (
          <span key={c} className={`semaforo__light ${c === value ? `is-on light--${c}` : ""}`} />
        ))}
      </span>
      {showLabel && <span className={`semaforo__label label--${value}`}>{SEMAFORO_LABEL[value]}</span>}
    </span>
  );
}
