import { Routes, Route, Navigate } from "react-router-dom";
import { PERFIS } from "../constants/roles";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import AppLayout from "../layouts/AppLayout";
import AuthLayout from "../layouts/AuthLayout";

import LoginPage from "../pages/auth/LoginPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import ProjectsPage from "../pages/projects/ProjectsPage";
import ProjectDetailPage from "../pages/projects/ProjectDetailPage";
import CreateProjectPage from "../pages/projects/CreateProjectPage";
import ValidationsPage from "../pages/projects/ValidationsPage";
import TasksPage from "../pages/tasks/TasksPage";
import StatusReportsPage from "../pages/statusReports/StatusReportsPage";
import CostsPage from "../pages/costs/CostsPage";
import DecisionsPage from "../pages/decisions/DecisionsPage";
import OccurrencesPage from "../pages/occurrences/OccurrencesPage";
import MitigationsPage from "../pages/mitigations/MitigationsPage";
import ReworkPage from "../pages/rework/ReworkPage";
import ReportsPage from "../pages/reports/ReportsPage";
import PerformancePage from "../pages/performance/PerformancePage";
import UsersPage from "../pages/users/UsersPage";
import PerfisPage from "../pages/settings/PerfisPage";
import SettingsPage from "../pages/settings/SettingsPage";
import AuditPage from "../pages/audit/AuditPage";
import NotFoundPage from "../pages/misc/NotFoundPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Gestor + Project Owner */}
          <Route element={<RoleRoute allow={[PERFIS.GESTOR, PERFIS.PROJECT_OWNER]} />}>
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/costs" element={<CostsPage />} />
            <Route path="/rework" element={<ReworkPage />} />
            <Route path="/performance" element={<PerformancePage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>

          {/* Só Project Owner */}
          <Route element={<RoleRoute allow={[PERFIS.PROJECT_OWNER]} />}>
            <Route path="/projects/new" element={<CreateProjectPage />} />
            <Route path="/validations" element={<ValidationsPage />} />
          </Route>

          {/* Só Gestor */}
          <Route element={<RoleRoute allow={[PERFIS.GESTOR]} />}>
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/status-reports" element={<StatusReportsPage />} />
            <Route path="/decisions" element={<DecisionsPage />} />
            <Route path="/occurrences" element={<OccurrencesPage />} />
            <Route path="/mitigations" element={<MitigationsPage />} />
          </Route>

          {/* Só Administrador */}
          <Route element={<RoleRoute allow={[PERFIS.ADMIN]} />}>
            <Route path="/users" element={<UsersPage />} />
            <Route path="/perfis" element={<PerfisPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/audit" element={<AuditPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
