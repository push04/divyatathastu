'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { YantraMark } from '@/components/ui/Yantra'
import { getUserLocation } from '@/lib/utils/getLocation'
import { useLanguage } from '@/components/i18n/LanguageProvider'

/* ═══════════════════════════════════════════════════════════════════════════
   HERO

   Motion policy here is deliberately the opposite of the rest of the page:
   the headline, subhead and CTAs are NOT animated. They were previously
   staggered in with framer-motion from opacity 0, which makes the LCP element
   paint late and empty. They now render at final state on first paint.

   Only the decoration moves - the yantra's ambient counter-rotation and a
   one-time line-draw on its outer ring - and all of it is transform/opacity,
   suppressed entirely under prefers-reduced-motion.
   ═══════════════════════════════════════════════════════════════════════════ */

const SHLOKAS = [
  { shloka: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥', meaning: 'केवल कर्म करना तुम्हारा अधिकार है, फल में कभी नहीं। फल की कामना से कर्म न करो, और अकर्म में भी आसक्त न हो।', source: 'भगवद्गीता २.४७' },
  { shloka: 'असतो मा सद्गमय।\nतमसो मा ज्योतिर्गमय।\nमृत्योर्माऽमृतं गमय॥', meaning: 'असत्य से सत्य की ओर, अन्धकार से प्रकाश की ओर, और मृत्यु से अमरत्व की ओर मुझे ले चलो।', source: 'बृहदारण्यक उपनिषद् १.३.२८' },
  { shloka: 'वसुधैव कुटुम्बकम्।', meaning: 'यह सम्पूर्ण पृथ्वी ही एक परिवार है।', source: 'महोपनिषद् ६.७२' },
  { shloka: 'सत्यमेव जयते।', meaning: 'सत्य की ही विजय होती है, असत्य की नहीं।', source: 'मुण्डकोपनिषद् ३.१.६' },
  { shloka: 'ॐ पूर्णमदः पूर्णमिदं पूर्णात्पूर्णमुदच्यते।\nपूर्णस्य पूर्णमादाय पूर्णमेवावशिष्यते॥', meaning: 'वह परब्रह्म पूर्ण है, यह जगत् भी पूर्ण है। पूर्ण से पूर्ण निकाल लेने पर भी पूर्ण ही शेष रहता है।', source: 'ईशावास्योपनिषद् शान्तिपाठ' },
  { shloka: 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत।\nअभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम्॥', meaning: 'जब-जब धर्म की हानि होती है और अधर्म बढ़ता है, तब-तब मैं स्वयं को प्रकट करता हूँ।', source: 'भगवद्गीता ४.७' },
  { shloka: 'सर्वे भवन्तु सुखिनः। सर्वे सन्तु निरामयाः।\nसर्वे भद्राणि पश्यन्तु। मा कश्चिद् दुःखभाग्भवेत्॥', meaning: 'सभी सुखी हों, सभी रोगमुक्त हों, सभी शुभ देखें, कोई भी दुःखी न हो।', source: 'बृहदारण्यक उपनिषद्' },
  { shloka: 'योगः कर्मसु कौशलम्।', meaning: 'कर्मों में कुशलता ही योग है।', source: 'भगवद्गीता २.५०' },
  { shloka: 'ॐ तत् सत्।', meaning: 'ॐ - वही परम सत्य है।', source: 'भगवद्गीता १७.२३' },
  { shloka: 'तत् त्वम् असि।', meaning: 'वह परम ब्रह्म तुम ही हो।', source: 'छांदोग्य उपनिषद् ६.८.७' },
  { shloka: 'मनः एव मनुष्याणां कारणं बन्धमोक्षयोः।', meaning: 'मन ही मनुष्य के बंधन और मोक्ष का एकमात्र कारण है।', source: 'अमृतबिन्दु उपनिषद् २' },
  { shloka: 'स्वधर्मे निधनं श्रेयः परधर्मो भयावहः।', meaning: 'अपने धर्म में मरना भी श्रेयस्कर है; दूसरे का धर्म भय उत्पन्न करता है।', source: 'भगवद्गीता ३.३५' },
  { shloka: 'अहम् ब्रह्मास्मि।', meaning: 'मैं स्वयं ब्रह्म हूँ - यह परम ज्ञान ही मुक्ति का द्वार है।', source: 'बृहदारण्यक उपनिषद् १.४.१०' },
]

interface PanchangSnap { tithi: string; nakshatra: string; yoga: string }

export default function HeroSection() {
  const { t } = useLanguage()
  const [snap, setSnap] = useState<PanchangSnap | null>(null)
  const [shlokaIdx, setShlokaIdx] = useState(0)
  const [shlokaVisible, setShlokaVisible] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    getUserLocation().then(loc => {
      fetch(`/api/panchang?lat=${loc.lat}&lng=${loc.lng}&date=${today}`)
        .then(r => r.json())
        .then(j => { if (j.success) setSnap({ tithi: j.data.tithi, nakshatra: j.data.nakshatra, yoga: j.data.yoga }) })
        .catch(() => {})
    })
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setShlokaVisible(false)
      setTimeout(() => {
        setShlokaIdx(i => (i + 1) % SHLOKAS.length)
        setShlokaVisible(true)
      }, 400)
    }, 7000)
    return () => clearInterval(id)
  }, [])

  const shloka = SHLOKAS[shlokaIdx]

  return (
    <section className="relative overflow-hidden" style={{ background: 'var(--surface-light)' }}>
      {/* Bindu dot-grid - the quietest layer of the motif system. */}
      <div className="absolute inset-0 motif-bindu pointer-events-none" aria-hidden="true" />

      {/* Ambient orbs (decoration only) */}
      <div className="ambient-orb animate-drift-1" aria-hidden="true"
        style={{ width: 320, height: 320, top: '-80px', right: '10%', background: 'radial-gradient(circle, rgba(180,35,31,0.10) 0%, transparent 70%)' }} />
      <div className="ambient-orb animate-drift-2" aria-hidden="true"
        style={{ width: 240, height: 240, bottom: '5%', left: '5%', background: 'radial-gradient(circle, rgba(201,153,46,0.12) 0%, transparent 70%)' }} />
      <div className="ambient-orb animate-drift-3" aria-hidden="true"
        style={{ width: 180, height: 180, top: '40%', right: '30%', background: 'radial-gradient(circle, rgba(46,12,40,0.07) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-12 lg:gap-6 items-center pt-12 pb-16 lg:pt-16 lg:pb-20">

          {/* ── Left column - intentionally static, this is the LCP block ── */}
          <div className="flex flex-col">
            <h1 className="t-display-1 text-[var(--text-primary)] mb-6">
              {t('hero.headlineA')}
              <br />
              <span
                style={{
                  textDecorationLine: 'underline',
                  textDecorationStyle: 'solid',
                  textDecorationColor: 'var(--primary)',
                  textDecorationThickness: '4px',
                  textUnderlineOffset: '10px',
                }}
              >
                {t('hero.headlineB')}
              </span>
            </h1>

            {/* Was --indigo-deep at 62% opacity (≈4.0:1). Now --text-secondary
                at 9.0:1, and bumped to the body-lg step. */}
            <p className="t-body-lg text-[var(--text-secondary)] max-w-lg mb-10">
              {t('hero.subhead')}
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link href="/register" className="btn-divine">
                {t('hero.ctaPrimary')}
              </Link>
              <Link href="/services" className="btn-outline-divine">
                {t('hero.ctaSecondary')}
              </Link>
            </div>

            {/* Trust signals - was 55% opacity on the mono face (≈4.1:1). */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {[t('hero.trust1'), t('hero.trust2'), t('hero.trust3')].map((tag, i) => (
                <span key={tag} className="flex items-center gap-3">
                  <span className="t-data text-[var(--text-secondary)]">{tag}</span>
                  {i < 2 && <span className="text-[var(--border)]" aria-hidden="true">·</span>}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right column - the yantra. All motion lives here. ── */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-full h-[300px] lg:h-[520px] flex items-center justify-center">
              <YantraMark size={480} drawIn />

              {/* Floating panchang card */}
              {snap && (
                <div className="absolute bottom-4 left-0 lg:-left-4 hidden sm:block z-10 animate-float">
                  <div
                    className="rounded-[var(--radius-lg)] p-5 backdrop-blur-sm animate-glow"
                    style={{
                      minWidth: '208px',
                      background: 'rgba(255,255,255,0.92)',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: 'var(--shadow-lg)',
                    }}
                  >
                    <p className="t-eyebrow mb-3">{t('hero.todaysPanchang')}</p>
                    <dl>
                      {[
                        { label: t('hero.tithi'), value: snap.tithi },
                        { label: t('hero.nakshatra'), value: snap.nakshatra },
                        { label: t('hero.yoga'), value: snap.yoga },
                      ].map(({ label, value }) => (
                        <div key={label} className="mb-2.5 last:mb-0">
                          {/* Was 38% opacity (≈2.6:1) - the worst label on the
                              page. Now the shared .t-datalabel at 5.5:1. */}
                          <dt className="t-datalabel">{label}</dt>
                          <dd className="t-body font-semibold text-[var(--text-primary)]">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Shloka carousel - now set in Martel, which actually has
             Devanagari, instead of falling back to a system font. ── */}
        <div
          className="py-8 px-4 sm:px-6 flex flex-col items-center gap-3"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div
            className="text-center max-w-[720px]"
            style={{ opacity: shlokaVisible ? 1 : 0, transition: 'opacity 0.4s ease' }}
          >
            <p
              className="mb-3"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 'clamp(19px, 2.2vw, 23px)',
                lineHeight: 1.7,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-line',
              }}
            >
              {shloka.shloka}
            </p>
            <p className="t-body-sm text-[var(--text-secondary)] mb-2">{shloka.meaning}</p>
            <p className="t-eyebrow">- {shloka.source}</p>
          </div>

          <div className="flex gap-1.5 mt-1">
            {SHLOKAS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setShlokaVisible(false); setTimeout(() => { setShlokaIdx(i); setShlokaVisible(true) }, 400) }}
                aria-label={`Shloka ${i + 1}`}
                aria-current={i === shlokaIdx}
                style={{
                  width: i === shlokaIdx ? '20px' : '7px',
                  height: '7px',
                  borderRadius: '4px',
                  background: i === shlokaIdx ? 'var(--primary)' : 'var(--border)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'width 0.3s, background 0.3s',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
