import BookingWizard from '../components/BookingWizard.jsx'

export default function BookTickets() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <div className="text-xs font-semibold tracking-wide text-nature-800">Booking</div>
        <div className="mt-1 text-3xl font-semibold text-slate-900">Book tickets</div>
        <div className="mt-1 text-sm text-slate-600">
          Select a location, choose ticket categories, complete payment simulation, and download your QR tickets.
        </div>
      </div>
      <BookingWizard />
    </div>
  )
}

