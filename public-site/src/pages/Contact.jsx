import { useState } from 'react'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  const onSubmit = (e) => {
    e.preventDefault()
    setSent(true)
    setTimeout(() => setSent(false), 4000)
    setForm({ name: '', email: '', message: '' })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div>
          <div className="text-xs font-semibold tracking-wide text-nature-800">Support</div>
          <div className="mt-1 text-3xl font-semibold text-slate-900">Contact us</div>
          <div className="mt-2 text-sm text-slate-600">
            This is a mock contact flow for your final-year project demo. The backend can be extended to store messages or send emails.
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-nature-800 to-nature-950 p-5 text-white">
            <div className="text-sm font-semibold">Office hours</div>
            <div className="mt-1 text-sm text-white/85">Mon–Sat • 9:00 AM – 6:00 PM</div>
            <div className="mt-4 grid gap-2 text-sm text-white/85">
              <div>
                <span className="font-semibold text-white">Email:</span> support@vms-tours.local
              </div>
              <div>
                <span className="font-semibold text-white">Phone:</span> +91 90000 00000
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {sent ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Message submitted. We’ll get back to you soon.
            </div>
          ) : null}
          <form onSubmit={onSubmit} className="grid gap-4">
            <div>
              <label className="text-sm font-medium text-slate-800">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm"
                placeholder="Your full name"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-800">Email</label>
              <input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-800">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="mt-2 w-full min-h-36 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm"
                placeholder="How can we help?"
                required
              />
            </div>
            <button className="rounded-2xl bg-nature-800 px-5 py-3 text-sm font-semibold text-white hover:bg-nature-700">
              Submit message
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

