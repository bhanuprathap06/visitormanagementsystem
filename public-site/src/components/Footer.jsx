import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <span className="text-white font-black text-lg">V</span>
              </div>
              <div>
                <div className="font-black text-xl tracking-tight">VMS<span className="font-light">Tours</span></div>
                <div className="text-xs text-gray-400">Zoo • Museum • Garden • Aquarium</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Book tickets instantly, explore immersive exhibits, and enjoy a seamless entry experience
              powered by real-time QR-based gate validation.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <div className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-4">Explore</div>
            <div className="grid gap-2">
              {[
                { to: '/', label: 'Home' },
                { to: '/tickets', label: 'Book Tickets' },
                { to: '/events', label: 'News & Events' },
                { to: '/exhibits', label: 'Exhibits' },
                { to: '/animals', label: 'Our Animals' },
                { to: '/my-tickets', label: 'My Tickets' },
              ].map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Support */}
          <div>
            <div className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-4">Support</div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              For booking assistance or entry issues, reach out via the contact form. Our team typically
              responds within 24 hours.
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <div><span className="text-white font-medium">Zoo timing:</span> 9:00 AM – 5:00 PM</div>
              <div><span className="text-white font-medium">Ticket booking closes:</span> 4:00 PM</div>
              <div className="mt-4 text-xs text-gray-500 border-l-2 border-yellow-500 pl-3 leading-relaxed">
                Online Tickets once booked cannot be Cancelled / Refunded, but can be rescheduled from your profile.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-500">© {new Date().getFullYear()} VMS Tours. All rights reserved.</div>
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <span>Wildlife Parks</span>
            <span>•</span>
            <span>Museums</span>
            <span>•</span>
            <span>Botanical Gardens</span>
            <span>•</span>
            <span>Aquariums</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
