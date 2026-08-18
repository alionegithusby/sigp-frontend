// Exportação leve de tabelas — sem dependências externas.
// "Excel": gera um CSV (abre nativamente no Excel).
// "PDF": abre uma vista imprimível numa nova janela (Guardar como PDF via imprimir).

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportCSV(filename, columns, rows) {
  const header = columns.map((c) => csvCell(c.header)).join(";");
  const body = rows.map((r) => columns.map((c) => csvCell(c.value(r))).join(";")).join("\n");
  const csv = "﻿" + header + "\n" + body;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportPrintable(title, columns, rows) {
  const win = window.open("", "_blank");
  if (!win) return;
  const thead = columns.map((c) => `<th>${c.header}</th>`).join("");
  const tbody = rows.map((r) => `<tr>${columns.map((c) => `<td>${c.value(r)}</td>`).join("")}</tr>`).join("");
  win.document.write(`<!doctype html><html><head><title>${title}</title><style>
    body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#111}
    h1{font-size:18px;margin-bottom:4px}
    p{color:#666;font-size:12px;margin-top:0}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th,td{border:1px solid #ddd;padding:6px 10px;font-size:12px;text-align:left}
    th{background:#f4f4f4}
  </style></head><body>
    <h1>${title}</h1>
    <p>SIGP · SONILS · gerado em ${new Date().toLocaleString("pt-PT")}</p>
    <table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
  </body></html>`);
  win.document.close();
  win.focus();
  win.print();
}
