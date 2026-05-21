import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

function getGroq() {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set')
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { messages, system, reportData, reportType, memberName, stream: useStream = true } = await req.json()

    const systemPrompt = system || `You are Divya, an AI astrology and holistic life guidance expert trained in Vedic astrology, numerology, Ayurveda, chakra science, and mantra science. You are generating a ${reportType || 'holistic'} report for ${memberName || 'the seeker'}.

Generate deeply personalized, compassionate, and actionable insights. Write in a warm, respectful, and spiritual tone appropriate for Indian families. Avoid generic statements. Make every insight specific to the data provided.

${reportData ? `Report Data: ${JSON.stringify(reportData, null, 2)}` : ''}`

    const groq = getGroq()
    if (!useStream) {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...(messages || [{ role: 'user', content: `Please analyze the data and provide a comprehensive ${reportType || 'holistic'} reading.` }]),
        ],
        stream: false,
        max_tokens: 2048,
        temperature: 0.7,
      })
      return NextResponse.json({ content: completion.choices[0]?.message?.content || '' })
    }

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...(messages || [{ role: 'user', content: `Please analyze the data and provide a comprehensive ${reportType || 'holistic'} reading.` }]),
      ],
      stream: true,
      max_tokens: 4096,
      temperature: 0.7,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content || ''
          if (delta) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: delta } }] })}\n\n`))
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (err) {
    console.error('Groq error:', err)
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }
}
