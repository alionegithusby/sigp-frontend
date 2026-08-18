import "./Badge.css";

// tone: neutral | verde | amarelo | vermelho | accent
export default function Badge({ children, tone = "neutral" }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}
