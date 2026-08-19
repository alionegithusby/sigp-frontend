import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import Footer from "../components/layout/Footer";
import "./AppLayout.css";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => {
    setCollapsed((c) => !c);
    setMobileOpen((o) => !o);
  };

  return (
    <div className="applayout">
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} />
      {mobileOpen && <div className="applayout__backdrop" onClick={() => setMobileOpen(false)} />}
      <div className="applayout__main">
        <Topbar onToggleSidebar={toggleSidebar} />
        <main className="applayout__content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
