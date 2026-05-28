import { ReactNode } from "react";

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  totalCount?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
}

function Pagination({
  total,
  current,
  pageSize,
  onPageChange,
}: {
  total: number;
  current: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  const pages: (number | "...")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1, 2, 3, "...", totalPages);
  }

  return (
    <div className="bg-[#1e222a] px-6 py-4 border-t border-[#2d333b] flex items-center justify-between">
      <p className="text-xs text-[#8b949e] font-medium">
        Showing <span className="text-gray-200">{Math.min((current - 1) * pageSize + 1, total)}–{Math.min(current * pageSize, total)}</span> of{" "}
        <span className="text-gray-200">{total.toLocaleString()}</span> entries
      </p>
      <div className="flex items-center gap-1.5">
        <button
          disabled={current === 1}
          onClick={() => onPageChange(current - 1)}
          className="w-8 h-8 flex items-center justify-center rounded border border-[#2d333b] bg-[#1a1d23] text-[#8b949e] hover:border-gray-500 disabled:opacity-40"
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={i} className="px-1 text-[#8b949e]">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={[
                "w-8 h-8 flex items-center justify-center rounded text-xs font-bold",
                current === p
                  ? "bg-[#8b1a1a] text-white"
                  : "border border-[#2d333b] bg-[#1a1d23] text-[#8b949e] hover:border-gray-500",
              ].join(" ")}
            >
              {p}
            </button>
          )
        )}
        <button
          disabled={current === totalPages}
          onClick={() => onPageChange(current + 1)}
          className="w-8 h-8 flex items-center justify-center rounded border border-[#2d333b] bg-[#1a1d23] text-[#8b949e] hover:border-gray-500 disabled:opacity-40"
        >
          ›
        </button>
      </div>
    </div>
  );
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  totalCount,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  isLoading = false,
}: DataTableProps<T>) {
  return (
    <div className="bg-[#1a1d23] border border-[#2d333b] rounded-xl overflow-hidden" data-animate>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1e222a] text-[#8b949e] text-[11px] font-bold uppercase tracking-widest border-b border-[#2d333b]">
              {columns.map((col) => (
                <th key={String(col.key)} className={`px-6 py-4 ${col.className ?? ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2d333b]">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-[#8b949e]">
                  Loading…
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-[#8b949e]">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={String(row[keyField])}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className={`px-6 py-5 align-top ${col.className ?? ""}`}>
                      {col.render
                        ? col.render(row)
                        : String(row[col.key as keyof T] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalCount && onPageChange && (
        <Pagination
          total={totalCount}
          current={currentPage}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
