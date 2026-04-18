import Accordion from '../components/Accordion.jsx'

const sections = [
  {
    title: 'Tickets',
    items: [
      {
        id: 't1',
        q: 'Can I book tickets without an account?',
        a: 'Yes. Guest checkout is supported. If you create an account, you’ll also get booking history and quick access to downloadable QR tickets.',
      },
      {
        id: 't2',
        q: 'How is ticket availability calculated?',
        a: 'Availability is computed per location per date using daily capacity limits. The public website shows remaining tickets in real-time based on the database.',
      },
      {
        id: 't3',
        q: 'What happens if payment fails?',
        a: 'This project uses a mock payment simulator with a 90% success rate. On failure, the booking is not created and you can retry safely.',
      },
    ],
  },
  {
    title: 'Entry rules',
    items: [
      {
        id: 'e1',
        q: 'How does the QR gate entry work?',
        a: 'At entry, staff scan your QR to mark the ticket as used and create a VISIT record. At exit, staff scan again to set exit time and calculate visit duration.',
      },
      {
        id: 'e2',
        q: 'Can I use a ticket for a different location?',
        a: 'No. Tickets are location-specific. The gate scanner validates the location and ticket validity before confirming entry.',
      },
    ],
  },
  {
    title: 'Facilities & accessibility',
    items: [
      {
        id: 'f1',
        q: 'Is the platform mobile-friendly?',
        a: 'Yes. The public site is mobile-first and responsive. QR download works on mobile devices and can be shown directly on-screen at the gate.',
      },
      {
        id: 'f2',
        q: 'What if I lose my QR ticket?',
        a: 'If you booked with an account, you can log in and download the QR again from “My Tickets”. Guest bookings are displayed after checkout on the success screen.',
      },
    ],
  },
]

export default function FAQ() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div>
        <div className="text-xs font-semibold tracking-wide text-nature-800">Help</div>
        <div className="mt-1 text-3xl font-semibold text-slate-900">Frequently asked questions</div>
        <div className="mt-1 text-sm text-slate-600">Everything you need to know about booking and entry.</div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3 lg:items-start">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-nature-800 to-nature-950 p-5 text-white lg:sticky lg:top-20">
          <div className="text-sm font-semibold">Quick tips</div>
          <ul className="mt-3 grid gap-2 text-sm text-white/85 list-disc pl-5">
            <li>Book early on weekends to secure slots.</li>
            <li>Keep your QR ready at entry and exit.</li>
            <li>Use “My Tickets” for fast re-download.</li>
          </ul>
        </div>

        <div className="lg:col-span-2 grid gap-8">
          {sections.map((s) => (
            <div key={s.title}>
              <div className="text-lg font-semibold text-slate-900">{s.title}</div>
              <div className="mt-3">
                <Accordion items={s.items} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

