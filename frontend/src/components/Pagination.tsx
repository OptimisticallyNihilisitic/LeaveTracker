const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Build window of up to 5 page numbers centred on currentPage
  const getPages = () => {
    const pages: number[] = [];
    const delta = 2;
    const left = Math.max(1, currentPage - delta);
    const right = Math.min(totalPages, currentPage + delta);
    for (let i = left; i <= right; i++) pages.push(i);
    return pages;
  };

  const pages = getPages();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-2 pt-4 pb-1">
      {/* Left: rows per page selector + showing info */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer appearance-none pr-6"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <span className="text-xs text-slate-400">
          Showing{" "}
          <span className="text-slate-600 font-semibold">{startItem}–{endItem}</span>
          {" "}of{" "}
          <span className="text-slate-600 font-semibold">{totalItems}</span>{" "}
          entries
        </span>
      </div>

      {/* Right: navigation — only shown when there are multiple pages */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* Previous */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
          >
            ‹ Prev
          </button>

          {/* Leading ellipsis */}
          {pages[0] > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="w-8 h-8 text-xs font-semibold rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors bg-white"
              >
                1
              </button>
              {pages[0] > 2 && <span className="px-1 text-xs text-slate-400">…</span>}
            </>
          )}

          {/* Page pills */}
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 text-xs font-semibold rounded-lg border transition-colors ${
                p === currentPage
                  ? "bg-slate-800 border-slate-800 text-white"
                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              {p}
            </button>
          ))}

          {/* Trailing ellipsis */}
          {pages[pages.length - 1] < totalPages && (
            <>
              {pages[pages.length - 1] < totalPages - 1 && (
                <span className="px-1 text-xs text-slate-400">…</span>
              )}
              <button
                onClick={() => onPageChange(totalPages)}
                className="w-8 h-8 text-xs font-semibold rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors bg-white"
              >
                {totalPages}
              </button>
            </>
          )}

          {/* Next */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}
