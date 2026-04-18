import { useState } from 'react'

export default function Accordion({ items }) {
  const [openId, setOpenId] = useState(items?.[0]?.id || null)

  return (
    <div className="grid gap-2">
      {(items || []).map((it) => {
        const open = openId === it.id
        return (
          <div key={it.id} className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
            <button
              onClick={() => setOpenId(open ? null : it.id)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <div>
                <div className="text-sm font-semibold text-slate-900">{it.q}</div>
                {it.tag ? <div className="mt-1 text-xs text-slate-600">{it.tag}</div> : null}
              </div>
              <div className={['h-8 w-8 rounded-2xl border flex items-center justify-center', open ? 'border-nature-800 bg-nature-800 text-white' : 'border-slate-200 bg-white text-slate-700'].join(' ')}>
                {open ? '−' : '+'}
              </div>
            </button>
            {open ? <div className="px-5 pb-5 text-sm text-slate-700">{it.a}</div> : null}
          </div>
        )
      })}
    </div>
  )
}

