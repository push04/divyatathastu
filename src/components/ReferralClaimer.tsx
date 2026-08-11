'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

/**
 * Claims a pending referral code once the seeker is actually signed in.
 *
 * The register page stashes `?ref=CODE` in sessionStorage and tries to claim it
 * straight after sign-up, but two flows bypass that:
 *
 *  - **Google / OAuth sign-up** leaves the site and returns via /auth/callback
 *    straight to the dashboard, so the register page's claim never runs.
 *  - **Email confirmation** means there is no session yet at sign-up time, so
 *    the claim returns 401.
 *
 * Mounted in the dashboard layout, this retries the claim on the first
 * authenticated page the seeker reaches. The code is only cleared once the
 * server has definitively accepted or rejected it, so a transient network
 * failure does not lose the referral.
 */
const REF_STORAGE_KEY = 'mt_referral_code'

export default function ReferralClaimer() {
  useEffect(() => {
    let code: string | null = null
    try {
      code = sessionStorage.getItem(REF_STORAGE_KEY)
    } catch {
      return // private mode / storage disabled - nothing to do
    }
    if (!code) return

    let cancelled = false

    ;(async () => {
      try {
        const res = await fetch('/api/referrals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'claim', code }),
        })

        if (cancelled) return

        // 401 means "not signed in yet" - keep the code for the next attempt.
        if (res.status === 401) return

        const json = await res.json().catch(() => null)

        if (res.ok) {
          toast.success(`Referral applied - welcome via ${json?.referrer_name || 'your friend'}!`)
        }

        // Any settled answer (accepted, already referred, unknown code, self
        // referral) is final - stop retrying it on every dashboard visit.
        try { sessionStorage.removeItem(REF_STORAGE_KEY) } catch {}
      } catch {
        // Network error - leave the code in place and try again next time.
      }
    })()

    return () => { cancelled = true }
  }, [])

  return null
}
