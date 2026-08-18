import { APP_NAME, ORG, APP_VERSION } from "../../services/config";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      {APP_NAME} · {ORG} · v{APP_VERSION} · © {new Date().getFullYear()}
    </footer>
  );
}
