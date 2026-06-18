import nodemailer from 'nodemailer'

export interface OrderItem {
  name: string
  price: number
  quantity: number
  product_type?: string
}
export interface OrderDetails {
  orderNumber: string
  items: OrderItem[]
  subtotal: number
  discount: number
  total: number
  paymentId?: string
}

// ─── Transporter ────────────────────────────────────────────────────────────

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Email] SMTP not configured — skipping send to', to)
    return
  }
  try {
    const t = getTransporter()
    await t.sendMail({
      from: process.env.SMTP_FROM || 'MahaTathastu <info@mahatathastu.com>',
      to,
      subject,
      html,
    })
  } catch (err: any) {
    console.error('[Email] Send failed:', err.message)
    throw err
  }
}

// ─── Sudarshan Chakra SVG (static, no animation) ────────────────────────────

function chakraSVG(size = 72): string {
  const op = Array.from({ length: 16 }, (_, i) => i * 22.5)
  const ip = Array.from({ length: 8 }, (_, i) => i * 45)
  const sp = Array.from({ length: 8 }, (_, i) => i * 45)
  const sd = Array.from({ length: 8 }, (_, i) => i * 45 + 22.5)
  return [
    `<svg width="${size}" height="${size}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">`,
    `<polygon points="100,4 121.5,19.8 148,16.9 158.7,41.3 183.1,52 180.2,78.5 196,100 180.2,121.5 183.1,148 158.7,158.7 148,183.1 121.5,180.2 100,196 78.5,180.2 52,183.1 41.3,158.7 16.9,148 19.8,121.5 4,100 19.8,78.5 16.9,52 41.3,41.3 52,16.9 78.5,19.8" fill="#E36414"/>`,
    `<circle cx="100" cy="100" r="82" fill="#FEF5EC"/>`,
    `<circle cx="100" cy="100" r="80" fill="none" stroke="#E36414" stroke-width="2.5"/>`,
    op.map(a => `<ellipse cx="100" cy="28" rx="5" ry="11" fill="#E36414" stroke="#D4A017" stroke-width="0.7" transform="rotate(${a} 100 100)"/>`).join(''),
    `<circle cx="100" cy="100" r="62" fill="none" stroke="#D4A017" stroke-width="2"/>`,
    sp.map(a => `<path d="M 100,41 L 96.5,51 L 100,59 L 103.5,51 Z" fill="#2F2A44" transform="rotate(${a} 100 100)"/>`).join(''),
    sd.map(a => `<circle cx="100" cy="50" r="2.5" fill="#E36414" transform="rotate(${a} 100 100)"/>`).join(''),
    `<circle cx="100" cy="100" r="40" fill="none" stroke="#D4A017" stroke-width="2.5"/>`,
    ip.map(a => `<ellipse cx="100" cy="65" rx="3.5" ry="8" fill="#C67D53" stroke="#D4A017" stroke-width="0.6" transform="rotate(${a} 100 100)"/>`).join(''),
    `<circle cx="100" cy="100" r="27" fill="#2F2A44"/>`,
    `<circle cx="100" cy="100" r="25" fill="none" stroke="#D4A017" stroke-width="1.5"/>`,
    `<circle cx="100" cy="100" r="16" fill="#E36414"/>`,
    `<circle cx="100" cy="100" r="9" fill="#2F2A44"/>`,
    `<circle cx="100" cy="100" r="5" fill="#D4A017"/>`,
    `</svg>`,
  ].join('')
}

// ─── Master layout — LIGHT THEME ─────────────────────────────────────────────

const APP = process.env.NEXT_PUBLIC_APP_URL || 'https://mahatathastu.com'

