import type { Metadata } from 'next'
import Link from 'next/link'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Contact Us | MahaTathastu',
  description: 'Get in touch with MahaTathastu for Vedic consultations, service bookings, or any queries.',
  alternates: { canonical: '/contact' },
}

const CONTACT_INFO = [
  {
    icon: 'call',
    label: 'Phone / WhatsApp',
    value: '+91 92748 15269 / +91 9858784784',
    href: 'tel:+919274815269',
    whatsapp: 'https://wa.me/919274815269',
    desc: 'Mon – Sat · 10 AM – 7 PM IST',
  },
  {
    icon: 'mail',
    label: 'Email',
    value: 'info@mahatathastu.com',
    href: 'mailto:info@mahatathastu.com',
    desc: 'We respond within 24 hours',
  },
  {
    icon: 'location_on',
    label: 'Address',
    value: 'FF-108, SIDDHARTH MAGNUM PLUS, TARSALI, VADODARA, GUJARAT',
    desc: 'By appointment only',
  },
]

const SOCIAL = [
  { icon: 'photo_camera', label: 'Instagram', href: 'https://www.instagram.com/mahatathastu', color: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' },
  { icon: 'play_circle', label: 'YouTube', href: 'https://www.youtube.com/@mahatathastu', color: '#FF0000' },
  { icon: 'groups', label: 'Facebook', href: 'https://www.facebook.com/mahatathastu', color: '#1877F2' },
  { icon: 'chat', label: 'WhatsApp', href: 'https://wa.me/919274815269', color: '#25D366' },
]

const BUSINESS_HOURS = [
  { day: 'Monday – Friday', hours: '10:00 AM – 7:00 PM' },
  { day: 'Saturday', hours: '10:00 AM – 5:00 PM' },
  { day: 'Sunday', hours: 'Closed' },
  { day: 'Consultations (Online)', hours: '5:00 PM – 11:00 PM (Daily)' },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="page-banner">
        <div className="page-banner-inner max-w-2xl mx-auto">
          <p className="text-[var(--saffron)] text-xs font-bold tracking-[0.2em] uppercase mb-4">Reach Out</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Contact Us</h1>
          <div className="ornate-divider">
            <span className="material-symbols-outlined text-[14px] text-[var(--terracotta)]" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
          </div>
          <p className="text-white/65 text-lg">We are here to guide you on your spiritual journey</p>
        </div>
      </section>

      <section className="py-14 px-6 bg-[var(--kutch-white)]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Contact Cards */}
          <div className="lg:col-span-2 space-y-5">
            {/* Quick Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Call / WhatsApp */}
              <div className="card-divine p-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-emerald-600 text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
                </div>
                <p className="text-xs font-bold text-[var(--warm-charcoal)]/40 uppercase tracking-widest mb-1">Phone / WhatsApp</p>
                <p className="text-xl font-bold text-[var(--indigo-deep)] mb-1">+91 92748 15269</p>
                <p className="text-sm font-semibold text-[var(--indigo-deep)]/70 mb-1">+91 98587 84784</p>
                <p className="text-xs text-[var(--warm-charcoal)]/50 mb-4">Mon – Sat · 10 AM – 7 PM IST</p>
                <div className="flex gap-2">
                  <a href="tel:+919274815269"
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl text-white"
                    style={{ background: 'var(--indigo-deep)' }}>
                    <span className="material-symbols-outlined text-[14px]">call</span> Call
                  </a>
                  <a href="https://wa.me/919274815269" target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl text-white"
                    style={{ background: '#25D366' }}>
                    <span className="material-symbols-outlined text-[14px]">chat</span> WhatsApp
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="card-divine p-6">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-violet-600 text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
                </div>
                <p className="text-xs font-bold text-[var(--warm-charcoal)]/40 uppercase tracking-widest mb-1">Email</p>
                <p className="text-base font-bold text-[var(--indigo-deep)] mb-1 break-all">info@mahatathastu.com</p>
                <p className="text-xs text-[var(--warm-charcoal)]/50 mb-4">We respond within 24 hours</p>
                <a href="mailto:info@mahatathastu.com"
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl text-white"
                  style={{ background: 'var(--plum)' }}>
                  <span className="material-symbols-outlined text-[14px]">send</span> Send Email
                </a>
              </div>
            </div>

            {/* Social Media */}
            <div className="card-divine p-6">
              <h2 className="text-lg font-bold text-[var(--indigo-deep)] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Follow Us</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SOCIAL.map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all hover:scale-105"
                    style={{ background: typeof s.color === 'string' && s.color.includes('gradient') ? s.color : s.color + '15', border: `1.5px solid ${s.color.includes('gradient') ? 'rgba(240,148,51,0.3)' : s.color + '40'}` }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      style={{ background: s.color }}>
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                    </div>
                    <span className="text-xs font-bold text-[var(--warm-charcoal)]/70">{s.label}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="card-divine p-6">
              <h2 className="text-lg font-bold text-[var(--indigo-deep)] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: 'support_agent', label: 'Book a Consultation', href: '/consultations', color: 'var(--indigo-deep)' },
                  { icon: 'description', label: 'Get Your Report', href: '/reports/generate', color: 'var(--terracotta)' },
                  { icon: 'school', label: 'Browse Courses', href: '/gyanampeetham', color: '#7c3aed' },
                  { icon: 'mail', label: 'Send a Message', href: '/mailbox', color: 'var(--plum)' },
                ].map(item => (
                  <Link key={item.href} href={item.href}
                    className="flex items-center gap-3 p-4 rounded-xl border border-[var(--warm-sand)] hover:border-[var(--indigo-deep)] transition-all group">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                      style={{ background: item.color }}>
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                    </div>
                    <span className="text-sm font-semibold text-[var(--warm-charcoal)]/70 group-hover:text-[var(--indigo-deep)] transition-colors">{item.label}</span>
                    <span className="material-symbols-outlined text-[16px] text-[var(--warm-charcoal)]/30 group-hover:text-[var(--indigo-deep)] ml-auto transition-colors">arrow_forward</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Business Hours */}
            <div className="card-divine p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[20px] text-[var(--saffron)]" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                <h2 className="text-base font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>Business Hours</h2>
              </div>
              <div className="space-y-3">
                {BUSINESS_HOURS.map(({ day, hours }) => (
                  <div key={day} className="flex justify-between text-sm">
                    <span className="text-[var(--warm-charcoal)]/60">{day}</span>
                    <span className={`font-semibold ${hours === 'Closed' ? 'text-red-500' : 'text-[var(--indigo-deep)]'}`}>{hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Address */}
            <div className="card-divine p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[20px] text-[var(--terracotta)]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                <h2 className="text-base font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>Address</h2>
              </div>
              <p className="text-sm text-[var(--warm-charcoal)]/70 leading-relaxed">
                FF-108, SIDDHARTH MAGNUM PLUS<br />
                TARSALI, VADODARA, GUJARAT<br />
                <span className="text-xs text-[var(--warm-charcoal)]/40 mt-1 block">Visits by prior appointment only</span>
              </p>
              <a href="https://wa.me/919274815269?text=I%20would%20like%20to%20schedule%20an%20appointment"
                target="_blank" rel="noopener noreferrer"
                className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl text-white"
                style={{ background: '#25D366' }}>
                <span className="material-symbols-outlined text-[14px]">chat</span> Schedule Appointment
              </a>
            </div>

            {/* About us snippet */}
            <div className="rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg, var(--indigo-deep) 0%, var(--plum) 100%)' }}>
              <p className="text-white/90 text-sm leading-relaxed font-medium" style={{ fontFamily: "'Playfair Display', serif" }}>
                "India's first comprehensive holistic life platform — combining Vedic wisdom with modern guidance."
              </p>
              <Link href="/about" className="mt-4 inline-flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors">
                Learn more about us <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
