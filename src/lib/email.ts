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
    console.warn('[Email] SMTP not configured, skipping send to', to)
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

// ─── Sudarshan Chakra SVG ────────────────────────────────────────────────────

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

// ─── Master layout ────────────────────────────────────────────────────────────

const APP = process.env.NEXT_PUBLIC_APP_URL || 'https://mahatathastu.com'

function layout(accentColor: string, headerContent: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#F0EAE0;font-family:Georgia,'Times New Roman',serif}
  @media(max-width:600px){.pad{padding-left:22px!important;padding-right:22px!important}}
</style>
</head>
<body style="background:#F0EAE0;margin:0;padding:0">
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#F0EAE0;padding:36px 16px">
<tr><td align="center">
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:580px;margin:0 auto">

  <tr><td style="height:4px;background:${accentColor};border-radius:12px 12px 0 0"></td></tr>

  <tr><td class="pad" style="background:#ffffff;padding:34px 44px 26px;text-align:center;border-left:1px solid #E8E0D5;border-right:1px solid #E8E0D5">
    ${headerContent}
  </td></tr>

  <tr><td class="pad" style="background:#ffffff;padding:34px 44px 38px;border-left:1px solid #E8E0D5;border-right:1px solid #E8E0D5">
    ${body}
  </td></tr>

  <tr><td class="pad" style="background:#FAF6F1;border:1px solid #E8E0D5;border-top:1px solid #EDE6DC;border-radius:0 0 12px 12px;padding:20px 44px;text-align:center">
    <div style="font-size:14px;font-weight:bold;color:#2F2A44;font-family:Georgia,serif;margin-bottom:7px">MahaTathastu</div>
    <div style="font-size:11px;color:#B0A8BC;line-height:2;font-family:Arial,sans-serif">
      <a href="${APP}" style="color:#C67D53;text-decoration:none">mahatathastu.com</a>
      &nbsp;&#183;&nbsp;
      <a href="https://wa.me/919858784784" style="color:#C67D53;text-decoration:none">WhatsApp</a>
      &nbsp;&#183;&nbsp;
      <a href="mailto:support@mahatathastu.com" style="color:#C67D53;text-decoration:none">support@mahatathastu.com</a><br>
      India&#39;s 360&#176; Holistic Life Platform<br>
      <span style="font-size:10px;color:#CCC8D8">Reply with &ldquo;unsubscribe&rdquo; to stop receiving these emails.</span>
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

// ─── Shared header ────────────────────────────────────────────────────────────

function hdr(subtitle: string): string {
  return `
    ${chakraSVG(68)}
    <div style="font-size:20px;font-weight:bold;color:#2F2A44;font-family:Georgia,'Times New Roman',serif;margin:14px 0 3px">MahaTathastu</div>
    <div style="font-size:10px;color:#C0B8CC;letter-spacing:.2em;text-transform:uppercase;font-family:Arial,sans-serif">${subtitle}</div>
    <div style="width:36px;height:2px;background:#D4A017;margin:13px auto 0;border-radius:2px"></div>
  `
}

// ─── Welcome Email ────────────────────────────────────────────────────────────

export function welcomeEmailHtml(name: string): string {
  const header = hdr('Sacred Beginnings')

  const body = `
    <h1 style="font-family:Georgia,serif;font-size:27px;color:#1A1535;font-weight:bold;margin:0 0 4px;line-height:1.25">
      Namaste, ${escHtml(name)}
    </h1>
    <p style="font-size:13px;color:#C67D53;font-family:Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;margin:0 0 24px">
      Welcome to the Sacred Family
    </p>

    <p style="font-size:15px;color:#3D3450;line-height:1.85;margin-bottom:22px;font-family:Georgia,serif">
      Your account at MahaTathastu is ready. What awaits you is a precise, AI-powered reading of 14 ancient Vedic sciences, each mapped to your unique birth imprint. Jyotish, Numerology, Chakra, Prakriti, Vastu, DMIT and more, unified into a single living dashboard for you and your entire family.
    </p>

    <!-- Shloka -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:26px">
      <tr>
        <td style="background:#FFFDF5;border:1px solid #E8D8A0;border-radius:12px;padding:22px 24px;text-align:center">
          <div style="font-size:22px;color:#2F2A44;font-family:Georgia,serif;font-style:italic;line-height:1.5;margin-bottom:10px">
            &#x92F;&#x925;&#x93E; &#x92A;&#x93F;&#x923;&#x94D;&#x921;&#x947; &#x924;&#x925;&#x93E; &#x92C;&#x94D;&#x930;&#x939;&#x94D;&#x92E;&#x93E;&#x923;&#x94D;&#x921;&#x947;
          </div>
          <div style="font-size:10px;color:#B9986B;font-family:Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;margin-bottom:8px">Yatha Pinde Tatha Brahmande</div>
          <div style="font-size:13px;color:#6A5840;font-family:Georgia,serif;font-style:italic;line-height:1.7">
            As is the individual body, so is the cosmic body.<br>Your birth chart is the cosmos reflected within you.
          </div>
        </td>
      </tr>
    </table>

    <!-- First steps -->
    <p style="font-size:11px;color:#B9986B;font-family:Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;margin-bottom:14px">Where to Begin</p>
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
      <tr>
        <td style="padding:11px 0;border-bottom:1px solid #F0EAE0">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr>
            <td style="width:18px;font-size:14px;color:#E36414;font-family:Arial,sans-serif;line-height:1;padding-top:2px">&#9670;</td>
            <td style="padding-left:10px;font-size:14px;color:#2F2A44;line-height:1.65;font-family:Georgia,serif">
              <strong>Add Family Members</strong> with their birth date, time and place to unlock their complete chart.
            </td>
          </tr></table>
        </td>
      </tr>
      <tr>
        <td style="padding:11px 0;border-bottom:1px solid #F0EAE0">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr>
            <td style="width:18px;font-size:14px;color:#E36414;font-family:Arial,sans-serif;line-height:1;padding-top:2px">&#9670;</td>
            <td style="padding-left:10px;font-size:14px;color:#2F2A44;line-height:1.65;font-family:Georgia,serif">
              <strong>Generate Your Kundli</strong> for your Lagna, Rashi, planetary yogas, and full Vimshottari Dasha.
            </td>
          </tr></table>
        </td>
      </tr>
      <tr>
        <td style="padding:11px 0">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr>
            <td style="width:18px;font-size:14px;color:#E36414;font-family:Arial,sans-serif;line-height:1;padding-top:2px">&#9670;</td>
            <td style="padding-left:10px;font-size:14px;color:#2F2A44;line-height:1.65;font-family:Georgia,serif">
              <strong>Check Live Panchang</strong> for today's Tithi, Nakshatra, Hora and auspicious Muhurat timings.
            </td>
          </tr></table>
        </td>
      </tr>
    </table>

    <hr style="border:none;border-top:1px solid #EDE6DC;margin:6px 0 28px">

    <div style="text-align:center">
      <a href="${APP}/dashboard" style="display:inline-block;background:#E36414;color:#ffffff;padding:16px 44px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;font-family:Arial,sans-serif;letter-spacing:.02em">
        Open Your Dashboard
      </a>
    </div>
  `

  return layout('#E36414', header, body)
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  await sendEmail(to, `Namaste ${name} — Welcome to MahaTathastu`, welcomeEmailHtml(name))
}

// ─── Order Confirmation Email ─────────────────────────────────────────────────

export function orderConfirmationHtml(name: string, order: OrderDetails): string {
  const header = hdr('Order Confirmed')

  const rows = order.items.map(item => `
    <tr>
      <td style="padding:13px 0;border-bottom:1px solid #F0EAE0;font-size:14px;color:#2F2A44;font-family:Georgia,serif;vertical-align:top;line-height:1.45">
        ${escHtml(item.name)}
        ${item.product_type ? `<div style="font-size:11px;color:#B0A8BC;margin-top:3px;text-transform:capitalize;font-family:Arial,sans-serif">${escHtml(item.product_type)}</div>` : ''}
      </td>
      <td style="padding:13px 0;border-bottom:1px solid #F0EAE0;font-size:13px;color:#B0A8BC;text-align:center;vertical-align:top;font-family:Arial,sans-serif">&#215;${item.quantity}</td>
      <td style="padding:13px 0;border-bottom:1px solid #F0EAE0;font-size:14px;font-weight:bold;color:#2F2A44;text-align:right;vertical-align:top;white-space:nowrap;font-family:Arial,sans-serif">
        &#8377;${(item.price * item.quantity).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('')

  const body = `
    <h1 style="font-family:Georgia,serif;font-size:26px;color:#1A1535;font-weight:bold;margin:0 0 5px;line-height:1.25">
      Thank you, ${escHtml(name)}.
    </h1>
    <p style="font-size:14px;color:#9A96AA;margin:0 0 26px;font-family:Arial,sans-serif;line-height:1.6">
      Your payment was received and your order is confirmed.
    </p>

    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#FAFAF6;border:1px solid #EDE6DC;border-radius:10px;padding:16px 20px;margin-bottom:24px">
      <tr>
        <td>
          <div style="font-size:10px;color:#B0A8BC;letter-spacing:.14em;text-transform:uppercase;font-family:Arial,sans-serif;margin-bottom:4px">Order</div>
          <div style="font-size:16px;font-weight:bold;color:#2F2A44;font-family:Georgia,serif">${escHtml(order.orderNumber)}</div>
        </td>
        <td style="text-align:right">
          <div style="font-size:10px;color:#B0A8BC;letter-spacing:.14em;text-transform:uppercase;font-family:Arial,sans-serif;margin-bottom:4px">Date</div>
          <div style="font-size:13px;color:#4A4060;font-family:Arial,sans-serif">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:6px">
      <thead>
        <tr>
          <th style="font-size:10px;color:#B0A8BC;font-weight:600;letter-spacing:.14em;text-transform:uppercase;padding-bottom:10px;border-bottom:2px solid #EDE6DC;text-align:left;font-family:Arial,sans-serif">Item</th>
          <th style="font-size:10px;color:#B0A8BC;font-weight:600;letter-spacing:.14em;text-transform:uppercase;padding-bottom:10px;border-bottom:2px solid #EDE6DC;text-align:center;width:32px;font-family:Arial,sans-serif">Qty</th>
          <th style="font-size:10px;color:#B0A8BC;font-weight:600;letter-spacing:.14em;text-transform:uppercase;padding-bottom:10px;border-bottom:2px solid #EDE6DC;text-align:right;font-family:Arial,sans-serif">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
      ${order.discount > 0 ? `
      <tr>
        <td style="font-size:13px;color:#9A96AA;padding:4px 0;font-family:Arial,sans-serif">Subtotal</td>
        <td style="font-size:13px;color:#9A96AA;text-align:right;font-family:Arial,sans-serif">&#8377;${order.subtotal.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#059669;padding:4px 0;font-family:Arial,sans-serif">Discount</td>
        <td style="font-size:13px;color:#059669;text-align:right;font-family:Arial,sans-serif">&#8722;&#8377;${order.discount.toLocaleString('en-IN')}</td>
      </tr>` : ''}
      <tr>
        <td style="font-size:17px;font-weight:bold;color:#1A1535;font-family:Georgia,serif;padding:13px 0 0;border-top:2px solid #EDE6DC">Total Paid</td>
        <td style="font-size:20px;font-weight:bold;color:#1A1535;font-family:Georgia,serif;text-align:right;padding:13px 0 0;border-top:2px solid #EDE6DC">&#8377;${order.total.toLocaleString('en-IN')}</td>
      </tr>
    </table>

    ${order.paymentId ? `<p style="font-size:11px;color:#C0B8CC;margin-bottom:22px;font-family:Arial,sans-serif">Payment reference: <span style="font-family:monospace;color:#8A8098">${escHtml(order.paymentId)}</span></p>` : ''}

    <p style="font-size:14px;color:#4A4060;line-height:1.8;margin-bottom:28px;font-family:Georgia,serif;font-style:italic;border-left:3px solid #D4A017;padding-left:16px">
      Digital reports and ebooks are immediately available in your dashboard. Physical items ship within 2 to 5 business days.
    </p>

    <hr style="border:none;border-top:1px solid #EDE6DC;margin:6px 0 28px">

    <div style="text-align:center">
      <a href="${APP}/dashboard" style="display:inline-block;background:#E36414;color:#ffffff;padding:16px 44px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;font-family:Arial,sans-serif;letter-spacing:.02em">
        Access Your Purchase
      </a>
    </div>

    <p style="font-size:12px;color:#C0B8CC;text-align:center;line-height:1.65;margin:18px 0 0;font-family:Arial,sans-serif">
      Questions? <a href="https://wa.me/919858784784" style="color:#C67D53;text-decoration:none">WhatsApp +91 98587 84784</a>
    </p>
  `

  return layout('#059669', header, body)
}

export async function sendOrderConfirmation(to: string, name: string, order: OrderDetails): Promise<void> {
  await sendEmail(
    to,
    `Order Confirmed ${order.orderNumber} — MahaTathastu`,
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
  const header = `
    ${chakraSVG(68)}
    <div style="font-size:20px;font-weight:bold;color:#2F2A44;font-family:Georgia,'Times New Roman',serif;margin:14px 0 3px">MahaTathastu</div>
    <div style="font-size:10px;color:#C0B8CC;letter-spacing:.2em;text-transform:uppercase;font-family:Arial,sans-serif">Adhyatmic Digest &#183; ${escHtml(dateStr)}</div>
    <div style="width:36px;height:2px;background:#D4A017;margin:13px auto 0;border-radius:2px"></div>
  `

  const insightRows = digest.insights.map(ins => `
    <p style="font-size:14px;color:#3D3450;line-height:1.85;margin-bottom:18px;font-family:Georgia,serif;padding-left:16px;border-left:2px solid #E8D5A0">
      ${escHtml(ins)}
    </p>
  `).join('')

  const body = `
    <div style="display:inline-block;background:#F5F0EA;border:1px solid #E0D5C8;border-radius:20px;padding:5px 15px;font-size:11px;color:#8A7860;font-family:Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;margin-bottom:22px">${escHtml(digest.topic)}</div>

    <h1 style="font-family:Georgia,serif;font-size:26px;color:#1A1535;font-weight:bold;margin:0 0 18px;line-height:1.25">
      Namaste, ${escHtml(name)}
    </h1>

    <p style="font-size:15px;color:#4A4060;line-height:1.85;margin-bottom:28px;font-family:Georgia,serif">
      ${escHtml(digest.intro)}
    </p>

    ${insightRows}

    <!-- Mantra -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:28px 0 24px">
      <tr>
        <td style="background:#FFFDF4;border:1px solid #E0CF90;border-radius:12px;padding:24px;text-align:center">
          <div style="font-size:10px;color:#C8A84B;font-family:Arial,sans-serif;letter-spacing:.2em;text-transform:uppercase;margin-bottom:14px">Today&#39;s Mantra</div>
          <div style="font-size:22px;color:#2A1F10;font-family:Georgia,serif;font-style:italic;line-height:1.5;margin-bottom:12px">
            ${escHtml(digest.mantra)}
          </div>
          <div style="width:32px;height:1px;background:#D4A017;margin:0 auto 12px"></div>
          <div style="font-size:13px;color:#7A6040;font-family:Georgia,serif;font-style:italic;line-height:1.65">
            ${escHtml(digest.mantraTranslation)}
          </div>
        </td>
      </tr>
    </table>

    <p style="font-size:14px;color:#3D3450;line-height:1.85;margin-bottom:26px;font-family:Georgia,serif">
      <span style="color:#E36414;font-family:Arial,sans-serif;font-size:11px;font-weight:bold;letter-spacing:.14em;text-transform:uppercase;display:block;margin-bottom:8px">Sadhana Tip</span>
      ${escHtml(digest.practicalTip)}
    </p>

    <!-- Closing quote -->
    <p style="font-size:15px;color:#4A4060;font-family:Georgia,serif;font-style:italic;line-height:1.8;text-align:center;padding:20px 24px;margin-bottom:28px;border-top:1px solid #EDE6DC;border-bottom:1px solid #EDE6DC;color:#6A5840">
      ${escHtml(digest.closing)}
    </p>

    <div style="text-align:center">
      <a href="${APP}/dashboard" style="display:inline-block;background:#7C3AED;color:#ffffff;padding:16px 44px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;font-family:Arial,sans-serif;letter-spacing:.02em">
        Explore Your Dashboard
      </a>
    </div>

    <p style="font-size:11px;color:#C0B8CC;text-align:center;line-height:1.65;margin:18px 0 0;font-family:Arial,sans-serif">
      You receive this digest every 3 days as part of your MahaTathastu membership.
    </p>
  `

  return layout('#7C3AED', header, body)
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

// ─── Event Registration Email ─────────────────────────────────────────────────

export function eventRegistrationHtml(name: string, eventTitle: string, eventDate: string, isPaid: boolean, paymentId?: string): string {
  const header = hdr('Event Registered')
  const formattedDate = eventDate
    ? (() => { try { return new Date(eventDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) } catch { return eventDate } })()
    : ''

  const body = `
    <h1 style="font-family:Georgia,serif;font-size:26px;color:#1A1535;font-weight:bold;margin:0 0 5px;line-height:1.25">
      You&rsquo;re Registered, ${escHtml(name)}!
    </h1>
    <p style="font-size:14px;color:#9A96AA;margin:0 0 26px;font-family:Arial,sans-serif;line-height:1.6">
      ${isPaid ? 'Your payment was received and your spot is confirmed.' : 'Your spot is confirmed &mdash; we look forward to seeing you!'}
    </p>

    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#F5F0FF;border:1px solid #DDD5F5;border-radius:12px;padding:22px 24px;margin-bottom:24px">
      <tr><td>
        <div style="font-size:10px;color:#7C3AED;letter-spacing:.14em;text-transform:uppercase;font-family:Arial,sans-serif;margin-bottom:6px">Event</div>
        <div style="font-size:18px;font-weight:bold;color:#2F2A44;font-family:Georgia,serif;margin-bottom:${formattedDate ? '12px' : '0'}">${escHtml(eventTitle)}</div>
        ${formattedDate ? `<div style="font-size:10px;color:#7C3AED;letter-spacing:.14em;text-transform:uppercase;font-family:Arial,sans-serif;margin-bottom:3px">Date</div><div style="font-size:14px;color:#4A4060;font-family:Arial,sans-serif">${escHtml(formattedDate)}</div>` : ''}
      </td></tr>
    </table>

    ${isPaid && paymentId ? `<p style="font-size:11px;color:#C0B8CC;margin-bottom:22px;font-family:Arial,sans-serif">Payment reference: <span style="font-family:monospace;color:#8A8098">${escHtml(paymentId)}</span></p>` : ''}

    <p style="font-size:14px;color:#4A4060;line-height:1.8;margin-bottom:28px;font-family:Georgia,serif;font-style:italic;border-left:3px solid #7C3AED;padding-left:16px">
      Joining instructions and further details will be sent closer to the event. Check your inbox and WhatsApp.
    </p>

    <hr style="border:none;border-top:1px solid #EDE6DC;margin:6px 0 28px">

    <div style="text-align:center">
      <a href="${APP}/events" style="display:inline-block;background:#7C3AED;color:#ffffff;padding:16px 44px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;font-family:Arial,sans-serif;letter-spacing:.02em">
        Browse More Events
      </a>
    </div>

    <p style="font-size:12px;color:#C0B8CC;text-align:center;line-height:1.65;margin:18px 0 0;font-family:Arial,sans-serif">
      Questions? <a href="https://wa.me/919858784784" style="color:#7C3AED;text-decoration:none">WhatsApp +91 98587 84784</a>
    </p>
  `
  return layout('#7C3AED', header, body)
}

export async function sendEventRegistrationEmail(
  to: string,
  name: string,
  eventTitle: string,
  eventDate: string,
  isPaid: boolean,
  paymentId?: string,
): Promise<void> {
  await sendEmail(
    to,
    `You&rsquo;re Registered &mdash; ${eventTitle} | MahaTathastu`,
    eventRegistrationHtml(name, eventTitle, eventDate, isPaid, paymentId),
  )
}

// ─── Course Enrollment Email ─────────────────────────────────────────────────

export function courseEnrollmentHtml(name: string, courseTitle: string, price: number, instructor?: string, courseId?: string): string {
  const header = hdr('Course Enrolled')

  const body = `
    <h1 style="font-family:Georgia,serif;font-size:26px;color:#1A1535;font-weight:bold;margin:0 0 5px;line-height:1.25">
      Welcome to the Course, ${escHtml(name)}!
    </h1>
    <p style="font-size:14px;color:#9A96AA;margin:0 0 26px;font-family:Arial,sans-serif;line-height:1.6">
      You are now enrolled in <strong style="color:#2F2A44">${escHtml(courseTitle)}</strong>.${instructor ? ` Your instructor is ${escHtml(instructor)}.` : ''}
    </p>

    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#F0FFF4;border:1px solid #BBF7D0;border-radius:12px;padding:22px 24px;margin-bottom:24px">
      <tr><td>
        <div style="font-size:10px;color:#059669;letter-spacing:.14em;text-transform:uppercase;font-family:Arial,sans-serif;margin-bottom:6px">Course</div>
        <div style="font-size:18px;font-weight:bold;color:#2F2A44;font-family:Georgia,serif;margin-bottom:${instructor ? '10px' : '0'}">${escHtml(courseTitle)}</div>
        ${instructor ? `<div style="font-size:13px;color:#6A8A7A;font-family:Arial,sans-serif">Instructor: ${escHtml(instructor)}</div>` : ''}
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid #BBF7D0">
          <div style="font-size:10px;color:#059669;letter-spacing:.14em;text-transform:uppercase;font-family:Arial,sans-serif;margin-bottom:2px">Amount Paid</div>
          <div style="font-size:16px;font-weight:bold;color:#059669;font-family:Georgia,serif">${price > 0 ? `&#8377;${price.toLocaleString('en-IN')}` : 'FREE'}</div>
        </div>
      </td></tr>
    </table>

    <p style="font-size:11px;color:#B9986B;font-family:Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;margin-bottom:14px">What Happens Next</p>
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
      ${[
        'Our team will send your <strong>course access details within 24 hours</strong> to this email.',
        'You&rsquo;ll be added to the <strong>student WhatsApp group</strong> for community support.',
        'Download <strong>study materials and class schedules</strong> from your dashboard once access is granted.',
      ].map((step, i) => `
      <tr><td style="padding:11px 0;border-bottom:1px solid #F0EAE0">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr>
          <td style="width:24px;font-size:13px;color:#E36414;font-family:Arial,sans-serif;line-height:1;padding-top:2px;font-weight:bold">${i + 1}</td>
          <td style="padding-left:10px;font-size:14px;color:#2F2A44;line-height:1.65;font-family:Georgia,serif">${step}</td>
        </tr></table>
      </td></tr>`).join('')}
    </table>

    <hr style="border:none;border-top:1px solid #EDE6DC;margin:6px 0 28px">

    <div style="text-align:center">
      <a href="${courseId ? `${APP}/my-courses/${courseId}` : `${APP}/my-courses`}" style="display:inline-block;background:#2F2A44;color:#ffffff;padding:16px 44px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;font-family:Arial,sans-serif;letter-spacing:.02em">
        Access Your Course
      </a>
    </div>

    <p style="font-size:12px;color:#C0B8CC;text-align:center;line-height:1.65;margin:18px 0 0;font-family:Arial,sans-serif">
      Questions? <a href="https://wa.me/919858784784" style="color:#C67D53;text-decoration:none">WhatsApp +91 98587 84784</a>
    </p>
  `
  return layout('#059669', header, body)
}

export async function sendCourseEnrollmentEmail(
  to: string,
  name: string,
  courseTitle: string,
  price: number,
  instructor?: string,
  courseId?: string,
): Promise<void> {
  await sendEmail(
    to,
    `Enrolled in ${courseTitle} — MahaTathastu`,
    courseEnrollmentHtml(name, courseTitle, price, instructor, courseId),
  )
}

// ─── Webinar Invite Email ────────────────────────────────────────────────────

export function webinarInviteHtml(
  name: string,
  webinarTitle: string,
  hostName: string,
  scheduledAt: string | null,
  durationMinutes: number,
  joinUrl: string,
): string {
  const header = hdr('Live Webinar Invitation')
  const dateStr = scheduledAt
    ? new Date(scheduledAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Kolkata' })
    : 'Date & time to be announced'

  const body = `
    <h1 style="font-family:Georgia,serif;font-size:26px;color:#1A1535;font-weight:bold;margin:0 0 5px;line-height:1.25">
      You're Invited, ${escHtml(name)}!
    </h1>
    <p style="font-size:14px;color:#9A96AA;margin:0 0 26px;font-family:Arial,sans-serif;line-height:1.6">
      Join us for a live session: <strong style="color:#2F2A44">${escHtml(webinarTitle)}</strong>
    </p>

    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"
      style="background:#F0F4FF;border:1px solid #C7D2FE;border-radius:12px;padding:22px 24px;margin-bottom:24px">
      <tr><td>
        <div style="font-size:10px;color:#6366F1;letter-spacing:.14em;text-transform:uppercase;font-family:Arial,sans-serif;margin-bottom:6px">Live Session</div>
        <div style="font-size:20px;font-weight:bold;color:#1A1535;font-family:Georgia,serif;margin-bottom:10px">${escHtml(webinarTitle)}</div>
        <div style="font-size:13px;color:#4A5568;font-family:Arial,sans-serif;margin-bottom:6px">
          <strong>Host:</strong> ${escHtml(hostName)}
        </div>
        <div style="font-size:13px;color:#4A5568;font-family:Arial,sans-serif;margin-bottom:6px">
          <strong>Date & Time:</strong> ${escHtml(dateStr)}
        </div>
        <div style="font-size:13px;color:#4A5568;font-family:Arial,sans-serif">
          <strong>Duration:</strong> ${durationMinutes} minutes
        </div>
      </td></tr>
    </table>

    <div style="background:#FFF8E7;border:1px solid #F6D860;border-radius:10px;padding:14px 18px;margin-bottom:24px;font-size:13px;color:#6B4C00;font-family:Arial,sans-serif;line-height:1.7">
      <strong>How to join:</strong> Click the button below at the session time. No download needed — your browser is all you need.
    </div>

    <hr style="border:none;border-top:1px solid #EDE6DC;margin:6px 0 28px">

    <div style="text-align:center">
      <a href="${joinUrl}" style="display:inline-block;background:#4F46E5;color:#ffffff;padding:16px 44px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;font-family:Arial,sans-serif;letter-spacing:.02em">
        Join Live Session
      </a>
    </div>
    <p style="font-size:11px;color:#B9B0CC;text-align:center;margin:10px 0 0;font-family:Arial,sans-serif">
      Or paste this link in your browser:<br>
      <a href="${joinUrl}" style="color:#6366F1;font-size:10px;word-break:break-all">${joinUrl}</a>
    </p>

    <p style="font-size:12px;color:#C0B8CC;text-align:center;line-height:1.65;margin:18px 0 0;font-family:Arial,sans-serif">
      Questions? <a href="https://wa.me/919858784784" style="color:#C67D53;text-decoration:none">WhatsApp +91 98587 84784</a>
    </p>
  `
  return layout('#4F46E5', header, body)
}

export async function sendWebinarInviteEmail(
  to: string,
  name: string,
  webinarTitle: string,
  hostName: string,
  scheduledAt: string | null,
  durationMinutes: number,
  joinUrl: string,
): Promise<void> {
  await sendEmail(
    to,
    `You're Invited: ${webinarTitle} — MahaTathastu Live`,
    webinarInviteHtml(name, webinarTitle, hostName, scheduledAt, durationMinutes, joinUrl),
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
