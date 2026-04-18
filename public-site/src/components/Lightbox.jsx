import { useEffect } from 'react'

export default function Lightbox({ open, onClose, children, title = 'Preview' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60"
        aria-label="Close preview"
      />
      <div className="relative w-full max-w-4xl rounded-3xl border border-white/15 bg-white shadow-glass overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
        <div className="max-h-[75vh] overflow-auto bg-slate-50 p-4">{children}</div>
      </div>
    </div>
  )
}

