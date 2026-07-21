import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export const maxDuration = 30

const VALID_CRYSTAL_IDS = [
  'amethyst', 'rose-quartz', 'clear-quartz', 'citrine',
  'black-tourmaline', 'lapis-lazuli', 'moonstone', 'green-aventurine',
  'tigers-eye', 'sodalite', 'red-jasper', 'labradorite',
]

function getGroq() {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set')
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name, dob, timeOfBirth, gender,
      lifePathNumber, nameNumber, destinyNumber,
      rulingPlanet, dayLord, birthHourPlanet,
      mathRanking,
    } = body

    if (!name || !dob) {
      return NextResponse.json({ error: 'name and dob are required' }, { status: 400 })
    }

    const groq = getGroq()

    const systemPrompt = `You are a Vedic crystal healer and numerologist with deep expertise in Jyotish, \
crystal therapy, and gemstone science. You recommend healing crystals based on precise numerological \
and planetary data. Always respond with valid JSON only. Never add any explanation outside the JSON.`

    const userPrompt = `Based on the following Vedic numerological profile, recommend the TOP 3 healing crystals \
in ranked order (most suitable first). Choose from these crystal IDs only: ${VALID_CRYSTAL_IDS.join(', ')}.

SEEKER'S PROFILE:
- Name: ${name}
- Date of Birth: ${dob}
- Time of Birth: ${timeOfBirth || 'Unknown'}
- Gender: ${gender}

VEDIC NUMEROLOGICAL ANALYSIS:
- Life Path Number: ${lifePathNumber} (primary soul number, highest weight)
- Name Number (Chaldean): ${nameNumber} (destiny expression)
- Destiny Number: ${destinyNumber} (full DOB digit sum)
- Ruling Planet: ${rulingPlanet}
- Day Lord (weekday planet): ${dayLord}
- Birth Hour Ruling Planet: ${birthHourPlanet || 'Unknown'}

MATHEMATICAL PRE-RANKING (for reference, you may reorder based on deeper Vedic reasoning):
${mathRanking.slice(0, 5).map((r: { id: string; score: number }, i: number) => `${i + 1}. ${r.id} (score: ${r.score})`).join('\n')}

Return ONLY this JSON structure, no other text:
{
  "recommendations": [
    {
      "crystalId": "crystal-id-here",
      "rank": 1,
      "rationale": "Two sentences explaining why this crystal is the strongest match for this seeker's specific numerological and planetary profile."
    },
    {
      "crystalId": "crystal-id-here",
      "rank": 2,
      "rationale": "Two sentences explaining why this crystal complements the primary and suits this seeker."
    },
    {
      "crystalId": "crystal-id-here",
      "rank": 3,
      "rationale": "Two sentences on why this supporting crystal rounds out the energetic prescription."
    }
  ],
  "soulMessage": "One to two sentences — a personalized message to the seeker about their cosmic crystal journey."
}`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
      max_tokens: 700,
      temperature: 0.4,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content || ''

    try {
      const parsed = JSON.parse(raw)
      if (parsed.recommendations) {
        parsed.recommendations = parsed.recommendations.filter(
          (r: { crystalId: string }) => VALID_CRYSTAL_IDS.includes(r.crystalId)
        )
      }
      if (!parsed.recommendations || parsed.recommendations.length < 3) {
        return NextResponse.json({ error: 'incomplete_response', fallback: true }, { status: 206 })
      }
      return NextResponse.json(parsed)
    } catch {
      return NextResponse.json({ error: 'parse_error', fallback: true }, { status: 206 })
    }

  } catch (err: any) {
    console.error('[crystal-recommendation]', err)
    if (err?.status === 429) {
      return NextResponse.json({ error: 'rate_limited', fallback: true }, { status: 429 })
    }
    return NextResponse.json({ error: 'groq_error', fallback: true }, { status: 500 })
  }
}
