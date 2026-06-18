'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import SudarshanLoader from '@/components/SudarshanLoader'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const SUGGESTED_EN = [
  'What does my birth nakshatra say about my career?',
  'Explain the significance of Ekadashi fasting',
  'Which gemstone is good for concentration and studies?',
  'What is the difference between Vimshottari and Yogini dasha?',
  'How do I calculate my life path number?',
  'What does Rahu in the 7th house signify?',
  'Best mantras for wealth and prosperity?',
  'How to perform Rudrabhishek at home?',
]

const SUGGESTED_HI = [
  'मेरी जन्म नक्षत्र मेरे करियर के बारे में क्या बताती है?',
  'एकादशी व्रत का महत्त्व समझाइए',
  'एकाग्रता और पढ़ाई के लिए कौन सा रत्न अच्छा है?',
  'विंशोत्तरी और योगिनी दशा में क्या अंतर है?',
  'अपना जीवन पथ अंक कैसे निकालें?',
  'सातवें भाव में राहु का क्या अर्थ है?',
  'धन और समृद्धि के लिए सर्वश्रेष्ठ मंत्र?',
  'घर पर रुद्राभिषेक कैसे करें?',
]

const SYSTEM_EN = `You are a wise Vedic spiritual guide with deep knowledge of:
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

Answer with warmth, wisdom and clarity. Use markdown formatting: **bold** for key terms, ## for section headings, - for bullet points. Use Sanskrit terms with explanations. Keep responses comprehensive but well-structured. End with a relevant mantra or blessing when appropriate.`

