'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/components/i18n/LanguageProvider'

import Icon from '@/components/ui/Icon'
interface Msg { role: 'user' | 'assistant'; content: string }

const MAX_CHARS = 600
const STORAGE_KEY = 'dt_chat_open'

/** Routes where a floating bubble would sit on top of something important. */
const HIDDEN_ON = ['/admin', '/webinar/', '/login', '/register', '/verify-otp', '/forgot-password']

export default function ChatWidget() {
  const pathname = usePathname()
  const { t, lang } = useLanguage()

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Restore the open/closed state so the panel survives navigation.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') setOpen(true)
    } catch { /* private mode */ }
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, open ? '1' : '0')
    } catch { /* private mode */ }
  }, [open])

  // Seed the greeting in whatever language is active, and refresh it if the
  // visitor switches language before saying anything.
  useEffect(() => {
    setMessages(prev =>
      prev.length <= 1 ? [{ role: 'assistant', content: t('chat.greeting') }] : prev,
    )
  }, [t, lang])

  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open, sending])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim().slice(0, MAX_CHARS)
      if (!trimmed || sending) return

      setError(null)
      setInput('')
      const next: Msg[] = [...messages, { role: 'user', content: trimmed }]
      setMessages(next)
      setSending(true)

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Only user/assistant turns are sent; the server rebuilds the system prompt.
          body: JSON.stringify({
            messages: next.slice(-10).map(m => ({ role: m.role, content: m.content })),
          }),
        })

        if (res.status === 429) {
          setError(t('chat.rateLimited'))
          return
        }

        const data = await res.json().catch(() => null)
        if (!res.ok || !data?.content) {
          setError(t('chat.error'))
          return
        }

        setMessages(m => [...m, { role: 'assistant', content: data.content }])
      } catch {
        setError(t('chat.error'))
      } finally {
        setSending(false)
        inputRef.current?.focus()
      }
    },
    [messages, sending, t],
  )

  if (HIDDEN_ON.some(p => pathname.startsWith(p) || pathname.includes(p))) return null

  const suggestions = [t('chat.suggest1'), t('chat.suggest2'), t('chat.suggest3')]
  const showSuggestions = messages.length <= 1 && !sending

  return (
    <>
      {/* ── Launcher ── */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t('chat.open')}
          className="fixed z-[80] bottom-5 right-5 sm:bottom-6 sm:right-6 flex items-center gap-2.5 pl-4 pr-5 py-3.5 rounded-full text-white font-bold text-base transition-transform active:scale-95 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, var(--indigo-deep) 0%, var(--plum) 100%)',
            boxShadow: '0 10px 32px rgba(47,42,68,0.4)',
          }}
        >
          <Icon name="forum" size={24} />
          <span className="hidden sm:inline">{t('chat.title')}</span>
        </button>
      )}

      {/* ── Panel ── */}
      {open && (
        <div
          role="dialog"
          aria-label={t('chat.title')}
          className="fixed z-[80] inset-x-0 bottom-0 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[400px] flex flex-col bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden"
          style={{
            height: 'min(78vh, 620px)',
            boxShadow: '0 24px 70px rgba(28,30,74,0.35)',
            border: '1px solid var(--surface-container)',
          }}
        >
          {/* Header */}
          <div
            className="px-5 py-4 flex items-center gap-3 shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--indigo-deep) 0%, var(--plum) 100%)' }}
          >
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <Icon name="forum" size={22} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-white leading-tight truncate">{t('chat.title')}</p>
              <p className="text-sm text-[var(--text-on-dark-secondary)] leading-tight truncate">{t('chat.subtitle')}</p>
            </div>
            {messages.length > 1 && (
              <button
                type="button"
                onClick={() => { setMessages([{ role: 'assistant', content: t('chat.greeting') }]); setError(null) }}
                aria-label={t('chat.clear')}
                title={t('chat.clear')}
                className="p-2 rounded-lg text-[var(--text-on-dark-secondary)] hover:text-white hover:bg-white/10 transition-colors"
              >
                <Icon name="refresh" size={20} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('chat.close')}
              className="p-2 rounded-lg text-[var(--text-on-dark-secondary)] hover:text-white hover:bg-white/10 transition-colors"
            >
              <Icon name="close" size={22} />
            </button>
          </div>

          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: 'var(--kutch-white)' }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[86%] px-4 py-3 rounded-2xl text-base leading-relaxed whitespace-pre-wrap break-words"
                  style={
                    m.role === 'user'
                      ? { background: 'var(--indigo-deep)', color: '#fff', borderBottomRightRadius: 6 }
                      : {
                          background: '#fff',
                          color: 'var(--warm-charcoal)',
                          border: '1px solid var(--surface-container)',
                          borderBottomLeftRadius: 6,
                        }
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div
                  className="px-4 py-3 rounded-2xl bg-white border border-[var(--surface-container)] flex items-center gap-2"
                  style={{ borderBottomLeftRadius: 6 }}
                >
                  {[0, 0.18, 0.36].map(d => (
                    <span
                      key={d}
                      className="w-2 h-2 rounded-full bg-[var(--terracotta)]"
                      style={{ animation: `divine-pulse 1.1s ease-in-out ${d}s infinite` }}
                    />
                  ))}
                  <span className="text-sm text-[var(--text-secondary)] ml-1">{t('chat.thinking')}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="mx-1 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm leading-relaxed">
                {error}
              </div>
            )}

            {showSuggestions && (
              <div className="pt-2 space-y-2">
                {suggestions.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="w-full text-left px-4 py-3 rounded-xl bg-white border border-[var(--surface-container)] text-base text-[var(--indigo-deep)] hover:border-[var(--terracotta)] hover:bg-[var(--warm-sand)]/40 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="shrink-0 border-t border-[var(--surface-container)] bg-white px-3 pt-3 pb-3">
            <form
              onSubmit={e => { e.preventDefault(); send(input) }}
              className="flex items-end gap-2"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
                }}
                rows={1}
                maxLength={MAX_CHARS}
                placeholder={t('chat.placeholder')}
                aria-label={t('chat.placeholder')}
                className="flex-1 resize-none rounded-2xl border-2 border-[var(--surface-container)] focus:border-[var(--terracotta)] focus:outline-none px-4 py-3 text-base leading-relaxed max-h-32"
                style={{ minHeight: 48 }}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                aria-label={t('chat.send')}
                className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-white transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, var(--saffron-vivid), var(--terracotta))' }}
              >
                <Icon name="send" size={22} />
              </button>
            </form>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-2 px-1">
              {t('chat.disclaimer')}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
