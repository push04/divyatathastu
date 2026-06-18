import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | MahaTathastu',
  description: 'How MahaTathastu collects, uses, and protects your personal data.',
}

const SECTIONS = [
  {
    id: 'information',
    title: '1. Information We Collect',
    content: `We collect information you provide directly when you:

**Account Registration:** Full name, email address, phone number, and password (stored encrypted).

**Family Member Profiles:** Birth date, birth time, birth city/place, and name of family members you add. This data is used solely to generate Vedic reports.

**Purchase Information:** We collect order details and billing information. Payment card data is processed exclusively by Razorpay (PCI-DSS compliant) and is never stored on our servers.

**Usage Data:** Pages visited, features used, and device information (browser type, IP address) for improving the platform. This data is anonymized and aggregated.

**Communications:** Messages you send to our support team via WhatsApp or email.`,
  },
  {
    id: 'usage',
    title: '2. How We Use Your Information',
    content: `We use your information exclusively to:

- Generate personalized Vedic reports, Kundli charts, and holistic analyses
- Deliver purchased digital products (reports, ebooks) to your dashboard
- Send order confirmations and receipt emails
- Send our optional Adhyatmic Digest newsletter (only if you subscribe)
- Respond to support queries and provide customer service
- Improve our AI engine and report accuracy (using aggregated, anonymized data only)
- Comply with applicable Indian laws and regulations

**We do not use your data for advertising. We do not sell or rent your data to any third party.**`,
  },
  {
    id: 'storage',
    title: '3. Data Storage & Security',
    content: `Your data is stored on Supabase infrastructure hosted in Singapore (AWS ap-southeast-1 region), protected by:

- AES-256 encryption at rest for all database records
- TLS 1.3 encryption in transit for all API communications
- Row-level security policies ensuring you can only access your own data
- Regular security audits and automated threat monitoring

Birth data (date, time, place) is treated with special care as sensitive personal information. It is used only to generate your reports and is never shared with third parties.`,
  },
  {
    id: 'sharing',
    title: '4. Third-Party Services',
    content: `We use the following trusted third-party services, each with their own privacy policies:

**Supabase** - Database and authentication infrastructure (supabase.com)
**Razorpay** - Payment processing; handles all payment card data (razorpay.com)
**Google** - Optional Google Sign-In authentication (policies.google.com)
**Groq** - AI inference for report generation; inputs are anonymized (groq.com)
**Hostinger** - Email delivery infrastructure (hostinger.com)

No third party receives your birth chart data, family information, or personally identifiable information except as strictly necessary to provide the service.`,
  },
  {
    id: 'rights',
    title: '5. Your Rights',
    content: `Under India's Digital Personal Data Protection Act (DPDPA), 2023, you have the right to:

**Access:** Request a copy of all personal data we hold about you.
**Correction:** Correct inaccurate or incomplete personal data.
**Deletion:** Request deletion of your account and all associated data. Your data will be permanently deleted within 30 days of your request.
**Portability:** Request your data in a machine-readable format.
**Grievance:** Lodge a complaint with our Grievance Officer.

To exercise any of these rights, contact us at privacy@mahatathastu.com or via WhatsApp at +91 9858784784.`,
  },
  {
    id: 'cookies',
    title: '6. Cookies',
    content: `We use only essential cookies required for the platform to function:

- **Authentication cookies:** To keep you logged in securely (session tokens, expires on logout)
- **Preference cookies:** To remember your dashboard settings (language, timezone)

We do not use advertising cookies, tracking pixels, or cross-site tracking technologies. You can clear cookies at any time through your browser settings, though this will log you out.`,
  },
  {
    id: 'children',
    title: '7. Children\'s Privacy',
    content: `MahaTathastu is intended for users aged 13 and above. We allow parents to add birth details of their minor children to generate child development reports - this data is entered by the parent/guardian and used solely for generating the requested report.

If you believe we have inadvertently collected personal data from a child without proper parental consent, please contact us immediately at privacy@mahatathastu.com.`,
  },
  {
    id: 'updates',
    title: '8. Changes to This Policy',
    content: `We may update this Privacy Policy when we introduce new features or when regulatory requirements change. We will notify you of material changes by:

- Sending an email to your registered address at least 14 days before changes take effect
- Displaying a notice on your dashboard

Your continued use of MahaTathastu after the effective date constitutes acceptance of the updated policy.`,
  },
  {
    id: 'contact',
    title: '9. Contact & Grievance Officer',
    content: `For privacy-related queries, data requests, or complaints:

**Email:** privacy@mahatathastu.com
**WhatsApp:** +91 9858784784
**Response Time:** We respond to all privacy requests within 72 hours.

MahaTathastu is operated by Levitate Labs, India. Our registered office address is available upon request.`,
  },
]

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--kutch-white)]">
      <section className="page-banner">
        <div className="page-banner-inner max-w-2xl mx-auto">
          <p className="text-[var(--saffron)] text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>Legal</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Privacy Policy</h1>
          <div className="ornate-divider">
            <span className="material-symbols-outlined text-[14px] text-[var(--terracotta)]" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
          </div>
          <p className="text-white/65 text-base">Effective: 1 June 2025 &nbsp;&middot;&nbsp; Last updated: 18 June 2026</p>
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Intro */}
          <div className="card-divine p-6 mb-10" style={{ background: 'linear-gradient(135deg, #FEF5EC, #FFF8E1)', borderColor: '#E8D5A0' }}>
            <p className="text-[var(--warm-charcoal)]/80 leading-relaxed text-sm">
              MahaTathastu respects your privacy deeply. Your birth data and family information are sacred - we handle them with the same reverence that Vedic tradition applies to personal charts. This policy explains exactly what we collect, why, and how we protect it.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-10">
            {SECTIONS.map(sec => (
              <div key={sec.id} id={sec.id}>
                <h2 className="text-xl font-bold text-[var(--indigo-deep)] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>{sec.title}</h2>
                <div className="prose prose-sm max-w-none text-[var(--warm-charcoal)]/75 leading-relaxed">
                  {sec.content.split('\n\n').map((para, i) => (
                    <p key={i} className="mb-4 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: para
                          .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[var(--indigo-deep)]">$1</strong>')
                          .replace(/\n/g, '<br/>'),
                      }}
                    />
                  ))}
                </div>
                <div className="h-px bg-[var(--warm-sand)] mt-10" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
