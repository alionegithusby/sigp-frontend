import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import Footer from "../components/layout/Footer";
import { useFetch } from "../hooks/useFetch";
import { occurrenceRepository } from "../services/repositories";
import "./AppLayout.css";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { data: occ } = useFetch(() => occurrenceRepository.list((o) => o.estado === "PENDENTE"), []);

  return (
    <div className="applayout">
      <Sidebar collapsed={collapsed} />
      <div className="applayout__main">
        <Topbar onToggleSidebar={() => setCollapsed((c) => !c)} openOccurrences={occ?.length || 0} />
        <main className="applayout__content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
