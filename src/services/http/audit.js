// Auditoria — regista criar/editar/eliminar em LogAuditoria (best-effort).
import { pb } from "./pocketbase";

export async function logAudit(acao, entidade, rec, registoId) {
  try {
    const uid = pb?.authStore?.record?.id;
    if (!uid) return;
    const detalhe =
      rec?.codigo || rec?.nome || rec?.descricao || rec?.email || registoId || "";
    await pb.collection("LogAuditoria").create({
      acao,
      entidade,
      registoId: registoId || rec?.id || "",
      utilizador: uid,
      dados: { detalhe: String(detalhe) },
    });
  } catch (err) {
    // Auditoria nunca quebra a operação principal — mas fica visível em consola.
    console.warn("Falha ao registar auditoria:", err);
  }
}
