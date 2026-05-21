import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { to, subject, html, type } = await req.json()

  if (!process.env.RESEND_API_KEY) {
    console.log('Email (mock):', { to, subject, type })
    return NextResponse.json({ success: true, mock: true })
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'DivyaTathastu <noreply@divyatathastu.com>',
      to: [to],
      subject,
      html: html || getDefaultEmailTemplate(subject, type),
    })

    return NextResponse.json({ success: true, id: result.data?.id })
  } catch (err) {
    console.error('Email error:', err)
    return NextResponse.json({ error: 'Email failed' }, { status: 500 })
  }
}

function getDefaultEmailTemplate(subject: string, type: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #FBFAF7; color: #1A1625; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { background: #2F2A44; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { color: #B9986B; margin: 0; font-size: 24px; }
    .body { background: white; padding: 30px; border-radius: 0 0 12px 12px; }
    .footer { text-align: center; margin-top: 20px; color: #6B6480; font-size: 12px; }
    .btn { display: inline-block; background: #C67D53; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 32px; margin-bottom: 8px;">ॐ</div>
      <h1>DivyaTathastu</h1>
      <p style="color: rgba(255,255,255,0.6); margin: 4px 0 0 0; font-size: 12px;">360° Holistic Life Platform</p>
    </div>
    <div class="body">
      <h2>${subject}</h2>
      <p>Thank you for being part of the DivyaTathastu family.</p>
      <p>May divine blessings guide your journey. ॐ</p>
      <p style="margin-top: 24px;"><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://divyatathastu.com'}/dashboard" class="btn">Go to Dashboard</a></p>
    </div>
    <div class="footer">
      <p>DivyaTathastu | India's First 360° Holistic Life Platform</p>
      <p>WhatsApp: +91 9858784784 | support@divyatathastu.com</p>
    </div>
  </div>
</body>
</html>
  `
}
