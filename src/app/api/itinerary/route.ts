import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'

function getGroq() {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set')
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { mandirs, startCity, days, travelMode, startDate } = await req.json()

    if (!mandirs?.length || !startCity || !days) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const mandirList = mandirs.map((m: any) =>
      `${m.name} (${m.city}, ${m.state}) — Deity: ${m.deity}, Timing: ${m.timing}`
    ).join('\n')

    const prompt = `Create a ${days}-day pilgrimage itinerary starting from ${startCity}.

Temples to visit:
${mandirList}

Travel mode: ${travelMode || 'mixed (train/car)'}
Start date: ${startDate || 'upcoming auspicious date'}

Return a structured JSON itinerary with this exact format:
{
  "title": "string",
  "totalDays": number,
  "startCity": "string",
  "highlights": ["string"],
  "days": [
    {
      "day": 1,
      "date": "Day 1",
      "title": "string",
      "mandirs": [
        {
          "time": "6:00 AM",
          "name": "Temple name",
          "activity": "Morning darshan and abhishek",
          "duration": "2 hours",
          "tips": "Special puja available at..."
        }
      ],
      "travel": {
        "from": "city",
        "to": "city",
        "mode": "train/car",
        "duration": "3 hours",
        "trainNumber": "optional"
      },
      "accommodation": "Hotel suggestion or dharamshala",
      "meals": "Local food suggestions",
      "auspiciousTiming": "Best darshan time today"
    }
  ],
  "estimatedCost": {
    "budget": "₹X per person",
    "comfortable": "₹Y per person",
    "luxury": "₹Z per person"
  },
  "packingList": ["string"],
  "importantNotes": ["string"]
}`

    const groq = getGroq()
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert Vedic pilgrimage guide with deep knowledge of Indian temples, travel routes, auspicious timings, and spiritual practices. Return only valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 3000,
    })

    const text = completion.choices[0]?.message?.content || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Failed to generate itinerary' }, { status: 500 })

    const itinerary = JSON.parse(jsonMatch[0])
    return NextResponse.json({ success: true, data: itinerary })
  } catch (err) {
    console.error('Itinerary error:', err)
    return NextResponse.json({ error: 'Itinerary generation failed' }, { status: 500 })
  }
}
