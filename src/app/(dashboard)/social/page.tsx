'use client'

import SudarshanLoader from '@/components/SudarshanLoader'
import { useState } from 'react'
import { toast } from 'sonner'

const PLATFORMS = ['Instagram', 'Twitter/X', 'Facebook', 'LinkedIn', 'WhatsApp Status']
const TOPICS = [
  'Daily panchang & auspicious timing',
  'Nakshatra wisdom for the day',
  'Mantra of the day',
  'Vastu tip of the week',
  'Numerology insight',
  'Ayurveda seasonal advice',
  'Festival significance',
  'Pilgrimage inspiration',
  'Chakra healing tip',
  'Spiritual quote',
]

interface GeneratedPost {
  platform: string
  content: string
  hashtags: string[]
  emoji: string
  charCount: number
}

export default function SocialMediaPage() {
  const [platform, setPlatform] = useState('Instagram')
  const [topic, setTopic] = useState(TOPICS[0])
  const [customTopic, setCustomTopic] = useState('')
  const [tone, setTone] = useState('inspiring')
  const [generating, setGenerating] = useState(false)
  const [posts, setPosts] = useState<GeneratedPost[]>([])
  const [copied, setCopied] = useState<number | null>(null)

  async function generate() {
    setGenerating(true)
    try {
      const finalTopic = customTopic || topic
      const res = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Create 3 different social media posts for ${platform} about: "${finalTopic}". Tone: ${tone}.

For each post return ONLY valid JSON in this format:
{"posts": [{"platform": "${platform}", "content": "post text", "hashtags": ["#tag1", "#tag2"], "emoji": "🕉️", "charCount": 150}]}

${platform === 'Twitter/X' ? 'Keep each post under 280 characters.' : ''}
${platform === 'Instagram' ? 'Use line breaks, emojis. 150-300 words.' : ''}
${platform === 'LinkedIn' ? 'Professional tone, insights-focused. 200-400 words.' : ''}
${platform === 'WhatsApp Status' ? 'Short, inspiring. Under 100 chars.' : ''}`,
          }],
          stream: false,
          system: 'You are a social media expert for a Vedic spiritual platform. Return ONLY valid JSON, no other text.',
        }),
      })
      const data = await res.json()
      const text = data.content || data.choices?.[0]?.message?.content || ''
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        setPosts(parsed.posts || [])
      } else {
        toast.error('Failed to parse response')
      }
    } catch (err) {
      toast.error('Generation failed. Try again.')
    }
    setGenerating(false)
  }

  async function copy(i: number) {
    const p = posts[i]
    const text = `${p.content}\n\n${p.hashtags.join(' ')}`
    await navigator.clipboard.writeText(text)
    setCopied(i)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--indigo-deep)] flex items-center gap-2">
          <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>share</span>
          Social Media Generator
        </h1>
        <p className="text-sm text-[var(--warm-charcoal)]/60 mt-0.5">AI-powered spiritual content for your social platforms</p>
      </div>

      <div className="card-divine p-6 space-y-5">
        {/* Platform */}
        <div>
          <label className="block text-sm font-bold text-[var(--indigo-deep)] mb-2">Platform</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => (
              <button key={p} onClick={() => setPlatform(p)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${platform === p ? 'bg-[var(--indigo-deep)] text-white' : 'bg-white border border-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 hover:border-[var(--indigo-deep)]'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Topic */}
        <div>
          <label className="block text-sm font-bold text-[var(--indigo-deep)] mb-2">Topic</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {TOPICS.map(t => (
              <button key={t} onClick={() => { setTopic(t); setCustomTopic('') }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${topic === t && !customTopic ? 'bg-[var(--terracotta)] text-white' : 'bg-white border border-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 hover:border-[var(--terracotta)]'}`}>
                {t}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={customTopic}
            onChange={e => setCustomTopic(e.target.value)}
            placeholder="Or type a custom topic..."
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--warm-sand)] bg-white text-sm focus:outline-none focus:border-[var(--saffron)]"
          />
        </div>

        {/* Tone */}
        <div>
          <label className="block text-sm font-bold text-[var(--indigo-deep)] mb-2">Tone</label>
          <div className="flex flex-wrap gap-2">
            {['inspiring', 'informative', 'devotional', 'casual', 'poetic'].map(t => (
              <button key={t} onClick={() => setTone(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${tone === t ? 'bg-[var(--indigo-deep)] text-white' : 'bg-white border border-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <button onClick={generate} disabled={generating} className="btn-divine w-full py-3 text-sm font-bold disabled:opacity-50">
          {generating ? (
            <span className="flex items-center justify-center gap-2"><SudarshanLoader size="sm" /> Generating 3 posts...</span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              Generate Content
            </span>
          )}
        </button>
      </div>

      {/* Generated posts */}
      {posts.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-bold text-[var(--indigo-deep)]">Generated Posts</h2>
          {posts.map((p, i) => (
            <div key={i} className="card-divine p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-[var(--indigo-deep)]">Post {i + 1} · {p.platform}</span>
                <button onClick={() => copy(i)} className={`text-sm px-3 py-1.5 rounded-lg border transition-all ${copied === i ? 'bg-emerald-500 text-white border-emerald-500' : 'border-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 hover:border-[var(--indigo-deep)]'}`}>
                  {copied === i ? (
                    <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Copied!</span>
                  ) : (
                    <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 0" }}>content_copy</span> Copy</span>
                  )}
                </button>
              </div>
              <div className="bg-[var(--warm-sand)] rounded-xl p-4 text-sm text-[var(--warm-charcoal)] whitespace-pre-wrap leading-relaxed mb-3">
                {p.emoji} {p.content}
              </div>
              <div className="flex flex-wrap gap-1">
                {p.hashtags?.map(h => (
                  <span key={h} className="text-xs text-[var(--terracotta)] font-medium">{h}</span>
                ))}
              </div>
              {p.charCount && <p className="text-xs text-[var(--warm-charcoal)]/40 mt-2">{p.charCount} characters</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
