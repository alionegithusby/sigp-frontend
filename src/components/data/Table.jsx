import EmptyState from "./EmptyState";
import "./Table.css";

// columns: [{ key, header, render?, align? }]
export default function Table({ columns, rows, rowKey = "id", onRowClick, empty }) {
  if (!rows?.length) return empty !== undefined ? empty : <EmptyState message="Sem registos para mostrar." />;
  return (
    <div className="table-wrap card">
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ textAlign: c.align || "left" }}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row[rowKey]}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? "table__row--click" : ""}
            >
              {columns.map((c) => (
                <td key={c.key} style={{ textAlign: c.align || "left" }}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
