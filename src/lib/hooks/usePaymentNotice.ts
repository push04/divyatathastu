'use client'

import { useState, createElement } from 'react'
import PaymentNoticeModal from '@/components/PaymentNoticeModal'

export function usePaymentNotice() {
  const [pending, setPending] = useState<{ serviceName: string; amount: number; onConfirm: () => void } | null>(null)

  const confirmPayment = (serviceName: string, amount: number, onConfirm: () => void) => {
    setPending({ serviceName, amount, onConfirm })
  }

  const NoticeModal = pending
    ? createElement(PaymentNoticeModal, {
        serviceName: pending.serviceName,
        amount: pending.amount,
        onConfirm: () => {
          const { onConfirm: run } = pending
          setPending(null)
          run()
        },
        onCancel: () => setPending(null),
      })
    : null

  return { confirmPayment, NoticeModal }
}