function layout(accentColor: string, topBar: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#F0EBE3;font-family:Arial,Helvetica,sans-serif}
    .wrap{background:#F0EBE3;padding:32px 16px}
    .card{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.09)}
    .topbar{height:5px;background:${accentColor}}
    .hdr{padding:36px 48px 28px;text-align:center;background:#fff;border-bottom:1px solid #F0EBE3}
    .brand-name{font-size:22px;font-weight:bold;color:#2F2A44;font-family:Georgia,'Times New Roman',serif;margin:12px 0 3px;letter-spacing:.01em}
    .brand-sub{font-size:10px;color:#B0A8BC;letter-spacing:.18em;text-transform:uppercase}
    .goldline{width:44px;height:2px;background:linear-gradient(90deg,#D4A017,#E36414);margin:12px auto 0;border-radius:2px}
    .bdy{padding:40px 48px;background:#fff}
    .h1{font-family:Georgia,serif;font-size:26px;color:#1A1535;font-weight:bold;margin-bottom:6px;line-height:1.25}
    .h3{font-family:Georgia,serif;font-size:17px;color:#2F2A44;font-weight:bold;margin-bottom:8px}
    .p{font-size:15px;color:#4A4060;line-height:1.75;margin-bottom:18px}
    .muted{font-size:13px;color:#9A96AA;line-height:1.65}
    .divider{border:none;border-top:1px solid #EDE8E0;margin:28px 0}
    .btn{display:inline-block;background:linear-gradient(135deg,#C67D53,#B9986B);color:#fff!important;padding:15px 38px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;font-family:Arial,sans-serif;letter-spacing:.01em}
    .badge{display:inline-block;background:#F5F0EB;border:1px solid #E8E0D5;border-radius:6px;padding:4px 14px;font-size:12px;color:#7A7090;font-weight:600;margin-bottom:20px;letter-spacing:.04em}
    .card-light{background:#FAFAF8;border:1px solid #EDE8E0;border-radius:12px;padding:20px 22px;margin-bottom:20px}
    .gold-box{background:linear-gradient(135deg,#FFFCF0,#FFF8E1);border:1px solid #E8D5A0;border-radius:12px;padding:22px 26px;margin:20px 0}
    .gold-box-label{font-size:10px;color:#B9986B;font-weight:bold;letter-spacing:.16em;text-transform:uppercase;margin-bottom:10px}
    .gold-box-text{font-size:16px;color:#3A2A10;font-family:Georgia,serif;font-style:italic;line-height:1.7}
    .tip-box{background:#FFF8F3;border-left:3px solid #E36414;border-radius:0 10px 10px 0;padding:16px 20px;margin:20px 0}
    .tip-label{font-size:10px;color:#E36414;font-weight:bold;letter-spacing:.14em;text-transform:uppercase;margin-bottom:6px}
    .tip-text{font-size:14px;color:#4A4060;line-height:1.7}
    .ftr{background:#F8F4F0;border-top:1px solid #EDE8E0;padding:24px 48px;text-align:center}
    .ftr-brand{font-size:15px;color:#2F2A44;font-weight:bold;font-family:Georgia,serif;margin-bottom:8px}
    .ftr-links{font-size:12px;color:#A0A0B8;line-height:2}
    .ftr-links a{color:#C67D53;text-decoration:none}
    @media(max-width:600px){
      .bdy,.hdr,.ftr{padding-left:24px!important;padding-right:24px!important}
      .feat-td{display:block!important;width:100%!important;margin-bottom:10px;border-radius:12px!important}
    }
  </style>
</head>
<body>
<div class="wrap">
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
<tr><td align="center">
<div class="card" style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.09)">

  <div class="topbar" style="height:5px;background:${accentColor}"></div>

  <div class="hdr" style="padding:36px 48px 28px;text-align:center;background:#fff;border-bottom:1px solid #F0EBE3">
    ${topBar}
  </div>

  <div class="bdy" style="padding:40px 48px;background:#fff">
    ${body}
  </div>

  <div class="ftr" style="background:#F8F4F0;border-top:1px solid #EDE8E0;padding:24px 48px;text-align:center">
    <div class="ftr-brand" style="font-size:15px;color:#2F2A44;font-weight:bold;font-family:Georgia,serif;margin-bottom:8px">MahaTathastu</div>
    <div class="ftr-links" style="font-size:12px;color:#A0A0B8;line-height:2">
      <a href="${APP}" style="color:#C67D53;text-decoration:none">mahatathastu.com</a> &nbsp;&middot;&nbsp;
      <a href="https://wa.me/919858784784" style="color:#C67D53;text-decoration:none">WhatsApp</a> &nbsp;&middot;&nbsp;
      <a href="mailto:info@mahatathastu.com" style="color:#C67D53;text-decoration:none">info@mahatathastu.com</a>
      <br>India&rsquo;s First 360&deg; Holistic Life Platform
      <br><span style="font-size:11px;color:#C8C4D8">You received this because you have an account at mahatathastu.com</span>
    </div>
  </div>

</div>
</td></tr>
</table>
</div>
</body>
</html>`
}

// ─── Shared header block ──────────────────────────────────────────────────────

function hdrBlock(subtitle: string): string {
  return `
    ${chakraSVG(72)}
    <div class="brand-name" style="font-size:22px;font-weight:bold;color:#2F2A44;font-family:Georgia,'Times New Roman',serif;margin:12px 0 3px;letter-spacing:.01em">MahaTathastu</div>
    <div class="brand-sub" style="font-size:10px;color:#B0A8BC;letter-spacing:.18em;text-transform:uppercase">${subtitle}</div>
    <div class="goldline" style="width:44px;height:2px;background:linear-gradient(90deg,#D4A017,#E36414);margin:12px auto 0;border-radius:2px"></div>
  `
}

// ─── Welcome Email ────────────────────────────────────────────────────────────

export function welcomeEmailHtml(name: string): string {
  const top = hdrBlock('Welcome to the Sacred Family')
  const body = `
    <h1 class="h1" style="font-family:Georgia,serif;font-size:26px;color:#1A1535;font-weight:bold;margin-bottom:6px;line-height:1.25">
      Namaste, ${escHtml(name)}!
    </h1>
    <p class="muted" style="font-size:14px;color:#9A96AA;line-height:1.6;margin-bottom:24px">Your sacred digital sanctuary is now ready.</p>

    <p class="p" style="font-size:15px;color:#4A4060;line-height:1.75;margin-bottom:24px">
      Welcome to <strong style="color:#1A1535">MahaTathastu</strong> &mdash; India&rsquo;s first platform that unifies
      14 ancient Vedic sciences into one AI-guided life system. Your personal dashboard
      is ready with insights drawn from your unique birth imprint.
    </p>

    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="6" style="margin:8px 0 28px">
      <tr>
        <td class="feat-td" width="31%" style="background:#FAFAF8;border:1px solid #EDE8E0;border-radius:12px;padding:18px 12px;text-align:center;vertical-align:top">
          <div style="width:38px;height:38px;background:linear-gradient(135deg,#2F2A44,#460B2F);border-radius:9px;margin:0 auto 11px"></div>
          <div style="font-size:13px;font-weight:bold;color:#1A1535;font-family:Georgia,serif;margin-bottom:3px">14 Reports</div>
          <div style="font-size:11px;color:#9A96AA">Jyotish &middot; DMIT &middot; Vastu</div>
        </td>
        <td width="3%"></td>
        <td class="feat-td" width="31%" style="background:#FAFAF8;border:1px solid #EDE8E0;border-radius:12px;padding:18px 12px;text-align:center;vertical-align:top">
          <div style="width:38px;height:38px;background:linear-gradient(135deg,#C67D53,#B9986B);border-radius:9px;margin:0 auto 11px"></div>
          <div style="font-size:13px;font-weight:bold;color:#1A1535;font-family:Georgia,serif;margin-bottom:3px">Live Panchang</div>
          <div style="font-size:11px;color:#9A96AA">Hora &middot; Choghadiya</div>
        </td>
        <td width="3%"></td>
        <td class="feat-td" width="31%" style="background:#FAFAF8;border:1px solid #EDE8E0;border-radius:12px;padding:18px 12px;text-align:center;vertical-align:top">
          <div style="width:38px;height:38px;background:linear-gradient(135deg,#D4A017,#E36414);border-radius:9px;margin:0 auto 11px"></div>
          <div style="font-size:13px;font-weight:bold;color:#1A1535;font-family:Georgia,serif;margin-bottom:3px">Sacred Store</div>
          <div style="font-size:11px;color:#9A96AA">Yantras &middot; Gems</div>
        </td>
      </tr>
    </table>

    <div class="gold-box" style="background:linear-gradient(135deg,#FFFCF0,#FFF8E1);border:1px solid #E8D5A0;border-radius:12px;padding:20px 24px;margin-bottom:28px">
      <div class="gold-box-label" style="font-size:10px;color:#B9986B;font-weight:bold;letter-spacing:.16em;text-transform:uppercase;margin-bottom:10px">Your First Steps</div>
      <div style="font-size:14px;color:#4A3420;line-height:1.75">
        1. Add your birth details in <strong>Family Members</strong><br>
        2. Generate your <strong>Kundli &amp; Nakshatra Report</strong><br>
        3. Check <strong>Live Panchang</strong> for today&rsquo;s auspicious timings
      </div>
    </div>

    <hr class="divider" style="border:none;border-top:1px solid #EDE8E0;margin:28px 0">

    <div style="text-align:center;padding:4px 0 20px">
      <a href="${APP}/dashboard" class="btn" style="display:inline-block;background:linear-gradient(135deg,#C67D53,#B9986B);color:#fff;padding:15px 38px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;font-family:Arial,sans-serif">
        Begin Your Vedic Journey &rarr;
      </a>
    </div>

    <p class="muted" style="font-size:12px;color:#ADA8C0;text-align:center;line-height:1.65;margin:0">
      Add every family member&rsquo;s birth data for personalized insights &mdash; one account, unlimited family wisdom.
    </p>
  `
  return layout('linear-gradient(90deg,#E36414,#D4A017,#C67D53)', top, body)
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  await sendEmail(to, `Namaste ${name}! Welcome to MahaTathastu`, welcomeEmailHtml(name))
}

// ─── Order Confirmation Email ─────────────────────────────────────────────────

export function orderConfirmationHtml(name: string, order: OrderDetails): string {
  const top = hdrBlock('Sacred Store &mdash; Order Confirmation')
  const rows = order.items.map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #F0EBE3;font-size:14px;color:#2F2A44;vertical-align:top">
        <strong>${escHtml(item.name)}</strong>
        ${item.product_type ? `<div style="font-size:11px;color:#9A96AA;margin-top:2px;text-transform:capitalize">${escHtml(item.product_type)}</div>` : ''}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #F0EBE3;font-size:14px;color:#B0A8BC;text-align:center;vertical-align:top">&times;${item.quantity}</td>
      <td style="padding:12px 0;border-bottom:1px solid #F0EBE3;font-size:14px;font-weight:bold;color:#2F2A44;text-align:right;vertical-align:top;white-space:nowrap">
        &#8377;${(item.price * item.quantity).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('')

  const body = `
    <div style="display:inline-block;background:#F0FDF4;border:1px solid #A7F3D0;border-radius:8px;padding:6px 16px;font-size:13px;color:#065F46;font-weight:600;margin-bottom:20px">
      Payment Confirmed &nbsp;&#10003;
    </div>

    <h1 class="h1" style="font-family:Georgia,serif;font-size:26px;color:#1A1535;font-weight:bold;margin-bottom:6px">
      Thank you, ${escHtml(name)}!
    </h1>
    <p class="muted" style="font-size:14px;color:#9A96AA;margin-bottom:28px">Your order has been received and confirmed.</p>

    <div style="background:#FAFAF8;border:1px solid #EDE8E0;border-radius:12px;padding:16px 20px;margin-bottom:28px">
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="font-size:10px;color:#B0A8BC;letter-spacing:.12em;text-transform:uppercase;margin-bottom:3px">Order Number</div>
            <div style="font-size:16px;font-weight:bold;color:#2F2A44;font-family:Georgia,serif">${escHtml(order.orderNumber)}</div>
          </td>
          <td style="text-align:right">
            <div style="font-size:10px;color:#B0A8BC;letter-spacing:.12em;text-transform:uppercase;margin-bottom:3px">Date</div>
            <div style="font-size:14px;color:#4A4060">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </td>
        </tr>
      </table>
    </div>

    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
      <thead>
        <tr>
          <th style="font-size:10px;color:#B0A8BC;font-weight:600;letter-spacing:.12em;text-transform:uppercase;padding-bottom:10px;border-bottom:2px solid #EDE8E0;text-align:left">Item</th>
          <th style="font-size:10px;color:#B0A8BC;font-weight:600;letter-spacing:.12em;text-transform:uppercase;padding-bottom:10px;border-bottom:2px solid #EDE8E0;text-align:center;width:36px">Qty</th>
          <th style="font-size:10px;color:#B0A8BC;font-weight:600;letter-spacing:.12em;text-transform:uppercase;padding-bottom:10px;border-bottom:2px solid #EDE8E0;text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
      ${order.discount > 0 ? `
      <tr>
        <td style="font-size:14px;color:#9A96AA;padding:3px 0">Subtotal</td>
        <td style="font-size:14px;color:#9A96AA;text-align:right">&#8377;${order.subtotal.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td style="font-size:14px;color:#10B981;padding:3px 0">Discount applied</td>
        <td style="font-size:14px;color:#10B981;text-align:right">&minus;&#8377;${order.discount.toLocaleString('en-IN')}</td>
      </tr>` : ''}
      <tr>
        <td style="font-size:17px;font-weight:bold;color:#1A1535;font-family:Georgia,serif;padding:14px 0 0;border-top:2px solid #EDE8E0">Total Paid</td>
        <td style="font-size:20px;font-weight:bold;color:#1A1535;font-family:Georgia,serif;text-align:right;padding:14px 0 0;border-top:2px solid #EDE8E0">&#8377;${order.total.toLocaleString('en-IN')}</td>
      </tr>
    </table>

    ${order.paymentId ? `<p class="muted" style="font-size:11px;color:#B0A8BC;margin-bottom:20px">Ref: <span style="font-family:monospace;color:#6A6080">${escHtml(order.paymentId)}</span></p>` : ''}

    <div class="tip-box" style="background:#F0FFF4;border-left:3px solid #10B981;border-radius:0 10px 10px 0;padding:14px 18px;margin-bottom:28px">
      <div class="tip-label" style="font-size:10px;color:#059669;font-weight:bold;letter-spacing:.12em;text-transform:uppercase;margin-bottom:5px">Delivery</div>
      <div class="tip-text" style="font-size:13px;color:#1A4A2E;line-height:1.65">Digital items (reports, ebooks) are instantly available in your dashboard. Physical products ship within 2&ndash;5 business days.</div>
    </div>

    <hr class="divider" style="border:none;border-top:1px solid #EDE8E0;margin:28px 0">

    <div style="text-align:center;padding:4px 0 20px">
      <a href="${APP}/dashboard" class="btn" style="display:inline-block;background:linear-gradient(135deg,#C67D53,#B9986B);color:#fff;padding:15px 38px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;font-family:Arial,sans-serif">
        Access Your Purchase &rarr;
      </a>
    </div>

    <p class="muted" style="font-size:13px;color:#ADA8C0;text-align:center;line-height:1.65;margin:0">
      Questions? WhatsApp us at <a href="https://wa.me/919858784784" style="color:#C67D53;text-decoration:none">+91 98587 84784</a>
    </p>
  `
  return layout('linear-gradient(90deg,#10B981,#059669)', top, body)
}

export async function sendOrderConfirmation(to: string, name: string, order: OrderDetails): Promise<void> {
  await sendEmail(
    to,
    `Order Confirmed #${order.orderNumber} — MahaTathastu`,
    orderConfirmationHtml(name, order),
  )
}

// ─── Spiritual Digest Email ───────────────────────────────────────────────────

export interface DigestContent {
  topic: string
  intro: string
  insights: string[]
  mantra: string
  mantraTranslation: string
  practicalTip: string
  closing: string
}

export function spiritualDigestHtml(name: string, digest: DigestContent, dateStr: string): string {
  const top = `
    ${chakraSVG(72)}
    <div class="brand-name" style="font-size:22px;font-weight:bold;color:#2F2A44;font-family:Georgia,'Times New Roman',serif;margin:12px 0 3px">MahaTathastu</div>
    <div class="brand-sub" style="font-size:10px;color:#B0A8BC;letter-spacing:.18em;text-transform:uppercase">Adhyatmic Digest &nbsp;&middot;&nbsp; ${escHtml(dateStr)}</div>
    <div class="goldline" style="width:44px;height:2px;background:linear-gradient(90deg,#D4A017,#E36414);margin:12px auto 0;border-radius:2px"></div>
  `

  const insightRows = digest.insights.map((ins, i) => `
    <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:14px">
      <div style="min-width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#C67D53,#B9986B);display:flex;align-items:center;justify-content:center;margin-top:2px">
        <span style="color:#fff;font-size:11px;font-weight:bold;font-family:Arial,sans-serif;line-height:22px;display:block;text-align:center">${i + 1}</span>
      </div>
      <p style="font-size:14px;color:#4A4060;line-height:1.72;margin:0">${escHtml(ins)}</p>
    </div>
  `).join('')

  const body = `
    <div class="badge" style="display:inline-block;background:#F5F0EB;border:1px solid #E8E0D5;border-radius:6px;padding:4px 14px;font-size:12px;color:#7A7090;font-weight:600;margin-bottom:20px;letter-spacing:.04em">
      ${escHtml(digest.topic)}
    </div>

    <h1 class="h1" style="font-family:Georgia,serif;font-size:24px;color:#1A1535;font-weight:bold;margin-bottom:6px">
      Namaste, ${escHtml(name)}
    </h1>
    <p class="p" style="font-size:15px;color:#4A4060;line-height:1.75;margin-bottom:28px">${escHtml(digest.intro)}</p>

    <div class="card-light" style="background:#FAFAF8;border:1px solid #EDE8E0;border-radius:12px;padding:20px 22px;margin-bottom:24px">
      <div style="font-size:10px;color:#C67D53;font-weight:bold;letter-spacing:.16em;text-transform:uppercase;margin-bottom:14px">Key Insights</div>
      ${insightRows}
    </div>

    <div class="gold-box" style="background:linear-gradient(135deg,#FFFCF0,#FFF8E1);border:1px solid #E8D5A0;border-radius:12px;padding:22px 26px;margin:4px 0 24px">
      <div class="gold-box-label" style="font-size:10px;color:#B9986B;font-weight:bold;letter-spacing:.16em;text-transform:uppercase;margin-bottom:10px">Today&rsquo;s Mantra</div>
      <div class="gold-box-text" style="font-size:17px;color:#3A2A10;font-family:Georgia,serif;font-style:italic;line-height:1.7;margin-bottom:8px">${escHtml(digest.mantra)}</div>
      <div style="font-size:13px;color:#8A7060;line-height:1.6">${escHtml(digest.mantraTranslation)}</div>
    </div>

    <div class="tip-box" style="background:#FFF8F3;border-left:3px solid #E36414;border-radius:0 10px 10px 0;padding:16px 20px;margin-bottom:24px">
      <div class="tip-label" style="font-size:10px;color:#E36414;font-weight:bold;letter-spacing:.14em;text-transform:uppercase;margin-bottom:6px">Practical Tip</div>
      <div class="tip-text" style="font-size:14px;color:#4A4060;line-height:1.7">${escHtml(digest.practicalTip)}</div>
    </div>

    <p style="font-size:15px;color:#4A4060;font-family:Georgia,serif;font-style:italic;line-height:1.75;border-left:3px solid #D4A017;padding-left:16px;margin-bottom:32px">
      ${escHtml(digest.closing)}
    </p>

    <hr class="divider" style="border:none;border-top:1px solid #EDE8E0;margin:28px 0">

    <div style="text-align:center;padding:4px 0 20px">
      <a href="${APP}/dashboard" class="btn" style="display:inline-block;background:linear-gradient(135deg,#C67D53,#B9986B);color:#fff;padding:15px 38px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;font-family:Arial,sans-serif">
        Explore Your Dashboard &rarr;
      </a>
    </div>

    <p class="muted" style="font-size:12px;color:#B8B4C8;text-align:center;line-height:1.65;margin:0">
      You receive this digest every 3 days as part of your MahaTathastu membership.
    </p>
  `
  return layout('linear-gradient(90deg,#7C3AED,#C67D53,#D4A017)', top, body)
}

export async function sendSpiritualDigest(
  to: string,
  name: string,
  digest: DigestContent,
  dateStr: string,
): Promise<void> {
  await sendEmail(
    to,
    `Your Adhyatmic Digest — ${digest.topic} | MahaTathastu`,
    spiritualDigestHtml(name, digest, dateStr),
  )
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
