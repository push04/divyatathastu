import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

function getGroq() {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set')
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

export const maxDuration = 60

function isRateLimitError(err: any): boolean {
  return err?.status === 429 || err?.error?.type === 'tokens' ||
    (typeof err?.message === 'string' && /rate.?limit/i.test(err.message))
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: any
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      lastError = err
      if (isRateLimitError(err) && attempt < maxAttempts) {
        // Exponential back-off: 3 s, then 6 s
        await new Promise(resolve => setTimeout(resolve, attempt * 3000))
        continue
      }
      throw err
    }
  }
  throw lastError
}

export async function POST(req: NextRequest) {
  try {
    const { messages, system, reportData, reportType, memberName, stream: useStream = true } = await req.json()

    const systemPrompt = system || `You are Divya, an AI astrology and holistic life guidance expert trained in Vedic astrology, numerology, Ayurveda, chakra science, and mantra science. You are generating a ${reportType || 'holistic'} report for ${memberName || 'the seeker'}.

Generate deeply personalized, compassionate, and actionable insights. Write in a warm, respectful, and spiritual tone appropriate for Indian families. Avoid generic statements. Make every insight specific to the data provided.

${reportData ? `Report Data: ${JSON.stringify(reportData, null, 2)}` : ''}`

    const groq = getGroq()

    if (!useStream) {
      const completion = await withRetry(() => groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...(messages || [{ role: 'user', content: `Please analyze the data and provide a comprehensive ${reportType || 'holistic'} reading.` }]),
        ],
        stream: false,
        max_tokens: 2048,
        temperature: 0.7,
      }))
      return NextResponse.json({ content: completion.choices[0]?.message?.content || '' })
    }

    // For streaming, retry applies to the initial stream creation only
    const stream = await withRetry(() => groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...(messages || [{ role: 'user', content: `Please analyze the data and provide a comprehensive ${reportType || 'holistic'} reading.` }]),
      ],
      stream: true,
      max_tokens: 4096,
      temperature: 0.7,
    }))

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || ''
            if (delta) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: delta } }] })}\n\n`))
          }
        } catch (streamErr) {
          console.error('Groq stream error:', streamErr)
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
  } catch (err: any) {
    console.error('Groq error:', err)
    if (isRateLimitError(err)) {
      return NextResponse.json(
        { error: 'AI is busy right now (rate limit). Please wait 1–2 minutes and try again.' },
        { status: 429 }
      )
    }
    return NextResponse.json({ error: 'AI generation failed. Please try again.' }, { status: 500 })
  }
}
