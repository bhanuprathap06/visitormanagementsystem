import { QRCodeCanvas } from 'qrcode.react'
import { useMemo } from 'react'

function downloadCanvasPng(canvas, filename) {
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export default function QRTicket({ value, title = 'Ticket QR', subtitle, filename = 'ticket-qr.png' }) {
  const canvasId = useMemo(() => `qr_${Math.random().toString(16).slice(2)}`, [])

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          {subtitle ? <div className="text-xs text-slate-600">{subtitle}</div> : null}
        </div>
        <button
          onClick={() => {
            const canvas = document.getElementById(canvasId)
            if (canvas) downloadCanvasPng(canvas, filename)
          }}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Download PNG
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center rounded-2xl bg-slate-50 p-4">
        <QRCodeCanvas id={canvasId} value={String(value || '')} size={196} includeMargin />
      </div>

      <div className="mt-3 text-xs text-slate-500 break-all">{String(value || '')}</div>
    </div>
  )
}

