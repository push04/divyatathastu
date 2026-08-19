'use client'

import dynamic from 'next/dynamic'

/**
 * Lazily-loaded page chrome.
 *
 * The chat launcher, the ambient-audio toggle and the first-visit language
 * prompt were statically imported by the root layout, so every page shipped and
 * parsed them before it could become interactive - the audio module pulls in
 * the whole soundscape synthesis table for a control most visitors never touch.
 *
 * `ssr: false` is only legal inside a Client Component, which is the entire
 * reason this wrapper exists rather than the layout calling `dynamic` itself.
 * None of these render server-visible content, so skipping SSR costs nothing.
 */
const LanguagePrompt = dynamic(() => import('@/components/i18n/LanguagePrompt'), { ssr: false })
const ChatWidget = dynamic(() => import('@/components/chat/ChatWidget'), { ssr: false })
const AmbientOm = dynamic(() => import('@/components/AmbientOm'), { ssr: false })

export default function DeferredChrome() {
  return (
    <>
      <LanguagePrompt />
      <AmbientOm />
      <ChatWidget />
    </>
  )
}
