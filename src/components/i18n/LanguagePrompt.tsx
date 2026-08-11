'use client'

import { useEffect, useState } from 'react'
import { getSavedCity } from '@/lib/utils/getLocation'
import {
  LANGUAGES,
  langMeta,
  suggestLanguageForCoords,
  type Lang,
  type LangSuggestion,
} from '@/lib/i18n/config'
import { useLanguage } from './LanguageProvider'

import Icon from '@/components/ui/Icon'
/**
 * First-visit language offer.
 *
 * Uses the coordinates we already have (a saved city, or a geolocation
 * permission the visitor grants) to *suggest* a regional language. It never
 * switches on its own - the visitor always chooses, and can pick any language
 * from the full list. Shown once; the answer is remembered.
 */
export default function LanguagePrompt() {
  const { lang, setLang, t, hydrating, prompted, markPrompted } = useLanguage()
  const [suggestion, setSuggestion] = useState<LangSuggestion | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (hydrating || prompted) return

    let cancelled = false

    function apply(lat: number, lng: number) {
      if (cancelled) return
      const s = suggestLanguageForCoords(lat, lng)
      // Only worth interrupting someone if we can actually offer the language
      // and they are not already reading it.
      if (s && s.ready && s.lang !== lang) {
        setSuggestion(s)
        setVisible(true)
      }
    }

    // Prefer the city the visitor already chose for Panchang - no new permission prompt.
    const saved = getSavedCity()
    if (saved) {
      apply(saved.lat, saved.lng)
      return () => { cancelled = true }
    }

    // Otherwise use an already-granted geolocation permission. We deliberately do
    // not trigger a fresh permission dialog just to guess a language.
    if (typeof navigator === 'undefined' || !navigator.geolocation || !navigator.permissions) {
      return () => { cancelled = true }
    }

    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then(status => {
        if (cancelled || status.state !== 'granted') return
        navigator.geolocation.getCurrentPosition(
          pos => apply(pos.coords.latitude, pos.coords.longitude),
          () => {},
          { timeout: 5000, maximumAge: 600000 },
        )
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [hydrating, prompted, lang])

  if (!visible || !suggestion) return null

  const suggested = langMeta(suggestion.lang)

  function dismiss() {
    markPrompted()
    setVisible(false)
  }

  function pick(code: Lang) {
    setLang(code)
    dismiss()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lang-prompt-title"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ background: 'rgba(28,30,74,0.45)', backdropFilter: 'blur(3px)' }}
    >
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="px-6 sm:px-8 pt-7 pb-5">
          <div className="w-12 h-12 rounded-2xl bg-[var(--warm-sand)] flex items-center justify-center mb-4">
            <Icon name="language" size={26} className="text-[var(--terracotta)]" />
          </div>

          <h2
            id="lang-prompt-title"
            className="text-2xl font-black text-[var(--indigo-deep)] leading-snug mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t('lang.promptTitle')}
          </h2>

          <p className="text-base text-[var(--text-secondary)] leading-relaxed">
            {t('lang.promptBody', { language: `${suggested.native} (${suggested.english})` })}
          </p>
        </div>

        {!showAll ? (
          <div className="px-6 sm:px-8 pb-7 space-y-3">
            <button
              type="button"
              onClick={() => pick(suggestion.lang)}
              className="w-full px-6 py-4 rounded-2xl font-bold text-base text-white transition-transform active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, var(--saffron-vivid), var(--terracotta))',
                boxShadow: '0 8px 26px rgba(198,125,83,0.35)',
              }}
            >
              {t('lang.promptSwitch', { language: suggested.native })}
            </button>

            <button
              type="button"
              onClick={dismiss}
              className="w-full px-6 py-4 rounded-2xl font-bold text-base text-[var(--indigo-deep)] bg-[var(--warm-sand)] hover:bg-[var(--warm-sand)]/80 transition-colors"
            >
              {t('lang.promptKeepEnglish')}
            </button>

            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full px-6 py-3 rounded-2xl font-semibold text-base text-[var(--terracotta)] hover:bg-[var(--warm-sand)]/50 transition-colors"
            >
              {t('lang.promptChooseOther')}
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-2">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  type="button"
                  disabled={!l.ready}
                  onClick={() => l.ready && pick(l.code)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-3 transition-colors ${
                    l.ready ? 'hover:bg-[var(--warm-sand)]/70' : 'opacity-45 cursor-not-allowed'
                  }`}
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-base font-semibold text-[var(--indigo-deep)]">{l.native}</span>
                    <span className="block text-sm text-[var(--text-secondary)]">
                      {l.ready ? l.english : `${l.english} · ${t('lang.comingSoon')}`}
                    </span>
                  </span>
                  {l.code === lang && (
                    <Icon name="check_circle" size={20} className="text-[var(--terracotta)]" />
                  )}
                </button>
              ))}
            </div>
            <div className="px-6 sm:px-8 py-5 border-t border-[var(--surface-container)]">
              <button
                type="button"
                onClick={dismiss}
                className="w-full px-6 py-3.5 rounded-2xl font-semibold text-base text-[var(--indigo-deep)] bg-[var(--warm-sand)] hover:bg-[var(--warm-sand)]/80 transition-colors"
              >
                {t('common.close')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
