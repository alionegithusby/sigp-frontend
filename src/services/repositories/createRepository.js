import { pb } from "../http/pocketbase";
import { logAudit } from "../http/audit";

// Se o payload tiver um File/Blob (upload de documento), o PocketBase precisa
// de multipart/form-data em vez de JSON — convertemos automaticamente para
// que as telas continuem a chamar repository.create(...) exactamente da
// mesma forma, com ou sem ficheiro.
function toBody(payload) {
  const hasFile = Object.values(payload).some((v) => v instanceof File || v instanceof Blob);
  if (!hasFile) return payload;
  const fd = new FormData();
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== undefined && v !== null) fd.append(k, v);
  });
  return fd;
}

/**
 * Fábrica de repositórios — apenas PocketBase (sem mock).
 * As telas continuam a chamar list/getById/create/update/remove e recebem
 * as mesmas shapes de sempre, graças ao adapter (toUI/toPB/expand).
 */
export function createRepository(collection, adapter = {}) {
  const expand = adapter.expand || "";
  const entidade = adapter.entidade || collection;
  const toUI = adapter.toUI || ((r) => r);
  const toPB = adapter.toPB || ((d) => d);
  const opts = expand ? { expand } : {};

  return {
    // As telas passam um predicado JS sobre a shape de UI: buscamos, mapeamos e filtramos.
    list: async (filter) => {
      const recs = await pb.collection(collection).getFullList({ sort: "-created", ...opts });
      const items = recs.map(toUI);
      return filter ? items.filter(filter) : items;
    },
    getById: async (id) => toUI(await pb.collection(collection).getOne(id, opts)),
    create: async (data) => {
      const rec = await pb.collection(collection).create(toBody(await toPB(data)), opts);
      const ui = toUI(rec);
      if (collection !== "LogAuditoria") logAudit("criar", entidade, ui, rec.id);
      return ui;
    },
    update: async (id, data) => {
      const rec = await pb.collection(collection).update(id, toBody(await toPB(data)), opts);
      const ui = toUI(rec);
      if (collection !== "LogAuditoria") logAudit("editar", entidade, ui, rec.id);
      return ui;
    },
    remove: async (id) => {
      await pb.collection(collection).delete(id);
      if (collection !== "LogAuditoria") logAudit("eliminar", entidade, { id }, id);
      return true;
    },
  };
}
