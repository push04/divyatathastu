'use client'

import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_LANG,
  LANG_STORAGE_KEY,
  LANG_PROMPT_KEY,
  isLang,
  langMeta,
  type Lang,
} from '@/lib/i18n/config'
import { translate, type DictKey } from '@/lib/i18n/dictionaries'

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: DictKey, vars?: Record<string, string>) => string
  /** True until the stored preference has been read on the client. */
  hydrating: boolean
  /** Whether the location-based suggestion has already been answered. */
  prompted: boolean
  markPrompted: () => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

/** Safari private mode throws on storage access - never let that break the app. */
function readStored(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStored(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* private mode - preference simply will not persist */
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Always start at the server-rendered default so the first client paint
  // matches the server HTML, then adopt the stored preference in an effect.
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG)
  const [hydrating, setHydrating] = useState(true)
  const [prompted, setPrompted] = useState(true)

  useEffect(() => {
    const stored = readStored(LANG_STORAGE_KEY)
    if (isLang(stored)) setLangState(stored)
    setPrompted(readStored(LANG_PROMPT_KEY) === '1')
    setHydrating(false)
  }, [])

  // Keep <html lang> honest for screen readers, hyphenation and SEO.
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
    }
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    writeStored(LANG_STORAGE_KEY, next)
  }, [])

  const markPrompted = useCallback(() => {
    setPrompted(true)
    writeStored(LANG_PROMPT_KEY, '1')
  }, [])

  const t = useCallback(
    (key: DictKey, vars?: Record<string, string>) => translate(lang, key, vars),
    [lang],
  )

  const value = useMemo(
    () => ({ lang, setLang, t, hydrating, prompted, markPrompted }),
    [lang, setLang, t, hydrating, prompted, markPrompted],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    // Rendering outside the provider should degrade to English, not crash a page.
    return {
      lang: DEFAULT_LANG,
      setLang: () => {},
      t: (key, vars) => translate(DEFAULT_LANG, key, vars),
      hydrating: false,
      prompted: true,
      markPrompted: () => {},
    }
  }
  return ctx
}

/** Convenience for components that only need the translate function. */
export function useT() {
  return useLanguage().t
}

export { langMeta }
