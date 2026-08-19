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
6. [Fluxos de aprovação (Custos e Decisões)](#fluxos-de-aprovação-custos-e-decisões)
7. [Análise de dados — EVM](#análise-de-dados--evm)
8. [Auditoria](#auditoria)
9. [Validação e segurança](#validação-e-segurança)
10. [Histórico de alterações](#histórico-de-alterações)
11. [O que falta / limitações conhecidas](#o-que-falta--limitações-conhecidas)

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
automaticamente. Cada utilizador pode alterar a sua própria password em
**A minha conta** (ícone do avatar na barra superior); o Administrador SIG
pode redefinir a de qualquer outra conta em **Utilizadores → Editar**.

---

## Arquitectura

```
src/
  components/
    ui/          Button, Input, Select, Textarea, Modal, Badge, Icon
    layout/      Sidebar (com overlay em mobile), Topbar, PageHeader, Footer
    data/        Table (com estado vazio embutido), EmptyState
    feedback/    Loader, ErrorState
    charts/      KpiCard, SemaphoreBadge, Donut, SCurve (SVG à mão)
    forms/       StatusReportModal, ChangeRequestModal (reutilizados em 2+ páginas)
  constants/     roles.js (perfis), enums.js (fases, estados, prioridades…)
  context/       AuthContext (sessão + hasRole/hasPermission), ToastContext
  hooks/         useAuth, useFetch (loading/error/data)
  layouts/       AppLayout (privado, com sidebar), AuthLayout (login)
  pages/         uma pasta por módulo (ver secção de funcionalidades)
  routes/        AppRoutes, ProtectedRoute (sessão), RoleRoute (perfil + permissão), navigation.js
  services/
    config.js              URL do PocketBase e metadados da app
    http/pocketbase.js     cliente PocketBase (singleton)
    http/audit.js          escreve em LogAuditoria (best-effort)
    repositories/          camada de acesso a dados (ver abaixo)
    derive.js               deriva indicadores EVM a partir de projectos/custos aprovados
  utils/
    evm.js       CPI/SPI/CV/SV/BAC/EAC + glossário para tooltips
    format.js    Kwanza, datas (curta e completa), semana ISO amigável
    export.js    exportação CSV / vista imprimível
  styles/        reset, tokens (identidade visual SONILS), global
```

### Padrão Repository + Adapter

As páginas nunca falam directamente com o PocketBase. Chamam um *repository*
(`projectRepository.list()`, `taskRepository.create(...)`, etc.) que devolve
sempre a mesma forma de objecto, independentemente de como o campo se chama no
PocketBase.

- **`services/repositories/createRepository.js`** — fábrica genérica de
  `list/getById/create/update/remove`, que também escreve automaticamente em
  `LogAuditoria` a cada criação/edição/eliminação. Se o payload (depois do
  adapter) contiver um `File`/`Blob` — caso do documento de suporte de um
  custo — converte automaticamente para `FormData`, para que o PocketBase
  aceite o upload sem que a página precise de saber disso.
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

| Collection | Descrição | Campos relevantes | Relações |
|---|---|---|---|
| `users` | Contas (auth nativa do PocketBase) | `nome`, `estado` (ativo/inativo), `lastLogin` (date) | `perfil` → Perfil |
| `Perfil` | Os 3 perfis de acesso | `name`, `description` | `permissao` → Permissao (N:N, até 30) |
| `Permissao` | Catálogo de permissões finas (ver [RBAC](#controlo-de-acesso-rbac)) | `nome`, `descricao` | — |
| `TipoProjeto` | Tipos de projecto (dados mestres) | `nome`, `estado` (ativo/inativo) | — |
| `FaseProjeto` | As 4 fases do modelo G1: Iniciação, Planeamento, Execução e Controlo, Encerramento | `nome`, `ordem` | — |
| `CategoriaCausa` | Categorias de causa de ocorrências | `nome`, `estado` | — |
| `Projeto` | Projectos | `codigo` (único), `semaforo`, `progresso`, `validado`, `orcamentoPlaneado` | `tipo`, `fase`, `gestor` (users), `projectOwner` (users) |
| `Tarefa` | Tarefas | `estado` (pendente/em_progresso/concluida/encerrada/cancelada), `validadaPO`, `horasRetrabalho` | `projeto`, `responsavel` (users) |
| `StatusReport` | Relatórios semanais de progresso | `semana`, `progressoAcumulado`, `semaforo` | `projeto`, `autor` (users) |
| `Custo` | Custos reais (AC) | `valor`, `categoriaCusto`, `estado` (**pendente_aprovacao / aprovado / rejeitado**), `documentoSuporte` (file: pdf/jpg/jpeg/png, até 5MB) | `projeto`, `registadoPor`, `aprovadoPor` (users) |
| `Decisao` | Decisões do comité de acompanhamento | `nivelImpacto`, `participantes`, `estado` (**pendente_aprovacao / aprovado / rejeitado**) | `projeto`, `registadoPor`, `aprovadoPor` (users) |
| `Ocorrencia` | Incidentes/ocorrências de qualidade | `gravidade`, `estado`, `classificacaoRetrabalho` | `projeto`, `tarefa` (opcional), `categoria`, `registadoPor`, `ocorrenciaOrigem` (auto-relação, para retrabalho) |
| `Mitigacao` | Planos de mitigação de ocorrências | `planoResolucao`, `prazo`, `estado` | `ocorrencia`, `responsavel` (users) |
| `PedidoAlteracao` | Pedidos de alteração de orçamento/cronograma | `tipo`, `valorAnterior`, `valorProposto`, `estado` | `projeto`, `solicitadoPor` (users) |
| `LogAuditoria` | Trilha de auditoria | `acao`, `entidade`, `registoId`, `dados` (json) | `utilizador` (users) |

Campos `estado`/`select` são sempre gravados em minúsculas (ex.:
`pendente_aprovacao`) e convertidos para códigos em maiúsculas pelo adapter
(ex.: `PENDENTE_APROVACAO`) só para exibição — nunca o contrário, para evitar
o erro (já corrigido uma vez) de enviar um código em maiúsculas para um campo
`select` que só aceita minúsculas.

---

## Controlo de acesso (RBAC)

Existem 3 perfis: **Gestor**, **Project Owner**, **Administrador SIG**. O
controlo de acesso tem **duas camadas independentes**, e é importante entender
onde cada uma actua:

### 1. Perfil (papel) — aplicado em frontend e backend

Cada rota (`src/routes/AppRoutes.jsx`) e item de menu
(`src/routes/navigation.js`) declara os perfis que a podem ver. `RoleRoute`
bloqueia e redirecciona para o dashboard quem tentar aceder fora do seu
perfil. No PocketBase, cada collection tem regras de API
(`listRule`/`viewRule`/`createRule`/`updateRule`/`deleteRule`) que verificam
`@request.auth.perfil.name` — isto **é** reforçado no servidor, e é o que
realmente impede um pedido feito directamente à API (fora da app) de
contornar o controlo por perfil.

O Administrador SIG está incluído no `allow` de todas as rotas operacionais
(Projectos, Tarefas, Custos, Decisões, Ocorrências, Mitigações, Retrabalho,
Indicadores, Relatórios, Validações) para ter **visibilidade total sobre o
sistema**, mas cada página esconde os botões de criar/editar/aprovar do
Administrador (`hasRole([...])` explícito em cada botão) — o acesso dele é
sempre só de leitura fora da área de Administração.

### 2. Permissão fina (por módulo/acção) — só em frontend

Além do perfil, o Administrador SIG pode conceder ou revogar 15 permissões
específicas por perfil, em **Perfis** (`PerfisPage`):

| Permissão | Atribuída por omissão a | Controla |
|---|---|---|
| `projetos.criar` | Project Owner | Rota `/projects/new` |
| `projetos.validar` | Project Owner | Botão "Validar" na ficha do projecto |
| `alteracoes.aprovar` | Project Owner | Rota `/validations` e as suas acções |
| `tarefas.gerir` | Gestor | Rota `/tasks` e "Nova Tarefa" |
| `custos.gerir` | Gestor, Project Owner | Rota `/costs` e "Adicionar Custo" |
| `custos.aprovar` | Project Owner | Secção de aprovação em Custos |
| `decisoes.gerir` | Gestor | "Registar Decisão" |
| `decisoes.aprovar` | Project Owner | Secção de aprovação em Decisões (e a rota `/decisions`, partilhada com Gestor) |
| `ocorrencias.gerir` | Gestor | Rota `/occurrences` e "Nova Ocorrência" |
| `mitigacoes.gerir` | Gestor | "Registar Mitigação" |
| `status_reports.gerir` | Gestor, Project Owner | "Registar Status Report" |
| `utilizadores.gerir` | Administrador SIG | Rota `/users` |
| `perfis.gerir` | Administrador SIG | Rota `/perfis` |
| `dados_mestres.gerir` | Administrador SIG | Rota `/settings` |
| `auditoria.ver` | Administrador SIG | Rota `/audit` |

Mecanismo: `RoleRoute` aceita uma prop opcional `permission` (string ou
array — array quando duas permissões diferentes dão acesso à mesma rota, como
em `/decisions`); se o perfil não for Administrador, exige também
`hasPermission(permission)`, que lê o array de nomes de permissão devolvido no
login (`Perfil.permissao` expandido). **Foi testado ao vivo**: revogar
`tarefas.gerir` ao perfil Gestor bloqueia de imediato o acesso a `/tasks`,
mesmo por URL directa.

> **Importante — isto não é uma barreira de segurança ao nível da API.** As
> regras do PocketBase continuam a verificar só o *perfil* (`Gestor`,
> `Project Owner`, `Administrador SIG`), não estas 15 permissões finas — elas
> não existem como conceito no PocketBase, só na collection `Permissao` como
> dados. Um utilizador com sessão válida de Gestor pode, tecnicamente, chamar
> a API do PocketBase directamente (fora da app) e criar uma tarefa mesmo que
> o Administrador lhe tenha revogado `tarefas.gerir` — a app impede-o, a API
> não. Ver [Validação e segurança](#validação-e-segurança) para mais detalhe.

---

## Funcionalidades, módulo a módulo

### Autenticação e conta (`pages/auth/LoginPage.jsx`, `pages/profile/ProfilePage.jsx`)
Login por email/password. Conta `inativa` ou perfil não reconhecido termina a
sessão de imediato com mensagem explicativa. O ecrã de login mostra uma nota
"Esqueceu a password? Contacte o Administrador SIG" — não há recuperação por
email (sem SMTP configurado). Em **A minha conta**, qualquer utilizador altera
a própria password (exige a password actual); como o PocketBase invalida o
token de sessão ao mudar a password, a app termina a sessão automaticamente a
seguir e pede novo login.

### Dashboard (`pages/dashboard/DashboardPage.jsx`)
Painel adaptado ao perfil. Gestor/Project Owner vêem: projectos activos vs.
concluídos, ocorrências abertas (e quantas são retrabalho), projectos activos
sem status report na semana, custo real acumulado, os seis indicadores EVM
(CPI, SPI, CV, SV, BAC, EAC — cada um com tooltip explicativo ao passar o
cursor) com semáforo, a curva-S (PV/EV/AC acumulados por semana), lista de
"projectos que exigem atenção" (semáforo ≠ verde) e a distribuição de tarefas
por estado. Administrador vê uma vista mais simples, focada em volume.

### Projectos (`pages/projects/`)
- **ProjectsPage** — Project Owner e Administrador SIG vêem o portefólio
  completo; Gestor vê só os projectos que lhe estão atribuídos.
- **CreateProjectPage** — exclusivo do Project Owner. O tipo de projecto é
  carregado dinamicamente dos dados mestres **activos**. O código do projecto
  (`SONILS-xxxxx`) é gerado a partir do relógio e é único no PocketBase; se
  colidir, a criação repete automaticamente com um novo código.
- **ProjectDetailPage** — ficha do projecto com separadores (Tarefas, Status
  Reports, Custos, Decisões, Ocorrências — cada um mostra o respectivo estado
  de aprovação onde aplicável), KPIs de CPI/SPI/orçamento(BAC)/EAC/CV, e
  acções: registar Status Report (Gestor/PO), solicitar alteração de
  orçamento/cronograma (Gestor), validar o projecto (PO, antes de validado).
- **ValidationsPage** — Project Owner (Administrador só visualiza). Duas
  filas: pedidos de alteração pendentes (aprovar aplica o novo valor
  directamente ao projecto) e tarefas concluídas pelo Gestor à espera de
  validação (CSU-PO06).

### Tarefas (`pages/tasks/TasksPage.jsx`)
Criação (projecto e responsável obrigatórios) e avanço de estado: **Pendente
→ Iniciar → Em Progresso → Concluir → Concluída**. Só o Project Owner (em
Validações) fecha definitivamente a tarefa como **Encerrada**.

### Status Reports (`pages/statusReports/StatusReportsPage.jsx`)
Registo semanal (semáforo + % acumulada + resumo). A semana é calculada
automaticamente (ISO 8601, guardada como `2026-W34`, mostrada como
"Semana 34 - 2026"). Reutilizado na ficha do projecto via `StatusReportModal`.

### Custos (`pages/costs/CostsPage.jsx`)
Ver [Fluxos de aprovação](#fluxos-de-aprovação-custos-e-decisões).

### Decisões (`pages/decisions/DecisionsPage.jsx`)
Ver [Fluxos de aprovação](#fluxos-de-aprovação-custos-e-decisões).

### Ocorrências (`pages/occurrences/OccurrencesPage.jsx`)
Registo de incidentes por projecto (e opcionalmente por tarefa), com
categoria de causa **activa** e gravidade. Ao criar, é possível associar uma
**ocorrência anterior do mesmo projecto** (opcional) — ao escolher uma, a
ficha mostra um resumo dela para confirmação, e a nova ocorrência é
**classificada automaticamente como retrabalho** (RN10), sem checkbox manual.
Ocorrências de retrabalho mostram um badge clicável que leva à origem.

### Mitigações (`pages/mitigations/MitigationsPage.jsx`)
Lista de ocorrências pendentes de mitigação; registar uma mitigação (plano,
responsável, prazo) move a ocorrência para "Em Mitigação".

### Retrabalho (`pages/rework/ReworkPage.jsx`)
KPIs agregados (ocorrências de retrabalho, % de tarefas afectadas, horas
acrescidas) e uma lista de cartões **expansíveis** — cada ocorrência de
retrabalho, ao expandir, mostra: a ocorrência original (descrição, causa,
gravidade, data, quem a registou), os dados da reaparição (data de
reabertura, estado actual, quem a registou), o **histórico de mitigações**
de ambas as ocorrências, e os **responsáveis envolvidos** (quem registou cada
uma + responsáveis das mitigações, nomes resolvidos).

### Indicadores de Performance (`pages/performance/PerformancePage.jsx`)
EVM completo (PV, EV, AC, BAC, EAC, CPI, SPI) consolidado e por projecto, com
semáforo por linha e tooltip em cada coluna com sigla.

### Relatórios (`pages/reports/ReportsPage.jsx`)
Três relatórios operacionais (Gestor) ou executivos (Project Owner), gerados
a partir dos dados reais no momento do clique — exportação em **CSV** (abre
no Excel) ou vista **imprimível** (diálogo de impressão do browser → PDF).

### Administração (só Administrador SIG)
- **UsersPage** — lista com coluna **Último Login**; criação de conta (nome,
  email, perfil, password inicial); **Editar** por linha — altera nome,
  perfil, estado (ativo/inactivo), e opcionalmente **redefine a password**
  sem precisar de saber a actual (ver `manageRule` em
  [Validação e segurança](#validação-e-segurança)).
- **PerfisPage** — matriz das 15 permissões por perfil; "Guardar Permissões"
  persiste no PocketBase e tem efeito imediato (ver [RBAC](#controlo-de-acesso-rbac)).
- **SettingsPage** — Tipos de Projecto e Categorias de Causa, com **Activar/
  Desactivar** por linha (um registo inactivo desaparece dos formulários mas
  os dados existentes que o referenciam mantêm-se intactos). A gestão de
  Fases do Projecto foi retirada da interface — os dados continuam a existir
  e a ser usados internamente (fase dos projectos), só deixou de haver uma
  aba de administração para eles.
- **AuditPage** — ver [Auditoria](#auditoria).

---

## Fluxos de aprovação (Custos e Decisões)

Custos e Decisões seguem o mesmo padrão: **registo → pendente de aprovação →
Project Owner aprova ou rejeita → só depois de aprovado é considerado válido.**

1. Gestor (ou Project Owner, no caso de Custos) regista o custo/decisão; o
   PocketBase grava `estado = pendente_aprovacao` por omissão.
2. A página mostra uma secção **"Pendentes de aprovação"**, visível a quem
   tem `custos.aprovar` / `decisoes.aprovar` (Project Owner), com botões
   Aprovar/Rejeitar. Aprovar grava `estado = aprovado` e o `id` de quem
   aprovou (`aprovadoPor`); rejeitar grava `estado = rejeitado`.
3. **Só custos aprovados contam para o AC** (Custo Real Acumulado) em todo o
   sistema — Dashboard, Indicadores de Performance e o total mostrado na
   própria página de Custos. Isto está implementado em
   `services/derive.js`, que filtra `costs.filter(c => c.estado ===
   "APROVADO")` antes de somar em AC, tanto para o EVM instantâneo como para
   a série da curva-S. Um custo pendente ou rejeitado nunca infla o CPI.
4. Decisões não entram em nenhum cálculo — "entrar em vigor" é reflectido
   pelo badge de estado, visível na lista principal e na ficha do projecto.

**Upload de documento (só Custos)**: o campo "Documento de suporte" aceita
PDF, JPG, JPEG ou PNG até 5MB, gravado como ficheiro real no PocketBase (não
texto). A tabela mostra uma ligação de download quando existe documento. A
conversão para `multipart/form-data` é automática (`createRepository.js`
detecta um `File` no payload) — a página só passa o `File` como qualquer
outro campo do formulário.

---

## Análise de dados — EVM

`src/utils/evm.js` implementa o Earned Value Management usado em todo o
sistema:

| Sigla | Nome | Fórmula | Onde é derivado |
|---|---|---|---|
| PV | Valor Planeado | orçamento × fracção de tempo decorrido | `services/derive.js` |
| EV | Valor Ganho | orçamento × progresso% | `services/derive.js` |
| AC | Custo Real | soma dos custos **aprovados** do projecto | `services/derive.js` |
| BAC | Orçamento no Términus | orçamento planeado do projecto | directo do `Projeto` |
| CPI | Índice de Desempenho de Custo | EV / AC | `computeEVM()` |
| SPI | Índice de Desempenho de Prazo | EV / PV | `computeEVM()` |
| CV | Variação de Custo | EV − AC | `computeEVM()` |
| SV | Variação de Prazo | EV − PV | `computeEVM()` |
| EAC | Estimativa no Términus | BAC / CPI | `computeEVM()` |

Não existe uma collection "Indicadores" no PocketBase — `indicatorRepository`
(em `services/repositories/index.js`) deriva estes valores em tempo real a
partir de `Projeto` e `Custo` sempre que é chamado, por isso estão sempre
consistentes com o estado actual dos dados (incluindo aprovações de custos
recentes). `EVM_GLOSSARY` (mesmo ficheiro) fornece o texto de cada tooltip,
usado via atributo `title` nativo do browser — sem dependências novas.

Semáforo (`evmSemaforo`): CPI/SPI ≥ 1 → verde; ≥ 0.9 → amarelo; abaixo →
vermelho — aplicado de forma consistente no Dashboard, Indicadores e na ficha
do projecto.

---

## Auditoria

`src/services/http/audit.js` escreve em `LogAuditoria` sempre que um
repositório executa `create`/`update`/`remove` (`services/repositories/
createRepository.js` chama `logAudit()` automaticamente — nenhuma página
precisa de o fazer explicitamente). Cada registo guarda: `acao`
(criar/editar/eliminar), `entidade` (nome legível, ex. "Custo", "Utilizador"),
`registoId`, `utilizador` (quem fez a acção) e `dados` (json com um detalhe
legível — código, nome ou descrição do registo afectado).

**O que fica coberto**: toda a escrita feita através da app — incluindo
aprovar/rejeitar um custo ou decisão (é um `update`), redefinir a password de
outro utilizador, alterar permissões de um perfil, activar/desactivar um
tipo/categoria. **O que não fica coberto**: leituras (visualizar uma página
não gera auditoria — correcto, RN15 pede rasto de operações, não de acessos),
e qualquer escrita feita fora da app directamente na API do PocketBase (não
passa pelo `createRepository`).

`AuditPage` (só Administrador SIG) mostra a trilha completa com filtro por
utilizador e por acção, datas no formato `18/08/2026 22:10`
(`utils/format.js#formatDateTime`). A escrita em `LogAuditoria` é
*best-effort*: se falhar, a operação principal não é revertida (só regista
um aviso na consola do browser) — RN15 pede rastreabilidade, não pede que a
falha da auditoria bloqueie o trabalho do utilizador.

---

## Validação e segurança

Resumo do que está garantido, onde, e o que **não** está — para não criar
falsas expectativas de segurança.

**Passwords**
- Mínimo de 8 caracteres, validado no frontend antes de submeter (o
  PocketBase também rejeita menos que isso, é uma segunda barreira real).
- Alterar a própria password exige a password actual (`oldPassword`) — é o
  próprio PocketBase que impõe isto para qualquer conta normal, o frontend
  só recolhe o valor.
- O Administrador SIG redefine a password de qualquer conta **sem** saber a
  actual, através do `manageRule` da collection `users`
  (`@request.auth.perfil.name = 'Administrador SIG'`) — mecanismo nativo do
  PocketBase para gestão administrativa de contas de outros utilizadores da
  mesma collection de autenticação. Fora deste `manageRule`, ninguém consegue
  mudar a password de outra pessoa.
- Mudar uma password (própria ou por reset do Admin) faz o PocketBase rodar o
  `tokenKey` do utilizador, invalidando sessões activas — a app trata isto no
  self-service (termina a sessão e pede novo login); numa conta redefinida
  pelo Admin, a sessão dessa pessoa fica automaticamente inválida na próxima
  chamada, obrigando a novo login com a password nova.

**Controlo de acesso**
- Por perfil: reforçado em frontend (`RoleRoute`) **e** backend (regras de
  API do PocketBase) — é uma barreira real.
- Por permissão fina (os 15 itens de `PerfisPage`): reforçado **só** em
  frontend. Ver o aviso em [RBAC](#controlo-de-acesso-rbac). Se este projecto
  evoluir para produção com dados sensíveis, a forma correcta de fechar esta
  lacuna é reflectir a permissão nas regras do PocketBase (ex.: um campo
  calculado ou uma collection de permissões efectivas consultável em regra),
  não guardar a confiança só na UI.
- Uma limitação relacionada, encontrada mas não corrigida nesta intervenção:
  as regras de `updateRule` de `Custo` e `Decisao` permitem tanto ao Gestor
  como ao Project Owner actualizar o registo (para que o PO consiga aprovar)
  — mas isso também significa que, por chamada directa à API, um Gestor
  poderia tecnicamente definir o próprio `estado` como `aprovado` no que
  registou, sem passar pela aprovação do PO. A app nunca mostra essa opção
  ao Gestor, mas a regra do PocketBase não distingue "aprovar" de "editar".
  Corrigir isto exige uma regra mais fina (ex.: só permitir a um Gestor
  atualizar enquanto o `estado` permanecer `pendente_aprovacao` e não alterar
  esse campo) — fica registado aqui como algo a rever antes de produção.
- Um utilizador desactivado (`estado = inativo`) é impedido de iniciar sessão
  mesmo com a password certa (`authRepository.login`).

**Upload de ficheiros**
- Tipo e tamanho validados pelo próprio campo do PocketBase (`mimeTypes`:
  PDF/JPG/JPEG/PNG; `maxSize`: 5MB) — rejeitado no servidor mesmo que alguém
  contorne a validação do `<input accept="...">` do browser.

**Dados sensíveis**
- `.env` (com a URL do PocketBase) está no `.gitignore`.
- A password de demonstração (`Sigp@2026`) está documentada aqui de
  propósito — ambiente de desenvolvimento. **Deve ser trocada antes de
  qualquer utilização com dados reais.**
- `emailVisibility` está activo em todas as contas para que os utilizadores
  se vejam uns aos outros nas listas (necessário para a app funcionar) — não
  há dados mais sensíveis do que email/nome nas contas.

---

## Histórico de alterações

### Intervenção 1 — ligar a app a um backend real
O PocketBase já tinha um schema, mas com nomes de collections diferentes dos
que o frontend chamava, campos em falta e todas as regras de API a bloquear
tudo excepto o superuser. Reconciliados os nomes/campos, criadas as
collections `LogAuditoria` e `PedidoAlteracao`, definidas regras de API por
perfil, corrigidos vários bugs (colisão de código de projecto, falta de
tratamento de erro nos `fetch`, um bug de *Rules of Hooks* na página de
Retrabalho, um `perfilToCode` inseguro), ligados todos os botões que não
faziam nada, e removido código morto.

### Intervenção 2 — utilizadores, permissões, aprovações, UX, retrabalho
Password própria e redefinição pelo Admin; edição de utilizadores e último
login; catálogo de permissões granular com efeito real sobre páginas e
botões; visibilidade total do Administrador SIG (só leitura); pesquisa e
notificações removidas da barra superior; sidebar em overlay para mobile;
correcções de layout no Dashboard; BAC/EAC e tooltips no EVM; datas e semanas
em formato amigável; fluxo de aprovação com upload de documento em Custos;
fluxo de aprovação em Decisões; associação a ocorrência anterior com
classificação automática de retrabalho e página de Retrabalho enriquecida;
activar/desactivar dados mestres em vez de eliminar; aba de Fases removida da
interface. Durante os testes em browser foram encontrados e corrigidos mais
4 bugs reais: invalidação de sessão ao mudar a própria password (a app
ficava "autenticada" mas com listas vazias em todo o lado), rota
`/decisions` inacessível ao Project Owner (impedia-o de aprovar), modais
mais altos que o ecrã sem scroll (botão "Guardar" inacessível), e recorte de
texto em indicadores grandes em ecrãs estreitos.

---

## O que falta / limitações conhecidas

- **Sem edição/eliminação** de Ocorrências e Status Reports depois de
  criados — só criar e listar. Custos e Decisões agora têm uma transição de
  estado (aprovar/rejeitar), mas não edição livre dos restantes campos.
- **Não há forma de fechar uma ocorrência.** Passa a "Em Mitigação" ao
  registar uma mitigação, mas nada a move a "Encerrada" — falta uma acção
  (ex.: "Marcar mitigação como concluída") que feche o ciclo.
- **Permissões finas só têm efeito na app, não na API** — ver
  [Validação e segurança](#validação-e-segurança).
- **`updateRule` de Custo/Decisao não distingue "editar" de "aprovar"** ao
  nível do PocketBase — ver [Validação e segurança](#validação-e-segurança).
- **Criação de utilizador não envia email.** O Administrador define a
  password inicial e comunica-a por fora do sistema.
- **Exportação em PDF é via impressão do browser**, não geração real de PDF.
- **Sem paginação.** Todas as listas usam `getFullList()` — adequado ao
  volume actual, mas vai degradar com muitos registos.
- **Sem testes automatizados** nem `error boundary` React.
