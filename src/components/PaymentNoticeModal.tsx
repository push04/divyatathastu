'use client'

interface Props {
  serviceName: string
  amount: number
  onConfirm: () => void
  onCancel: () => void
}

export default function PaymentNoticeModal({ serviceName, amount, onConfirm, onCancel }: Props) {
  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center px-4"
      style={{ background: 'rgba(15, 12, 41, 0.72)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#fffbf2', border: '1.5px solid #e8d5a3' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: '#f0e4c4' }}>
          <div className="flex items-center gap-3 mb-1">
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ color: '#92400e', fontVariationSettings: "'FILL' 1" }}
            >
              info
            </span>
            <h2
              className="text-base font-bold"
              style={{ fontFamily: "'Playfair Display', serif", color: '#3b1f00' }}
            >
              Before you proceed
            </h2>
          </div>
          <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: '#D4A017', fontFamily: "'Sora', sans-serif" }}>
            Payment Policy · Please Read
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Service + Amount */}
          <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: '#92400e', fontFamily: "'Sora', sans-serif" }}>Booking for</p>
              <p className="text-sm font-bold" style={{ color: '#3b1f00', fontFamily: "'Sora', sans-serif" }}>{serviceName}</p>
            </div>
            <p className="text-lg font-black" style={{ color: '#92400e', fontFamily: "'JetBrains Mono', monospace" }}>
              ₹{amount.toLocaleString('en-IN')}
            </p>
          </div>

          {/* Notice text */}
          <div className="space-y-3 text-[13px] leading-relaxed" style={{ color: '#4a3520', fontFamily: "'DM Sans', sans-serif" }}>
            <p>
              All services at MahaTathastu — consultations, poojas, sadhanas, courses, and digital reports — are <strong style={{ color: '#92400e' }}>non-refundable once payment is made.</strong>
            </p>
            <p>
              This is because every service is personally prepared for you. Our Acharyas set aside dedicated time, our priests begin ritual preparations on your behalf, and reports are generated specifically for your birth details. Once this process begins, it cannot be reversed.
            </p>
            <p>
              We genuinely want you to feel fully confident before booking. If you have any doubts about what this service includes, please reach out to us first on WhatsApp at{' '}
              <a
                href="https://wa.me/919274815269"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline"
                style={{ color: '#16a34a' }}
              >
                +91 92748 15269
              </a>{' '}
              — we are happy to answer every question.
            </p>
          </div>

          {/* Non-refundable highlight */}
          <div className="rounded-xl px-4 py-3 flex items-start gap-3" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
            <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0" style={{ color: '#ea580c', fontVariationSettings: "'FILL' 1" }}>block</span>
            <p className="text-[12px] font-semibold leading-snug" style={{ color: '#9a3412', fontFamily: "'Sora', sans-serif" }}>
              No cancellations or refunds after payment is confirmed. Rescheduling of live sessions is subject to availability and must be requested at least 24 hours in advance.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col gap-2.5">
          <button
            onClick={onConfirm}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #92400e, #78350f)', fontFamily: "'Sora', sans-serif", letterSpacing: '0.02em' }}
          >
            I understand — Proceed to Pay ₹{amount.toLocaleString('en-IN')}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-amber-50"
            style={{ color: '#92400e', border: '1.5px solid #e8d5a3', fontFamily: "'Sora', sans-serif" }}
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  )
}
