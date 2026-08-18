import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useFetch } from "../../hooks/useFetch";
import { projectRepository } from "../../services/repositories";
import { PERFIS } from "../../constants/roles";
import { FASES } from "../../constants/enums";
import { formatAOA } from "../../utils/format";
import PageHeader from "../../components/layout/PageHeader";
import Table from "../../components/data/Table";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import SemaphoreBadge from "../../components/charts/SemaphoreBadge";
import Loader from "../../components/feedback/Loader";
import ErrorState from "../../components/feedback/ErrorState";
import Icon from "../../components/ui/Icon";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwner = user.perfil === PERFIS.PROJECT_OWNER;

  // Gestor vê apenas os projectos que lhe estão atribuídos (CSU-GP01);
  // Project Owner vê o portefólio completo (CSU-PO02).
  const { data, loading, error } = useFetch(
    () => projectRepository.list(isOwner ? undefined : (p) => p.gestorId === user.id),
    [user.id]
  );
  if (loading) return <Loader />;
  if (error) return <ErrorState />;

  const columns = [
    { key: "codigo", header: "Código", render: (r) => <strong>{r.codigo}</strong> },
    { key: "nome", header: "Projecto" },
    { key: "cliente", header: "Direcção" },
    { key: "fase", header: "Fase", render: (r) => FASES[r.fase] },
    { key: "progresso", header: "Progresso", align: "right", render: (r) => <span className="mono">{r.progresso}%</span> },
    { key: "orcamentoPlaneado", header: "Orçamento", align: "right", render: (r) => <span className="mono">{formatAOA(r.orcamentoPlaneado)}</span> },
    { key: "semaforo", header: "Estado", render: (r) => <SemaphoreBadge value={r.semaforo} /> },
  ];

  return (
    <>
      <PageHeader
        eyebrow={isOwner ? "Portefólio" : "Os meus projectos"}
        title="Projectos"
        description={isOwner
          ? "Todos os projectos da carteira, com fase, progresso e semáforo de saúde."
          : "Projectos sob a sua responsabilidade operacional."}
        actions={isOwner
          ? <Button icon={<Icon name="plus" size={16} />} onClick={() => navigate("/projects/new")}>Criar Projecto</Button>
          : null}
      />
      <Table columns={columns} rows={data} onRowClick={(r) => navigate(`/projects/${r.id}`)} />
    </>
  );
}