const SYSTEM_HI = `आप एक विद्वान वैदिक आध्यात्मिक मार्गदर्शक हैं जिन्हें निम्नलिखित का गहन ज्ञान है:
- ज्योतिष शास्त्र: कुंडली, ग्रह, दशाएं, नक्षत्र, योग
- अंकशास्त्र: चाल्डियन और पाइथागोरियन पद्धतियां
- योग, प्राणायाम और ध्यान
- आयुर्वेद: वात, पित्त, कफ, जड़ी-बूटियां, आहार
- चक्र, कुंडलिनी और ऊर्जा चिकित्सा
- मंत्र, स्तोत्र, यंत्र और तांत्रिक अभ्यास
- हिंदू दर्शन: वेद, उपनिषद, भगवद गीता
- वास्तु शास्त्र
- त्योहार, अनुष्ठान, पूजा विधि
- भारतीय तीर्थ स्थल और पवित्र भूगोल

**महत्वपूर्ण: सभी उत्तर केवल हिंदी में दें।** उत्तर गर्मजोशी, ज्ञान और स्पष्टता के साथ दें। Markdown formatting का उपयोग करें: **बोल्ड** मुख्य शब्दों के लिए, ## शीर्षकों के लिए, - बुलेट पॉइंट के लिए। संस्कृत शब्दों का उपयोग हिंदी अर्थ के साथ करें। अंत में प्रासंगिक मंत्र या आशीर्वाद दें।`

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="font-bold text-[var(--indigo-deep)] text-sm mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-[var(--indigo-deep)] mt-3 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-bold text-[var(--indigo-deep)] text-base mt-3 mb-1">$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^[-•] (.+)$/gm, '<li class="ml-3 flex gap-2"><span class="text-[var(--saffron)] flex-shrink-0 mt-0.5">•</span><span>$1</span></li>')
    .replace(/^  [-•] (.+)$/gm, '<li class="ml-6 flex gap-2 text-sm opacity-80"><span class="flex-shrink-0">◦</span><span>$1</span></li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-3 list-decimal list-inside">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>(\n|$))+/g, (match) => `<ul class="space-y-0.5 my-1">${match}</ul>`)
    .replace(/^---$/gm, '<hr class="border-[var(--warm-sand)] my-2"/>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n(?!<)/g, '<br/>')
}

export default function AIGuidePage() {
  const [lang, setLang] = useState<'en' | 'hi'>('en')
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Namaste! I am your AI Spiritual Guide, powered by Vedic wisdom and modern AI. Ask me anything about astrology, numerology, mantras, rituals, chakras, Ayurveda, or any spiritual topic. How can I illuminate your path today?',
    timestamp: new Date(),
  }])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isHindi = lang === 'hi'
  const SUGGESTED = isHindi ? SUGGESTED_HI : SUGGESTED_EN

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function switchLang(newLang: 'en' | 'hi') {
    setLang(newLang)
    const greeting = newLang === 'hi'
      ? 'नमस्ते! मैं आपका AI आध्यात्मिक मार्गदर्शक हूँ, वैदिक ज्ञान और आधुनिक AI से संचालित। ज्योतिष, अंकशास्त्र, मंत्र, अनुष्ठान, चक्र, आयुर्वेद या किसी भी आध्यात्मिक विषय के बारे में पूछें। आज मैं आपका मार्ग कैसे प्रकाशित करूं?'
      : 'Namaste! I am your AI Spiritual Guide, powered by Vedic wisdom and modern AI. Ask me anything about astrology, numerology, mantras, rituals, chakras, Ayurveda, or any spiritual topic. How can I illuminate your path today?'
    setMessages([{ role: 'assistant', content: greeting, timestamp: new Date() }])
    setInput('')
  }

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
          system: isHindi ? SYSTEM_HI : SYSTEM_EN,
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
    } catch {
      toast.error(isHindi ? 'उत्तर प्राप्त नहीं हुआ। कृपया पुनः प्रयास करें।' : 'Failed to get response. Please try again.')
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
        <div className="w-10 h-10 flex-shrink-0"><SudarshanLoader px={40} /></div>
        <div>
          <h1 className="font-bold">{isHindi ? 'AI आध्यात्मिक मार्गदर्शक' : 'AI Spiritual Guide'}</h1>
          <p className="text-xs text-white/60">{isHindi ? 'वैदिक ज्ञान · AI द्वारा संचालित' : 'Vedic Wisdom · Powered by AI'}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {/* Language Toggle */}
          <div className="flex items-center bg-white/10 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => switchLang('en')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${lang === 'en' ? 'bg-white text-[var(--indigo-deep)]' : 'text-white/70 hover:text-white'}`}
            >
              EN
            </button>
            <button
              onClick={() => switchLang('hi')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${lang === 'hi' ? 'bg-white text-[var(--indigo-deep)]' : 'text-white/70 hover:text-white'}`}
            >
              हिं
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-white/60">{isHindi ? 'ऑनलाइन' : 'Online'}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--kutch-white)]">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${m.role === 'assistant' ? 'gradient-saffron text-white' : 'bg-[var(--indigo-deep)] text-white'}`}>
              {m.role === 'assistant' ? <SudarshanLoader px={32} /> : 'U'}
            </div>
            <div className={`max-w-[82%] sm:max-w-[68%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'assistant' ? 'bg-white border border-[var(--warm-sand)] text-[var(--warm-charcoal)] rounded-tl-sm' : 'bg-[var(--indigo-deep)] text-white rounded-tr-sm'}`}>
              {m.content === '' && streaming && i === messages.length - 1 ? (
                <span className="flex gap-1 py-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--saffron)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[var(--saffron)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[var(--saffron)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              ) : m.role === 'assistant' ? (
                <div
                  className="prose-sm max-w-none leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: '<p>' + renderMarkdown(m.content) + '</p>' }}
                />
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}

        {/* Suggestions (only on first message) */}
        {messages.length === 1 && (
          <div className="space-y-2">
            <p className="text-xs text-[var(--warm-charcoal)]/50 px-11">
              {isHindi ? 'सुझाए गए प्रश्न:' : 'Suggested questions:'}
            </p>
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
            placeholder={isHindi ? 'ज्योतिष, मंत्र, अनुष्ठान के बारे में पूछें...' : 'Ask about astrology, mantras, rituals...'}
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
        <p className="text-center text-xs text-[var(--warm-charcoal)]/30 mt-2">
          {isHindi ? 'AI उत्तर केवल आध्यात्मिक मार्गदर्शन के लिए हैं, चिकित्सा/कानूनी सलाह नहीं' : 'AI responses are for spiritual guidance only, not medical/legal advice'}
        </p>
      </div>
    </div>
  )
}
