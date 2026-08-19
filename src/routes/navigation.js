import { PERFIS } from "../constants/roles";

const { ADMIN, GESTOR, PROJECT_OWNER } = PERFIS;

// Cada item de menu declara os perfis que o podem ver (alinhado à Tabela 31 do
// relatório). O Administrador SIG vê todos os módulos operacionais — mas só
// em modo de visualização, as acções continuam exclusivas de Gestor/Project
// Owner (ver RoleRoute e os `hasRole(...)` dentro de cada página).
export const NAV = [
  {
    section: "Operação",
    items: [
      { to: "/dashboard",      label: "Dashboard",     icon: "dashboard",   roles: [ADMIN, GESTOR, PROJECT_OWNER] },
      { to: "/projects",       label: "Projectos",     icon: "projects",    roles: [ADMIN, GESTOR, PROJECT_OWNER] },
      { to: "/tasks",          label: "Tarefas",       icon: "tasks",       roles: [ADMIN, GESTOR] },
      { to: "/status-reports", label: "Status Reports",icon: "report",      roles: [ADMIN, GESTOR] },
      { to: "/costs",          label: "Custos",        icon: "costs",       roles: [ADMIN, GESTOR, PROJECT_OWNER] },
      { to: "/decisions",      label: "Decisões",      icon: "decisions",   roles: [ADMIN, GESTOR, PROJECT_OWNER] },
      { to: "/occurrences",    label: "Ocorrências",   icon: "occurrences", roles: [ADMIN, GESTOR] },
      { to: "/mitigations",    label: "Mitigações",    icon: "mitigations", roles: [ADMIN, GESTOR] },
    ],
  },
  {
    section: "Validação",
    items: [
      { to: "/validations",    label: "Validações",    icon: "audit",       roles: [ADMIN, PROJECT_OWNER] },
    ],
  },
  {
    section: "Análise",
    items: [
      { to: "/rework",         label: "Retrabalho",    icon: "rework",      roles: [ADMIN, GESTOR, PROJECT_OWNER] },
      { to: "/performance",    label: "Indicadores",   icon: "performance", roles: [ADMIN, GESTOR, PROJECT_OWNER] },
      { to: "/reports",        label: "Relatórios",    icon: "reports",     roles: [ADMIN, GESTOR, PROJECT_OWNER] },
    ],
  },
  {
    section: "Administração",
    items: [
      { to: "/users",          label: "Utilizadores",  icon: "users",       roles: [ADMIN] },
      { to: "/perfis",         label: "Perfis",        icon: "mitigations", roles: [ADMIN] },
      { to: "/settings",       label: "Dados Mestres", icon: "settings",    roles: [ADMIN] },
      { to: "/audit",          label: "Auditoria",     icon: "audit",       roles: [ADMIN] },
    ],
  },
];
