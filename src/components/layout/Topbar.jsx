import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { PERFIL_LABEL } from "../../constants/roles";
import { initials } from "../../utils/format";
import Icon from "../ui/Icon";
import "./Topbar.css";

export default function Topbar({ onToggleSidebar }) {
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

      <div className="topbar__actions">
        <button className="topbar__user" onClick={() => navigate("/profile")} title="A minha conta">
          <span className="topbar__avatar">{initials(user?.nome)}</span>
          <span className="topbar__userinfo">
            <strong>{user?.nome}</strong>
            <small>{PERFIL_LABEL[user?.perfil]}</small>
          </span>
        </button>

        <button className="topbar__icon" onClick={handleLogout} aria-label="Terminar sessão" title="Terminar sessão">
          <Icon name="logout" />
        </button>
      </div>
    </header>
  );
}
