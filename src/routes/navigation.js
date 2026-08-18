import { PERFIS } from "../constants/roles";

const { ADMIN, GESTOR, PROJECT_OWNER } = PERFIS;

// Cada item declara os perfis que o podem ver (alinhado à Tabela 31 do relatório).
export const NAV = [
  {
    section: "Operação",
    items: [
      { to: "/dashboard",      label: "Dashboard",     icon: "dashboard",   roles: [ADMIN, GESTOR, PROJECT_OWNER] },
      { to: "/projects",       label: "Projectos",     icon: "projects",    roles: [GESTOR, PROJECT_OWNER] },
      { to: "/tasks",          label: "Tarefas",       icon: "tasks",       roles: [GESTOR] },
      { to: "/status-reports", label: "Status Reports",icon: "report",      roles: [GESTOR] },
      { to: "/costs",          label: "Custos",        icon: "costs",       roles: [GESTOR, PROJECT_OWNER] },
      { to: "/decisions",      label: "Decisões",      icon: "decisions",   roles: [GESTOR] },
      { to: "/occurrences",    label: "Ocorrências",   icon: "occurrences", roles: [GESTOR] },
      { to: "/mitigations",    label: "Mitigações",    icon: "mitigations", roles: [GESTOR] },
    ],
  },
  {
    section: "Validação",
    items: [
      { to: "/validations",    label: "Validações",    icon: "audit",       roles: [PROJECT_OWNER] },
    ],
  },
  {
    section: "Análise",
    items: [
      { to: "/rework",         label: "Retrabalho",    icon: "rework",      roles: [GESTOR, PROJECT_OWNER] },
      { to: "/performance",    label: "Indicadores",   icon: "performance", roles: [GESTOR, PROJECT_OWNER] },
      { to: "/reports",        label: "Relatórios",    icon: "reports",     roles: [GESTOR, PROJECT_OWNER] },
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
