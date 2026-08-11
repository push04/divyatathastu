'use client'

import { useEffect, useRef, type RefObject } from 'react'

/* ═══════════════════════════════════════════════════════════════════════════
   GSAP, deliberately rationed.
   ───────────────────────────────────────────────────────────────────────────
   Simple fade/slide reveals are handled by native CSS `animation-timeline:
   view()` (see globals.css) - no JS, no library, runs on the compositor.
   GSAP is loaded ONLY for the two sequences that genuinely need it:

     1. the 14-report grid stagger-on-enter
     2. the "How Tathastu Works" pin-and-scrub

   Both live below the fold, so the import is dynamic: GSAP never lands in the
   initial bundle and never competes with the hero for main-thread time.

   Contract for callers:
     · animate transform + opacity only
     · everything is scoped to a gsap.context() and reverted on unmount
     · prefers-reduced-motion short-circuits before the import even happens,
       so reduced-motion users pay zero bytes for it
   ═══════════════════════════════════════════════════════════════════════════ */

/* Setup may return a cleanup function; gsap.context() calls it on revert.
   Typed honestly so callers get checked rather than relying on TypeScript's
   void-return bivariance to quietly permit it. */
type SetupFn = (
  gsap: typeof import('gsap').gsap,
  scope: HTMLElement,
) => void | (() => void)

export function useGsapScope<T extends HTMLElement>(setup: SetupFn): RefObject<T | null> {
  const ref = useRef<T>(null)

  /* Keep the latest setup callback without re-running the animation effect on
     every render. The write happens in an effect, not during render - the ref
     already holds the first-render value by the time the mount effect below
     runs, and this effect is declared first so it stays ahead on updates. */
  const setupRef = useRef(setup)
  useEffect(() => {
    setupRef.current = setup
  })

  useEffect(() => {
    const scope = ref.current
    if (!scope) return

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    let ctx: { revert: () => void } | undefined
    let cancelled = false

    ;(async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)

      ctx = gsap.context(() => setupRef.current(gsap, scope), scope)
      ScrollTrigger.refresh()
    })()

    return () => {
      cancelled = true
      ctx?.revert()
    }
  }, [])

  return ref
}
