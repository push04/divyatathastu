import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'

function getGroq() {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set')
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

export const maxDuration = 60

// HIGH-2: In-memory rate limiter — 10 requests per user per 10-minute window
// Note: resets on cold-start in serverless. For strict limits at scale, use Upstash Redis.
const rateLimitStore = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(userId)

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitStore.set(userId, { count: 1, windowStart: now })
    // Cleanup old entries to prevent memory leak in long-running instances
    if (rateLimitStore.size > 5000) {
      for (const [key, val] of rateLimitStore) {
        if (now - val.windowStart > RATE_LIMIT_WINDOW_MS) rateLimitStore.delete(key)
      }
    }
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 }
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count }
}

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // HIGH-2: Enforce per-user rate limit before any LLM call
  const { allowed, remaining } = checkRateLimit(user.id)
  if (!allowed) {
    return NextResponse.json(
      { error: 'You have reached the AI request limit. Please wait a few minutes before trying again.' },
      {
        status: 429,
        headers: { 'Retry-After': '600', 'X-RateLimit-Remaining': '0' },
      }
    )
  }

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
      return NextResponse.json(
        { content: completion.choices[0]?.message?.content || '' },
        { headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
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
        } catch (streamErr: any) {
          // MED-4: Log only a sanitized error code, not the full object
          console.error('Groq stream error:', streamErr?.status ?? 'unknown')
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
        'X-RateLimit-Remaining': String(remaining),
      },
    })
  } catch (err: any) {
    // MED-4: Sanitize — log only status code and type, never the raw error object
    console.error('Groq error: status=%s type=%s', err?.status ?? 'unknown', err?.error?.type ?? 'unknown')
    if (isRateLimitError(err)) {
      return NextResponse.json(
        { error: 'The guidance engine is busy right now. Please wait a minute and try again.' },
        { status: 429 }
      )
    }
    return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 500 })
  }
}
