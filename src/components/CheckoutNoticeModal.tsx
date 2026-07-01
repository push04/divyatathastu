'use client'

interface Props {
  hasDigital: boolean
  hasPhysical: boolean
  amount: number
  onConfirm: () => void
  onCancel: () => void
}

export default function CheckoutNoticeModal({ hasDigital, hasPhysical, amount, onConfirm, onCancel }: Props) {
  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center px-4"
      style={{ background: 'rgba(15, 12, 41, 0.72)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#fffbf2', border: '1.5px solid #e8d5a3' }}
      >
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
              Before you pay
            </h2>
          </div>
          <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: '#D4A017', fontFamily: "'Sora', sans-serif" }}>
            Order Policy &middot; Please Read
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
            <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: '#92400e', fontFamily: "'Sora', sans-serif" }}>Order total</p>
            <p className="text-lg font-black" style={{ color: '#92400e', fontFamily: "'JetBrains Mono', monospace" }}>
              ₹{amount.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="space-y-3 text-[13px] leading-relaxed" style={{ color: '#4a3520', fontFamily: "'DM Sans', sans-serif" }}>
            {hasDigital && (
              <p>
                Your order includes <strong style={{ color: '#92400e' }}>digital items</strong> (reports, ebooks, or similar) — these unlock immediately on payment and are <strong style={{ color: '#92400e' }}>non-refundable once delivered</strong>.
              </p>
            )}
            {hasPhysical && (
              <p>
                Physical items (crystals, yantras, and similar) can be returned within <strong style={{ color: '#92400e' }}>7 days of delivery</strong> only if they arrive damaged or not as described — please write to us with photos and your order number.
              </p>
            )}
            <p>
              Not sure about something in your cart? Message us on WhatsApp at{' '}
              <a
                href="https://wa.me/919274815269"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline"
                style={{ color: '#16a34a' }}
              >
                +91 92748 15269
              </a>{' '}
              before you pay — we'd rather answer your question now than process a dispute later.
            </p>
          </div>
        </div>

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
