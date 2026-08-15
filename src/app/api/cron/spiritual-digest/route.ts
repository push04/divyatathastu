import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
import { sendSpiritualDigest, type DigestContent, type DigestPanchang } from '@/lib/email'
import { getPanchangForDate } from '@/lib/noxatra/astrology'
import { NAKSHATRA_PROFILES, TITHI_MEANING, termForDate } from '@/lib/noxatra/panchangKnowledge'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Cycling topics - one per 3-day window (8 topics × 3 days = 24-day cycle)
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

// New Delhi is the reference location, as is conventional for a national panchang.
const REF_LAT = 28.6139
const REF_LNG = 77.2090

/** Today's real panchang, paired with the classical reference data for it.
 *  Returns undefined rather than throwing - a digest without the almanac block
 *  is still worth sending, a cron that 500s is not. */
function buildPanchang(dateISO: string): DigestPanchang | undefined {
  try {
    const pan = getPanchangForDate(dateISO, REF_LAT, REF_LNG) as any
    const prof = NAKSHATRA_PROFILES[pan.nakshatra]
    if (!prof) return undefined
    return {
      tithi: pan.tithi,
      tithiMeaning: TITHI_MEANING[pan.tithi] || 'a day for steady, ordinary work',
      nakshatra: prof.name,
      nakshatraDevanagari: prof.devanagari,
      nakshatraDeity: prof.deity,
      nakshatraSymbol: prof.symbol,
      nakshatraFavours: prof.favours,
      nakshatraAvoid: prof.avoid,
      yoga: pan.yoga,
      karana: pan.karana,
      moonSign: pan.moonSign,
      sunrise: pan.sunrise,
      sunset: pan.sunset,
      brahmaHour: pan.brahmaHour,
      abhijit: pan.abhijitMuhurat,
      rahuKaal: pan.rahuKaal,
    }
  } catch (e: any) {
    console.warn('[Digest] panchang failed:', e?.message)
    return undefined
  }
}

function getTopic(): string {
  const start = new Date('2026-01-01').getTime()
  const daysSince = Math.floor((Date.now() - start) / 86_400_000)
  return TOPICS[Math.floor(daysSince / 3) % TOPICS.length]
}

