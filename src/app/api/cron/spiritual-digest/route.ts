import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
import { sendSpiritualDigest, type DigestContent } from '@/lib/email'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Cycling topics — one per 3-day window (8 topics × 3 days = 24-day cycle)
const TOPICS = [
  'Vedic Astrology & Jyotish Wisdom',
  'Nakshatra Insights & Star Power',
  'Vastu Shastra for Harmony',
  'Numerology & Life Path Guidance',
  'Ayurveda & Holistic Wellness',
  'Mantra Sadhana & Meditation',
  'Chakra Healing & Energy Balance',
  'Yoga, Pranayama & Spiritual Fitness',
]

function getTopic(): string {
  const start = new Date('2026-01-01').getTime()
  const daysSince = Math.floor((Date.now() - start) / 86_400_000)
  return TOPICS[Math.floor(daysSince / 3) % TOPICS.length]
}

async function generateDigest(topic: string): Promise<DigestContent> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const prompt = `You are a Vedic wisdom teacher at MahaTathastu, India's premier holistic life platform.
Today's digest theme: "${topic}"

Write a spiritual adhyatmic digest with exactly these 8 sections, separated by "---":
1. INTRO: 2-3 warm, insightful sentences about today's theme. Make it feel personal.
2. INSIGHT1: One key insight about this topic (1-2 sentences, specific and actionable)
3. INSIGHT2: Second key insight (1-2 sentences)
4. INSIGHT3: Third key insight (1-2 sentences)
5. MANTRA: A relevant Sanskrit mantra or shloka (1-2 lines, include transliteration)
6. MANTRA_MEANING: Simple English meaning and benefit of the mantra (1-2 sentences)
7. PRACTICAL_TIP: A specific, easy practice for today (2-3 sentences, very practical)
8. CLOSING: One uplifting closing sentence in a warm, guru-like voice

Return ONLY the 8 sections separated by "---". No labels, no extra text.`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    stream: false,
    max_tokens: 700,
    temperature: 0.75,
  })

  const raw = completion.choices[0]?.message?.content || ''
  const parts = raw.split('---').map(s => s.trim()).filter(Boolean)

  return {
    topic,
    intro: parts[0] || 'Ancient Vedic wisdom holds powerful keys for your everyday life.',
    insights: [
      parts[1] || 'Awareness is the first step to transformation.',
      parts[2] || 'Your daily choices shape your destiny.',
      parts[3] || 'Small consistent practices create lasting change.',
    ],
    mantra: parts[4] || 'Om Namah Shivaya',
    mantraTranslation: parts[5] || 'I bow to Shiva, the inner self — a mantra of purification and surrender.',
    practicalTip: parts[6] || 'Take 5 minutes today to sit quietly, breathe deeply, and set one clear intention for the day.',
    closing: parts[7] || 'May divine wisdom illuminate every step of your sacred journey.',
  }
}

export async function GET(req: NextRequest) {
  // Vercel cron authentication
  const authHeader = req.headers.get('authorization')
  if (
    process.env.VERCEL_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY not set' }, { status: 500 })
  }

  try {
    const topic = getTopic()
    const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

    // Generate digest content once for all users
    const digest = await generateDigest(topic)

    // Fetch all users via admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    if (error) throw error

    let sent = 0
    let failed = 0

    for (const user of users) {
      if (!user.email) continue
      const name = (user.user_metadata?.full_name as string) || user.email.split('@')[0]
      try {
        await sendSpiritualDigest(user.email, name, digest, dateStr)
        sent++
        // Small delay to stay within SMTP rate limits
        await new Promise(r => setTimeout(r, 200))
      } catch {
        failed++
      }
    }

    return NextResponse.json({ success: true, topic, sent, failed, total: users.length })
  } catch (err: any) {
    console.error('[Cron] spiritual-digest error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
