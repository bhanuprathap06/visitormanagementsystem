import { useMemo, useState } from 'react'

const zones = [
  { id: 'africa', label: 'Africa Zone', color: 'fill-amber-200 hover:fill-amber-300' },
  { id: 'asia', label: 'Asia Zone', color: 'fill-emerald-200 hover:fill-emerald-300' },
  { id: 'aquarium', label: 'Aquarium', color: 'fill-sky-200 hover:fill-sky-300' },
  { id: 'aviary', label: 'Aviary', color: 'fill-teal-200 hover:fill-teal-300' },
]

const zoneExhibits = [
  { id: 1, zone: 'asia', name: 'Bengal Tiger', desc: 'Big cat habitat with enrichment activities.' },
  { id: 2, zone: 'asia', name: 'Asian Elephant', desc: 'Feeding times and guided talks.' },
  { id: 3, zone: 'aquarium', name: 'Penguin Cove', desc: 'Cold-water exhibit with scheduled shows.' },
  { id: 4, zone: 'aviary', name: 'Bird Aviary', desc: 'Walk-through aviary with colorful species.' },
  { id: 5, zone: 'africa', name: 'Savannah Trail', desc: 'Giraffe and zebra viewing points.' },
]

export default function ZooMap() {
  const [selected, setSelected] = useState('asia')

  const list = useMemo(() => zoneExhibits.filter((e) => e.zone === selected), [selected])
  const selectedZone = zones.find((z) => z.id === selected)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-wide text-nature-800">Interactive</div>
          <div className="mt-1 text-3xl font-semibold text-slate-900">Zoo map</div>
          <div className="mt-1 text-sm text-slate-600">
            Click a zone to view exhibits. This uses an SVG map so it’s lightweight and responsive.
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-900">
          Selected: {selectedZone?.label}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 overflow-hidden">
          <div className="text-sm font-semibold text-slate-900">Map</div>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 overflow-auto">
            <svg viewBox="0 0 520 320" className="w-full h-auto">
              <rect x="0" y="0" width="520" height="320" className="fill-slate-100" />

              <path
                d="M35,60 h190 v90 h-190 z"
                className={['cursor-pointer transition-colors stroke-slate-400', zones[0].color, selected === 'africa' ? 'stroke-amber-600 stroke-2' : ''].join(' ')}
                onClick={() => setSelected('africa')}
              />
              <path
                d="M245,40 h240 v110 h-240 z"
                className={['cursor-pointer transition-colors stroke-slate-400', zones[1].color, selected === 'asia' ? 'stroke-emerald-700 stroke-2' : ''].join(' ')}
                onClick={() => setSelected('asia')}
              />
              <path
                d="M60,170 h210 v120 h-210 z"
                className={['cursor-pointer transition-colors stroke-slate-400', zones[2].color, selected === 'aquarium' ? 'stroke-sky-700 stroke-2' : ''].join(' ')}
                onClick={() => setSelected('aquarium')}
              />
              <path
                d="M300,180 h185 v100 h-185 z"
                className={['cursor-pointer transition-colors stroke-slate-400', zones[3].color, selected === 'aviary' ? 'stroke-teal-700 stroke-2' : ''].join(' ')}
                onClick={() => setSelected('aviary')}
              />

              <text x="130" y="110" className="fill-slate-700 text-[14px] font-semibold" textAnchor="middle">
                Africa
              </text>
              <text x="365" y="95" className="fill-slate-700 text-[14px] font-semibold" textAnchor="middle">
                Asia
              </text>
              <text x="165" y="235" className="fill-slate-700 text-[14px] font-semibold" textAnchor="middle">
                Aquarium
              </text>
              <text x="392" y="235" className="fill-slate-700 text-[14px] font-semibold" textAnchor="middle">
                Aviary
              </text>
            </svg>
          </div>
          <div className="mt-3 text-xs text-slate-600">Tip: Use this in your report as an example of interactive UI.</div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">Exhibits in {selectedZone?.label}</div>
          <div className="mt-4 grid gap-3">
            {list.map((e) => (
              <div key={e.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-sm font-semibold text-slate-900">{e.name}</div>
                <div className="mt-1 text-sm text-slate-600">{e.desc}</div>
              </div>
            ))}
            {list.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                No exhibits configured for this zone yet.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

