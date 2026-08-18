# SIGP · Frontend

**Sistema Integrado de Gestão de Projetos (SIGP)** — plataforma de acompanhamento
de projectos, custos, cronograma e qualidade para a **SONILS**.

> Trabalho de Fim de Curso · Informática de Gestão Financeira (IGF) · ISAF

Stack: **React 18 + Vite + React Router + PocketBase**. JavaScript puro, sem
framework de UI — os componentes (tabelas, modais, badges) e os gráficos
(curva-S, anel, semáforo) são escritos à mão em CSS/SVG.

O backend é uma instância real de **PocketBase** (SQLite + API REST), hospedada
em `https://sigp-pocketbase-database.up.railway.app`. Não há dados fictícios —
tudo o que a aplicação mostra vem desse servidor.

---

## Índice

1. [Como executar](#como-executar)
2. [Arquitectura](#arquitectura)
3. [Modelo de dados (PocketBase)](#modelo-de-dados-pocketbase)
4. [Controlo de acesso (RBAC)](#controlo-de-acesso-rbac)
5. [Funcionalidades, módulo a módulo](#funcionalidades-módulo-a-módulo)
6. [O que foi feito nesta intervenção](#o-que-foi-feito-nesta-intervenção)
7. [O que falta / limitações conhecidas](#o-que-falta--limitações-conhecidas)
8. [Notas de segurança](#notas-de-segurança)

---

## Como executar

Requisitos: **Node.js 18+**.

```bash
npm install
npm run dev
```

A aplicação abre em `http://localhost:5173` (ou noutra porta livre, se essa
estiver ocupada). Por omissão liga-se ao PocketBase de produção indicado acima;
para apontar a outra instância, cria um `.env` a partir de `.env.example` com
`VITE_POCKETBASE_URL`.

### Contas de demonstração

As contas já existem no PocketBase — não são inventadas pelo frontend. A
password de todas é **`Sigp@2026`**.

| Perfil             | Email                          |
| ------------------- | ------------------------------ |
| Gestor              | gestor@sonils.co.ao            |
| Project Owner       | projectowner@sonils.co.ao      |
| Administrador SIG   | admin@sonils.co.ao             |
| Project Owner       | alione.antonio@sonils.co.ao    |

Os botões de demonstração no ecrã de login preenchem email e password
automaticamente.

---

## Arquitectura

```
src/
  components/
    ui/          Button, Input, Select, Textarea, Modal, Badge, Icon
    layout/      Sidebar, Topbar, PageHeader, Footer
    data/        Table (com estado vazio embutido), EmptyState
    feedback/    Loader, ErrorState
    charts/      KpiCard, SemaphoreBadge, Donut, SCurve (SVG à mão)
    forms/       StatusReportModal, ChangeRequestModal (reutilizados em 2+ páginas)
  constants/     roles.js (perfis), enums.js (fases, estados, prioridades…)
  context/       AuthContext (sessão + RBAC), ToastContext (notificações)
  hooks/         useAuth, useFetch (loading/error/data)
  layouts/       AppLayout (privado, com sidebar), AuthLayout (login)
  pages/         uma pasta por módulo (ver secção de funcionalidades)
  routes/        AppRoutes, ProtectedRoute (sessão), RoleRoute (perfil), navigation.js
  services/
    config.js              URL do PocketBase e metadados da app
    http/pocketbase.js     cliente PocketBase (singleton)
    http/audit.js          escreve em LogAuditoria (best-effort)
    repositories/          camada de acesso a dados (ver abaixo)
    derive.js               deriva indicadores EVM a partir de projectos/custos
  utils/         evm.js (CPI/SPI/CV/SV), format.js (Kwanza, datas, semana ISO), export.js (CSV/print)
  styles/        reset, tokens (identidade visual SONILS), global
```

### Padrão Repository + Adapter

As páginas nunca falam directamente com o PocketBase. Chamam um *repository*
(`projectRepository.list()`, `taskRepository.create(...)`, etc.) que devolve
sempre a mesma forma de objecto, independentemente de como o campo se chama no
PocketBase.

- **`services/repositories/createRepository.js`** — fábrica genérica de
  `list/getById/create/update/remove`, que também escreve automaticamente em
  `LogAuditoria` a cada criação/edição/eliminação.
- **`services/repositories/adapters.js`** — o único sítio onde se traduz entre
  o *schema* real do PocketBase (nomes de collections em PascalCase, nomes de
  campos por vezes em português, por vezes em inglês, valores de `select` em
  minúsculas) e a forma que as páginas usam (códigos em maiúsculas, IDs com
  sufixo `Id`). Se um campo do PocketBase mudar de nome, **é aqui que se
  ajusta** — nenhuma página precisa de ser tocada.
- **`services/repositories/index.js`** — exporta um repositório por entidade
  (`projectRepository`, `taskRepository`, `costRepository`,
  `decisionRepository`, `occurrenceRepository`, `mitigationRepository`,
  `statusReportRepository`, `changeRequestRepository`, `auditRepository`,
  `userRepository`, `perfilRepository`, `permissaoRepository`,
  `tipoProjetoRepository`, `faseProjetoRepository`, `categoriaCausaRepository`,
  `indicatorRepository`).

---

## Modelo de dados (PocketBase)

Nomes reais das collections (não confundir com os nomes dos repositórios acima,
que são só o identificador interno do frontend):

| Collection       | Descrição                                             | Relações principais |
| ---------------- | ------------------------------------------------------ | -------------------- |
| `users`          | Contas (auth nativa do PocketBase)                     | `perfil` → Perfil |
| `Perfil`         | Os 3 perfis de acesso                                   | `permissao` → Permissao (N:N) |
| `Permissao`      | Catálogo de permissões (ainda não gatilha nada na UI — ver limitações) | — |
| `TipoProjeto`    | Tipos de projecto (dados mestres)                        | — |
| `FaseProjeto`    | As 4 fases do modelo G1: Iniciação, Planeamento, Execução e Controlo, Encerramento | — |
| `CategoriaCausa` | Categorias de causa de ocorrências                       | — |
| `Projeto`        | Projectos                                                | `tipo`, `fase`, `gestor` (users), `projectOwner` (users) |
| `Tarefa`         | Tarefas                                                  | `projeto`, `responsavel` (users) |
| `StatusReport`   | Relatórios semanais de progresso                          | `projeto`, `autor` (users) |
| `Custo`          | Custos reais (AC)                                        | `projeto`, `registadoPor` (users) |
| `Decisao`        | Decisões do comité de acompanhamento                      | `projeto`, `registadoPor` (users) |
| `Ocorrencia`      | Incidentes/ocorrências de qualidade                       | `projeto`, `tarefa` (opcional), `categoria`, `registadoPor`, `ocorrenciaOrigem` (auto-relação, para retrabalho) |
| `Mitigacao`      | Planos de mitigação de ocorrências                         | `ocorrencia`, `responsavel` (users) |
| `PedidoAlteracao`| Pedidos de alteração de orçamento/cronograma (criado nesta intervenção) | `projeto`, `solicitadoPor` (users) |
| `LogAuditoria`   | Trilha de auditoria (criado nesta intervenção)             | `utilizador` (users) |

Todas as regras de API (`listRule`/`viewRule`/`createRule`/`updateRule`/`deleteRule`)
são geridas no próprio PocketBase (Admin UI ou API), não no frontend — ver
secção de RBAC abaixo.

---

## Controlo de acesso (RBAC)

Existem 3 perfis: **Gestor**, **Project Owner**, **Administrador SIG**. Cada
item de menu (`src/routes/navigation.js`) e cada grupo de rotas
(`src/routes/AppRoutes.jsx`) declara os perfis autorizados; `RoleRoute` bloqueia
e redirecciona para o dashboard quem tentar aceder a uma rota fora do seu
perfil.

**Isto é reforçado a dois níveis**:

1. **Frontend** — menu adaptado, rotas guardadas, alguns botões só visíveis a
   um perfil (ex.: "Validar" e "Novo Utilizador" só a quem de direito).
2. **Backend (PocketBase)** — cada collection tem regras de API que verificam
   `@request.auth.perfil.name`. Isto é o que realmente impede um pedido feito
   directamente à API (fora da app) de contornar o RBAC — o frontend sozinho
   nunca é suficiente para isso.

Padrão geral das regras: leitura aberta a qualquer utilizador autenticado;
escrita restrita ao perfil dono do processo (Gestor regista o dia-a-dia
operacional; Project Owner cria projectos e aprova/valida; Administrador gere
utilizadores, perfis e dados mestres); eliminação reservada ao Administrador ou
desactivada (contas nunca se eliminam, só se desactivam).

---

## Funcionalidades, módulo a módulo

### Autenticação (`pages/auth/LoginPage.jsx`)
Login por email/password contra o PocketBase. Se a conta estiver marcada como
`inativo`, ou se o perfil associado não for reconhecido, a sessão é
imediatamente terminada com uma mensagem explicativa em vez de deixar entrar
num estado inconsistente. Botões de atalho preenchem as 4 contas de
demonstração.

### Dashboard (`pages/dashboard/DashboardPage.jsx`)
Painel adaptado ao perfil. Gestor/Project Owner vêem: projectos activos vs.
concluídos, ocorrências abertas (e quantas são retrabalho), projectos activos
sem status report na semana, custo real acumulado, os quatro indicadores EVM
(CPI, SPI, CV, SV) com semáforo, a curva-S (PV/EV/AC acumulados por semana),
lista de "projectos que exigem atenção" (semáforo ≠ verde) e a distribuição de
tarefas por estado. Administrador vê uma vista mais simples, focada em volume
(nº de projectos e ocorrências no sistema).

### Projectos (`pages/projects/`)
- **ProjectsPage** — Project Owner vê o portefólio completo; Gestor vê só os
  projectos que lhe estão atribuídos.
- **CreateProjectPage** — exclusivo do Project Owner. O tipo de projecto é
  carregado dinamicamente dos dados mestres (não é uma lista fixa). O código do
  projecto (`SONILS-xxxxx`) é gerado a partir do relógio e é único no
  PocketBase; se por azar colidir, a criação repete automaticamente com um novo
  código antes de desistir.
- **ProjectDetailPage** — ficha do projecto com separadores (Tarefas, Status
  Reports, Custos, Decisões, Ocorrências), KPIs de CPI/SPI/progresso/orçamento,
  e três acções: registar Status Report (qualquer um dos dois perfis),
  solicitar uma alteração de orçamento/cronograma (só Gestor), e validar o
  projecto (só Project Owner, só antes de estar validado).
- **ValidationsPage** — exclusivo do Project Owner. Duas filas: pedidos de
  alteração de orçamento/cronograma pendentes (aprovar aplica o novo valor
  directamente ao projecto; rejeitar só fecha o pedido), e tarefas marcadas
  como concluídas pelo Gestor à espera de validação (CSU-PO06).

### Tarefas (`pages/tasks/TasksPage.jsx`)
Lista de todas as tarefas, com criação (projecto e responsável obrigatórios) e
um botão de avanço de estado: **Pendente → Iniciar → Em Progresso → Concluir →
Concluída**. A partir daí, só o Project Owner (em Validações) fecha
definitivamente a tarefa como **Encerrada**.

### Status Reports (`pages/statusReports/StatusReportsPage.jsx`)
Registo semanal de progresso por projecto (semáforo + % acumulada + resumo). A
semana é calculada automaticamente (ISO 8601, ex. `2026-W34`) a partir da data
do registo — não é escolhida à mão. O mesmo formulário é reutilizado na ficha
do projecto (`StatusReportModal`), com o projecto já fixo.

### Custos (`pages/costs/CostsPage.jsx`)
Registo de custos reais (AC) por projecto — tipo, valor, data e documento de
suporte (texto livre com o nome/referência do documento; não é upload de
ficheiro). O total acumulado alimenta directamente o cálculo de CPI.

### Decisões (`pages/decisions/DecisionsPage.jsx`)
Registo formal de deliberações — descrição, participantes, data e nível de
impacto — para rastreabilidade do histórico decisório.

### Ocorrências (`pages/occurrences/OccurrencesPage.jsx`)
Registo de incidentes por projecto (e opcionalmente por tarefa), com categoria
de causa e gravidade. Ocorrências marcadas como retrabalho mostram um badge
clicável que leva à ocorrência de origem.

### Mitigações (`pages/mitigations/MitigationsPage.jsx`)
Lista de ocorrências pendentes de mitigação; registar uma mitigação (plano,
responsável, prazo) move automaticamente a ocorrência para "Em Mitigação".

### Retrabalho (`pages/rework/ReworkPage.jsx`)
Análise agregada: nº de ocorrências classificadas como retrabalho, % de tarefas
com horas de retrabalho, e total de horas acrescidas ao cronograma original.

### Indicadores de Performance (`pages/performance/PerformancePage.jsx`)
EVM (PV, EV, AC, CPI, SPI) consolidado e por projecto, com semáforo por linha.

### Relatórios (`pages/reports/ReportsPage.jsx`)
Três relatórios operacionais (Gestor) ou três executivos (Project Owner),
gerados a partir dos dados reais no momento do clique — exportação em **CSV**
(abre nativamente no Excel) ou em vista **imprimível** (usa o diálogo de
impressão do browser para gerar PDF).

### Administração (só Administrador SIG)
- **UsersPage** — lista de contas; criação de nova conta (nome, email, perfil,
  password inicial definida pelo administrador — não há envio de email).
- **PerfisPage** — matriz de permissões por perfil; "Guardar Permissões"
  persiste mesmo no PocketBase.
- **SettingsPage** — dados mestres: tipos de projecto, fases, categorias de
  causa.
- **AuditPage** — trilha cronológica de todas as operações (criar/editar/
  eliminar) feitas por qualquer utilizador, com filtro por utilizador e acção.

---

## O que foi feito nesta intervenção

Esta intervenção teve duas partes: **descobrir e provisionar o backend real**
(que não estava correctamente ligado ao frontend) e **corrigir/completar o
frontend** para funcionar contra esse backend.

### Backend
- Diagnosticado que o PocketBase já tinha um schema real (não estava vazio),
  mas com nomes de collections diferentes dos que o frontend chamava, campos em
  falta, e **todas as regras de API a bloquear tudo** excepto o superuser.
- Adicionados os campos em falta (ver tabela do modelo de dados acima).
- Criadas as collections `LogAuditoria` e `PedidoAlteracao`.
- Definidas regras de API por perfil em todas as collections.
- Corrigido um campo com erro ortográfico (`ocorrenciaOrigen` → `ocorrenciaOrigem`).
- Ajustados valores de `select` inconsistentes (acentos, maiúsculas, espaços)
  entre o que o PocketBase aceita e o que o frontend enviava.
- `emailVisibility` activado nas contas existentes (por omissão o PocketBase
  esconde o email de um utilizador dos outros).
- Semeados: catálogo de permissões atribuído aos 3 perfis, fases do projecto
  completas (só existiam 2 de 4), categorias de causa, e um projecto de exemplo
  com tarefa, custo, status report, decisão, ocorrência e mitigação.
- Password das 4 contas existentes redefinida para `Sigp@2026`.

### Frontend
- Corrigidos os nomes de collection em todos os repositórios.
- Reescrito `adapters.js` para os nomes de campo e valores reais.
- Corrigido um `perfilToCode` inseguro (assumia "Gestor" para qualquer perfil
  desconhecido; agora nega acesso).
- Corrigida uma colisão de código de projecto praticamente garantida (só 90
  valores possíveis) e a falta de tratamento de erro em quase todos os `fetch`
  (a app rebentava em silêncio se o PocketBase estivesse em baixo).
- Corrigido um bug de *Rules of Hooks* pré-existente que rebentava a página de
  Retrabalho (um `useNavigate()` era chamado depois de um `return` condicional).
- Ligados todos os botões que não faziam nada: Nova Tarefa, Nova Ocorrência,
  Novo Utilizador, Status Report/Validar/Solicitar Alteração na ficha do
  projecto, Guardar Permissões, exportação de Relatórios.
- Acrescentada a transição de estado da tarefa (Iniciar/Concluir), que não
  existia — sem ela, a fila de validação do Project Owner nunca teria nada
  para validar.
- Ligada a fila de "Alterações pendentes" a uma collection real (antes era uma
  lista sempre vazia).
- Removido código morto (`services/mock/`, `ModulePlaceholder.jsx`).
- Testado manualmente em browser, de ponta a ponta, com os 3 perfis.

---

## O que falta / limitações conhecidas

- **Sem edição/eliminação** de Custos, Decisões, Ocorrências e Status Reports
  depois de criados — só é possível criar e listar. As únicas transições de
  estado existentes são: tarefa (Pendente → Em Progresso → Concluída →
  Encerrada) e ocorrência → mitigação.
- **Não há forma de fechar uma ocorrência.** Uma ocorrência passa a "Em
  Mitigação" ao registar uma mitigação, mas nada a move a "Encerrada" — falta
  uma acção (ex.: "Marcar mitigação como concluída") que feche o ciclo.
- **Retrabalho não tem interface própria.** O campo `ehRetrabalho` e a ligação
  a uma ocorrência de origem existem no schema e no adapter, mas o formulário
  "Nova Ocorrência" não os expõe — hoje só podem ser marcados a escrever
  directamente no PocketBase.
- **Matriz de Permissões não é aplicada.** `hasPermission()` existe no
  `AuthContext` mas nenhuma página o chama — o controlo de acesso real hoje é
  todo por perfil (`hasRole`), não por permissão fina.
- **Sem upload de ficheiros.** O "documento de suporte" de um custo é texto
  livre (nome/referência), não um upload real — o campo do PocketBase foi
  alterado de `file` para `text` para simplificar.
- **Criação de utilizador não envia email.** O Administrador define a password
  inicial e tem de a comunicar por fora do sistema.
- **Exportação em PDF é via impressão do browser**, não geração real de PDF —
  funciona, mas depende do utilizador escolher "Guardar como PDF" no diálogo
  de impressão, e pode ser bloqueada por bloqueadores de pop-up.
- **Sem paginação.** Todas as listas usam `getFullList()` — adequado ao volume
  actual, mas vai degradar se o número de registos crescer muito.
- **Sem testes automatizados** nem `error boundary` React (um erro de
  renderização numa página ainda derruba a árvore inteira, embora isso já não
  aconteça em nenhum fluxo testado).
- **Sem recuperação de password** ("esqueci-me da password") no ecrã de login.

---

## Notas de segurança

- A password de demonstração (`Sigp@2026`) está documentada aqui de propósito
  — é um ambiente de desenvolvimento/demonstração. **Deve ser trocada antes de
  qualquer utilização em produção com dados reais.**
- As regras de API do PocketBase são a única barreira real contra acesso
  indevido pela API; o RBAC do frontend é só uma camada de conforto de UI.
- O `.env` (com a URL do PocketBase) está no `.gitignore` — nunca comitar
  credenciais.
