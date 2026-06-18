import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, sendWelcomeEmail, sendOrderConfirmation, sendSpiritualDigest } from '@/lib/email'
import type { OrderDetails, DigestContent } from '@/lib/email'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type, to, subject, html } = body

  if (!to) return NextResponse.json({ error: 'Missing recipient' }, { status: 400 })

  try {
    switch (type) {
      case 'welcome': {
        const name: string = body.name || to.split('@')[0]
        await sendWelcomeEmail(to, name)
        break
      }
      case 'order': {
        const name: string = body.name || to.split('@')[0]
        const order: OrderDetails = body.order
        if (!order) return NextResponse.json({ error: 'Missing order data' }, { status: 400 })
        await sendOrderConfirmation(to, name, order)
        break
      }
      case 'digest': {
        const name: string = body.name || to.split('@')[0]
        const digest: DigestContent = body.digest
        const dateStr: string = body.dateStr || new Date().toLocaleDateString('en-IN')
        if (!digest) return NextResponse.json({ error: 'Missing digest data' }, { status: 400 })
        await sendSpiritualDigest(to, name, digest, dateStr)
        break
      }
      default: {
        // Generic email — requires subject + html
        if (!subject || !html) return NextResponse.json({ error: 'Missing subject or html' }, { status: 400 })
        await sendEmail(to, subject, html)
      }
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[/api/email] error:', err.message)
    return NextResponse.json({ error: err.message || 'Email failed' }, { status: 500 })
  }
}
