'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const SUGGESTED = [
  'What does my birth nakshatra say about my career?',
  'Explain the significance of Ekadashi fasting',
  'Which gemstone is good for concentration and studies?',
  'What is the difference between Vimshottari and Yogini dasha?',
  'How do I calculate my life path number?',
  'What does Rahu in the 7th house signify?',
  'Best mantras for wealth and prosperity?',
  'How to perform Rudrabhishek at home?',
]

export default function AIGuidePage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Namaste! I am your AI Spiritual Guide, powered by Vedic wisdom and modern AI. Ask me anything about astrology, numerology, mantras, rituals, chakras, Ayurveda, or any spiritual topic. How can I illuminate your path today?',
    timestamp: new Date(),
  }])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text?: string) {
    const q = (text || input).trim()
    if (!q || streaming) return

    setInput('')
    const userMsg: Message = { role: 'user', content: q, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setStreaming(true)

    const placeholder: Message = { role: 'assistant', content: '', timestamp: new Date() }
    setMessages(prev => [...prev, placeholder])

    try {
      const res = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          system: `You are a wise Vedic spiritual guide with deep knowledge of:
- Jyotisha (Vedic Astrology): kundli, planets, dashas, nakshatras, yogas
- Numerology: Chaldean and Pythagorean systems
- Yoga, Pranayama, and Meditation
- Ayurveda: Vata, Pitta, Kapha, herbs, diet
- Chakras, kundalini, and energy healing
- Mantras, Stotras, Yantras, and Tantric practices
- Hindu philosophy: Vedas, Upanishads, Bhagavad Gita
- Vastu Shastra
- Festivals, rituals, puja vidhi
- Indian pilgrimage and sacred geography

Answer with warmth, wisdom and clarity. Use Sanskrit terms with explanations. Keep responses concise but complete. End with a relevant mantra or blessing when appropriate.`,
        }),
      })

      if (!res.ok) throw new Error('Failed')
      if (!res.body) throw new Error('No stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const json = JSON.parse(data)
            const delta = json.choices?.[0]?.delta?.content || ''
            full += delta
            setMessages(prev => {
              const msgs = [...prev]
              msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: full }
              return msgs
            })
          } catch {}
        }
      }
    } catch (err) {
      toast.error('Failed to get response. Please try again.')
      setMessages(prev => prev.slice(0, -1))
    }

    setStreaming(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] lg:h-screen">
      {/* Header */}
      <div className="px-6 py-4 bg-[var(--indigo-deep)] text-white flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-full gradient-saffron flex items-center justify-center text-xl"><span className="material-symbols-outlined text-[20px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span></div>
        <div>
          <h1 className="font-bold">AI Spiritual Guide</h1>
          <p className="text-xs text-white/60">Powered by Groq · Llama-3.3-70B · Vedic knowledge</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-white/60">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--kutch-white)]">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${m.role === 'assistant' ? 'gradient-saffron text-white' : 'bg-[var(--indigo-deep)] text-white'}`}>
              {m.role === 'assistant' ? 'ॐ' : 'U'}
            </div>
            <div className={`max-w-[80%] sm:max-w-[65%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'assistant' ? 'bg-white border border-[var(--warm-sand)] text-[var(--warm-charcoal)] rounded-tl-sm' : 'bg-[var(--indigo-deep)] text-white rounded-tr-sm'}`}>
              {m.content || (streaming && i === messages.length - 1 ? <span className="flex gap-1 py-1"><span className="w-2 h-2 rounded-full bg-[var(--saffron)] animate-bounce" style={{ animationDelay: '0ms' }} /><span className="w-2 h-2 rounded-full bg-[var(--saffron)] animate-bounce" style={{ animationDelay: '150ms' }} /><span className="w-2 h-2 rounded-full bg-[var(--saffron)] animate-bounce" style={{ animationDelay: '300ms' }} /></span> : '')}
            </div>
          </div>
        ))}

        {/* Suggestions (only on first message) */}
        {messages.length === 1 && (
          <div className="space-y-2">
            <p className="text-xs text-[var(--warm-charcoal)]/50 px-11">Suggested questions:</p>
            <div className="flex flex-wrap gap-2 pl-11">
              {SUGGESTED.map(s => (
                <button key={s} onClick={() => sendMessage(s)} className="text-xs bg-white border border-[var(--warm-sand)] hover:border-[var(--saffron)] px-3 py-1.5 rounded-full text-[var(--indigo-deep)] transition-all text-left">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-[var(--warm-sand)] flex-shrink-0">
        <div className="max-w-4xl mx-auto flex gap-3 items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about astrology, mantras, rituals..."
            disabled={streaming}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--warm-sand)] bg-[var(--kutch-white)] text-sm focus:outline-none focus:border-[var(--saffron)] disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={streaming || !input.trim()}
            className="w-10 h-10 rounded-xl bg-[var(--indigo-deep)] text-white flex items-center justify-center hover:bg-[var(--indigo-deep)]/90 disabled:opacity-40 transition-all flex-shrink-0"
          >
            {streaming
              ? <span className="material-symbols-outlined text-[18px] animate-spin" style={{ fontVariationSettings: "'FILL' 0" }}>progress_activity</span>
              : <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            }
          </button>
        </div>
        <p className="text-center text-xs text-[var(--warm-charcoal)]/30 mt-2">AI responses are for spiritual guidance only, not medical/legal advice</p>
      </div>
    </div>
  )
}
