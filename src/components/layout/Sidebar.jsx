import { NavLink } from "react-router-dom";
import { NAV } from "../../routes/navigation";
import { useAuth } from "../../hooks/useAuth";
import { APP_NAME } from "../../services/config";
import Icon from "../ui/Icon";
import "./Sidebar.css";

export default function Sidebar({ collapsed }) {
  const { user } = useAuth();

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar__brand">
        <img src="/sonils-logo.png" alt="SONILS" className="sidebar__logo" />
        {!collapsed && (
          <span className="sidebar__brandtext">
            <strong>{APP_NAME}</strong><small>SONILS</small>
          </span>
        )}
      </div>

      <nav className="sidebar__nav">
        {NAV.map((group) => {
          const visible = group.items.filter((i) => i.roles.includes(user?.perfil));
          if (!visible.length) return null;
          return (
            <div className="sidebar__group" key={group.section}>
              {!collapsed && <span className="sidebar__section">{group.section}</span>}
              {visible.map((item) => (
                <NavLink key={item.to} to={item.to} title={item.label}
                  className={({ isActive }) => `sidebar__link ${isActive ? "is-active" : ""}`}>
                  <Icon name={item.icon} size={19} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
