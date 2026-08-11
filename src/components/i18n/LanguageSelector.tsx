'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { LANGUAGES, langMeta, type Lang } from '@/lib/i18n/config'
import { useLanguage } from './LanguageProvider'

import Icon from '@/components/ui/Icon'
interface Props {
  /** 'light' sits on the cream navbar, 'dark' sits on a dark surface. */
  tone?: 'light' | 'dark'
  className?: string
}

export default function LanguageSelector({ tone = 'light', className = '' }: Props) {
  const { lang, setLang, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointer(e: MouseEvent | TouchEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function choose(code: Lang) {
    setOpen(false)
    if (code === lang) return
    setLang(code)
    toast.success(`${langMeta(code).native} · ${langMeta(code).english}`)
  }

  const isDark = tone === 'dark'
  const current = langMeta(lang)

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('lang.label')}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
          isDark
            ? 'text-[var(--text-on-dark)] hover:text-white hover:bg-white/10'
            : 'text-[var(--text-secondary)] hover:text-[var(--indigo-deep)] hover:bg-[var(--warm-sand)]/70'
        }`}
      >
        <Icon name="language" size={20} />
        <span className="hidden sm:inline">{current.native}</span>
        <Icon name="expand_more" size={18} className="transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'none'  }} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t('lang.choose')}
          className="absolute right-0 mt-2 w-64 max-h-[70vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-[var(--surface-container)] py-2 z-[60]"
        >
          <p className="px-4 py-2 text-xs uppercase tracking-widest font-bold text-[var(--text-muted)]">
            {t('lang.choose')}
          </p>

          {LANGUAGES.map(l => {
            const active = l.code === lang
            return (
              <button
                key={l.code}
                type="button"
                role="option"
                aria-selected={active}
                disabled={!l.ready}
                onClick={() => l.ready && choose(l.code)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                  l.ready
                    ? active
                      ? 'bg-[var(--warm-sand)]'
                      : 'hover:bg-[var(--warm-sand)]/60'
                    : 'opacity-45 cursor-not-allowed'
                }`}
              >
                <span className="flex-1 min-w-0">
                  <span className="block text-base font-semibold text-[var(--indigo-deep)] truncate">
                    {l.native}
                  </span>
                  <span className="block text-sm text-[var(--text-secondary)] truncate">
                    {l.ready ? l.english : `${l.english} · ${t('lang.comingSoon')}`}
                  </span>
                </span>
                {active && (
                  <Icon name="check_circle" size={20} className="text-[var(--terracotta)] shrink-0" />
                )}
              </button>
            )
          })}

          <p className="px-4 pt-3 pb-1 text-xs leading-relaxed text-[var(--text-muted)] border-t border-[var(--surface-container)] mt-1">
            {t('lang.partialNotice')}
          </p>
        </div>
      )}
    </div>
  )
}
