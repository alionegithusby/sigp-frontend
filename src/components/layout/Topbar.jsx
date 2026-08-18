import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { PERFIL_LABEL } from "../../constants/roles";
import { initials } from "../../utils/format";
import Icon from "../ui/Icon";
import "./Topbar.css";

export default function Topbar({ onToggleSidebar, openOccurrences = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="topbar">
      <button className="topbar__icon" onClick={onToggleSidebar} aria-label="Alternar menu">
        <Icon name="menu" />
      </button>

      <div className="topbar__search">
        <Icon name="search" size={17} />
        <input placeholder="Pesquisar projectos, tarefas, ocorrências…" aria-label="Pesquisar" />
      </div>

      <div className="topbar__actions">
        <button className="topbar__icon topbar__bell" aria-label="Notificações">
          <Icon name="bell" />
          {openOccurrences > 0 && <span className="topbar__badge">{openOccurrences}</span>}
        </button>

        <div className="topbar__user">
          <span className="topbar__avatar">{initials(user?.nome)}</span>
          <span className="topbar__userinfo">
            <strong>{user?.nome}</strong>
            <small>{PERFIL_LABEL[user?.perfil]}</small>
          </span>
        </div>

        <button className="topbar__icon" onClick={handleLogout} aria-label="Terminar sessão" title="Terminar sessão">
          <Icon name="logout" />
        </button>
      </div>
    </header>
  );
}
