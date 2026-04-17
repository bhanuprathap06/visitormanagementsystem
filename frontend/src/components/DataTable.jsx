function SkeletonRow({ cols }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="skeleton-shimmer h-4 rounded-lg" style={{ width: `${60 + Math.random() * 30}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function DataTable({ columns, data, loading, emptyMsg = 'No records found' }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(226,232,240,0.8)' }}>
            {columns.map((col) => (
              <th key={col.key}
                className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap bg-slate-50/80">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={columns.length} />)
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-16">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl opacity-30">📭</span>
                  <p className="text-slate-400 text-sm font-medium">{emptyMsg}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i}
                className="group transition-colors duration-150 hover:bg-indigo-50/40"
                style={{ borderBottom: '1px solid rgba(241,245,249,1)' }}>
                {columns.map((col) => (
                  <td key={col.key}
                    className="px-5 py-3.5 text-sm text-slate-700 whitespace-nowrap">
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? <span className="text-slate-300">—</span>)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {!loading && data.length > 0 && (
        <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400 font-medium">{data.length} record{data.length !== 1 ? 's' : ''}</p>
        </div>
      )}
    </div>
  );
}
