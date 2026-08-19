import { Routes, Route, Navigate } from "react-router-dom";
import { PERFIS } from "../constants/roles";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import AppLayout from "../layouts/AppLayout";
import AuthLayout from "../layouts/AuthLayout";

import LoginPage from "../pages/auth/LoginPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import ProfilePage from "../pages/profile/ProfilePage";
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

const { ADMIN, GESTOR, PROJECT_OWNER } = PERFIS;

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
          <Route path="/profile" element={<ProfilePage />} />

          {/* Gestor + Project Owner operam; Administrador só visualiza */}
          <Route element={<RoleRoute allow={[GESTOR, PROJECT_OWNER, ADMIN]} />}>
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/rework" element={<ReworkPage />} />
            <Route path="/performance" element={<PerformancePage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
          <Route element={<RoleRoute allow={[GESTOR, PROJECT_OWNER, ADMIN]} permission="custos.gerir" />}>
            <Route path="/costs" element={<CostsPage />} />
          </Route>

          {/* Só Project Owner opera; Administrador só visualiza */}
          <Route element={<RoleRoute allow={[PROJECT_OWNER]} permission="projetos.criar" />}>
            <Route path="/projects/new" element={<CreateProjectPage />} />
          </Route>
          <Route element={<RoleRoute allow={[PROJECT_OWNER, ADMIN]} permission="alteracoes.aprovar" />}>
            <Route path="/validations" element={<ValidationsPage />} />
          </Route>

          {/* Só Gestor opera; Administrador só visualiza */}
          <Route element={<RoleRoute allow={[GESTOR, ADMIN]} permission="tarefas.gerir" />}>
            <Route path="/tasks" element={<TasksPage />} />
          </Route>
          <Route element={<RoleRoute allow={[GESTOR, ADMIN]} permission="status_reports.gerir" />}>
            <Route path="/status-reports" element={<StatusReportsPage />} />
          </Route>
          <Route element={<RoleRoute allow={[GESTOR, PROJECT_OWNER, ADMIN]} permission={["decisoes.gerir", "decisoes.aprovar"]} />}>
            <Route path="/decisions" element={<DecisionsPage />} />
          </Route>
          <Route element={<RoleRoute allow={[GESTOR, ADMIN]} permission="ocorrencias.gerir" />}>
            <Route path="/occurrences" element={<OccurrencesPage />} />
          </Route>
          <Route element={<RoleRoute allow={[GESTOR, ADMIN]} permission="mitigacoes.gerir" />}>
            <Route path="/mitigations" element={<MitigationsPage />} />
          </Route>

          {/* Só Administrador */}
          <Route element={<RoleRoute allow={[ADMIN]} permission="utilizadores.gerir" />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>
          <Route element={<RoleRoute allow={[ADMIN]} permission="perfis.gerir" />}>
            <Route path="/perfis" element={<PerfisPage />} />
          </Route>
          <Route element={<RoleRoute allow={[ADMIN]} permission="dados_mestres.gerir" />}>
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route element={<RoleRoute allow={[ADMIN]} permission="auditoria.ver" />}>
            <Route path="/audit" element={<AuditPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
