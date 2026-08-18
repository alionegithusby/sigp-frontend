import { Outlet } from "react-router-dom";
import { APP_LONG_NAME } from "../services/config";
import "./AuthLayout.css";

export default function AuthLayout() {
  return (
    <div className="authlayout">
      <aside className="authlayout__brand">
        <img src="/sonils-logo.png" alt="SONILS" className="authlayout__logo" />
        <h1 className="authlayout__title">SIGP</h1>
        <p className="authlayout__sub">{APP_LONG_NAME}</p>
        <span className="authlayout__org">SONILS</span>
        <p className="authlayout__tag">
          Uma base única para gerir projectos, controlar desvios e ler o estado real de cada iniciativa.
        </p>
      </aside>
      <section className="authlayout__panel">
        <Outlet />
      </section>
    </div>
  );
}