async function generateDigest(topic: string, panchang: DigestPanchang | undefined, dateStr: string): Promise<DigestContent> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  // The model is given the day's real panchang and told to write around it.
  // Previously it received only a topic name, which is why the output could
  // have been sent on any day of any year without anyone noticing.
  const skyContext = panchang
    ? `TODAY'S ACTUAL SKY (computed from the ephemeris - treat as fact, do not contradict):
- Tithi: ${panchang.tithi} (${panchang.tithiMeaning})
- Moon in nakshatra ${panchang.nakshatra}, presiding deity ${panchang.nakshatraDeity}, symbol ${panchang.nakshatraSymbol}
- This nakshatra traditionally favours: ${panchang.nakshatraFavours}
- Moon sign: ${panchang.moonSign}; Yoga: ${panchang.yoga}; Karana: ${panchang.karana}
- Brahma Muhurta ${panchang.brahmaHour}; Abhijit ${panchang.abhijit}; Rahu Kaal ${panchang.rahuKaal}`
    : 'Today\'s panchang could not be computed; write without referring to specific transits.'

  const prompt = `You are a Vedic scholar writing the daily almanac letter for MahaTathastu. Today is ${dateStr}.
Theme of this edition: "${topic}"

${skyContext}

Write 8 sections separated by "---".

1. INTRO: 2-3 sentences. Open by naming what is actually true of today's sky above and what it means for the reader. Concrete, not decorative.
2. INSIGHT1: A specific teaching on "${topic}". Name the concept in Sanskrit with its English sense. State something a reader would not already know.
3. INSIGHT2: A second teaching. Where a classical text is relevant, name it (Bṛhat Parāśara Horā Śāstra, Yoga Sūtra, Caraka Saṃhitā, Bṛhat Saṃhitā, an Upaniṣad). Do not invent verse numbers you are unsure of.
4. INSIGHT3: A third teaching, ideally correcting a common misconception about "${topic}".
5. MANTRA: One Sanskrit mantra fitting today's nakshatra or theme. Give Devanagari, then IAST transliteration on a second line.
6. MANTRA_MEANING: Word-sense of the key terms, then the traditional benefit. 2-3 sentences.
7. PRACTICAL_TIP: One practice for TODAY specifically, tied to a real window above (Brahma Muhurta, Abhijit, or avoiding Rahu Kaal). Give the actual clock time. 2-3 sentences.
8. CLOSING: One sentence, warm, no exclamation marks.

RULES:
- Never write filler like "awareness is the first step" or "small steps create change". Every sentence must carry information.
- Do not address the reader as "dear seeker" or use greeting formulas; the email adds its own greeting.
- No markdown, no section labels, no numbering in the output. Only the 8 blocks separated by "---".`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    stream: false,
    max_tokens: 1400,
    temperature: 0.7,
  })

  const raw = completion.choices[0]?.message?.content || ''
  const parts = raw.split('---').map(s => s.trim()).filter(Boolean)

  // Fallbacks are built from the real panchang where possible, so even a failed
  // model call still produces a digest specific to today rather than a platitude.
  const fallbackIntro = panchang
    ? `The Moon stands in ${panchang.nakshatra} today, under ${panchang.nakshatraDeity}. It is ${panchang.tithi} - ${panchang.tithiMeaning}.`
    : 'Ancient Vedic wisdom holds practical keys for your everyday life.'
  const fallbackTip = panchang
    ? `Sit for japa during Brahma Muhurta, ${panchang.brahmaHour}, when the mind is least disturbed. If that hour is not possible, use Abhijit Muhurat at ${panchang.abhijit}, and begin nothing new during Rahu Kaal (${panchang.rahuKaal}).`
    : 'Take five minutes today to sit quietly, breathe evenly, and set one clear intention.'

  return {
    topic,
    intro: parts[0] || fallbackIntro,
    insights: [
      parts[1] || (panchang ? `${panchang.nakshatra} favours ${panchang.nakshatraFavours}.` : 'Discernment (viveka) is the faculty the tradition asks you to build first.'),
      parts[2] || (panchang ? `Traditionally one avoids ${panchang.nakshatraAvoid} under this nakshatra.` : 'Practice (abhyāsa) and non-attachment (vairāgya) are prescribed together; either alone fails.'),
      parts[3] || (panchang ? `The Moon sits in ${panchang.moonSign} today, colouring the mood of the whole day.` : 'A remedy (upāya) changes the person meeting the karma, not the karma itself.'),
    ],
    mantra: parts[4] || 'ॐ नमः शिवाय\nOṃ Namaḥ Śivāya',
    mantraTranslation: parts[5] || 'I bow to Śiva, the auspicious one - and to the self that is not separate from him. Traditionally chanted for purification and for steadiness of mind.',
    practicalTip: parts[6] || fallbackTip,
    closing: parts[7] || 'May the day meet you well prepared.',
    panchang,
    term: termForDate(new Date()),
  }
}

export async function GET(req: NextRequest) {
  // Vercel cron authentication - always require the secret; fail-closed when not set
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY not set' }, { status: 500 })
  }

  try {
    const topic = getTopic()
    const now = new Date()
    const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const isoDate = now.toISOString().slice(0, 10)

    // Today's real panchang, then the written content generated around it.
    const panchang = buildPanchang(isoDate)
    const digest = await generateDigest(topic, panchang, dateStr)

    // Fetch all users via admin client (paginated to handle >1000 users)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const allUsers: any[] = []
    let page = 1
    while (true) {
      const { data: { users: batch }, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 })
      if (error) throw error
      allUsers.push(...batch)
      if (batch.length < 1000) break
      page++
    }
    const users = allUsers

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

    return NextResponse.json({
      success: true,
      topic,
      nakshatra: panchang?.nakshatra ?? null,
      tithi: panchang?.tithi ?? null,
      panchangComputed: !!panchang,
      sent,
      failed,
      total: users.length,
    })
  } catch (err: any) {
    console.error('[Cron] spiritual-digest error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
