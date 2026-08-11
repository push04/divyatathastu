'use client'

import { useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { YantraWatermark } from '@/components/ui/Yantra'
import { useGsapScope } from '@/lib/motion/useGsap'

/* ═══════════════════════════════════════════════════════════════════════════
   HOW TATHASTU WORKS - a sequence, not four boxes.

   Was: four identical white-ish cards in a row, visually indistinguishable
   from the reports grid and the services grid, with a 1px line between them
   that read as an accident.

   Now: a numbered progression on a visible path. A rail runs through all four
   stations; a gold progress line advances along it as you scroll, and the
   active station lights up. The section pins for the duration of the scrub,
   so the sequence *is* the scroll rather than sitting static beside it.

   Reduced motion / no-JS: the rail renders fully drawn, every station shows
   as active, nothing is hidden. The pin never engages.
   ═══════════════════════════════════════════════════════════════════════════ */

const STEPS = [
  {
    num: '01',
    icon: 'family_restroom',
    title: 'Add Your Family',
    desc: 'Create your family account and add each member with their birth details - name, date, exact time and place of birth.',
  },
  {
    num: '02',
    icon: 'navagraha',
    title: 'Nakshatra Generates Reports',
    desc: 'Our Nakshatra engine computes the cosmic blueprint using the classical Vedic sciences - all 14 reports prepared for you.',
  },
  {
    num: '03',
    icon: 'description',
    title: 'Receive Your Reports',
    desc: 'Beautifully typeset PDF reports arrive with personalised insight, prescribed remedies and practical life guidance.',
  },
  {
    num: '04',
    icon: 'support_agent',
    title: 'Consult an Expert',
    desc: 'Book a one-to-one session with a certified Vedic astrologer to interpret and act on what your reports reveal.',
  },
]

export default function HowItWorks() {
  /* Progress is state so the rail, the numerals and the card treatment all
     read from one source. Defaults to "all lit" - that is the no-JS and
     reduced-motion rendering, and GSAP only ever narrows it. */
  const [active, setActive] = useState(STEPS.length - 1)

  const scopeRef = useGsapScope<HTMLDivElement>((gsap, scope) => {
    /* Two rails exist - a horizontal one for the desktop row and a vertical
       one for the stacked mobile layout - so they must be selected separately.
       A single `[data-rail-fill]` lookup returns only the first (desktop) one,
       which would leave the mobile rail dead and put a stray scaleY on the
       desktop rail. */
    const railH = scope.querySelector<HTMLElement>('[data-rail-fill="h"]')
    const railV = scope.querySelector<HTMLElement>('[data-rail-fill="v"]')
    const track = scope.querySelector<HTMLElement>('[data-steps]')
    if (!track) return

    /* onUpdate fires on every scroll frame. Only push to React when the step
       actually changes, otherwise this re-renders the whole section ~60×/s. */
    let lastStep = -1
    const setStep = (progress: number) => {
      const i = Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length))
      if (i !== lastStep) {
        lastStep = i
        setActive(i)
      }
    }

    setActive(0)

    /* Pin the section and scrub the sequence. On touch/narrow viewports the
       stations stack vertically and pinning fights the native scroll, so the
       pin is desktop-only; the rail still advances. */
    const mm = gsap.matchMedia()

    mm.add('(min-width: 1024px)', () => {
      const st = gsap.timeline({
        scrollTrigger: {
          trigger: scope,
          start: 'top top+=64',
          end: '+=1600',
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          onUpdate: self => setStep(self.progress),
        },
      })
      if (railH) st.fromTo(railH, { scaleX: 0 }, { scaleX: 1, ease: 'none' }, 0)
      return () => { st.scrollTrigger?.kill(); st.kill() }
    })

    mm.add('(max-width: 1023px)', () => {
      const st = gsap.timeline({
        scrollTrigger: {
          trigger: track,
          start: 'top 80%',
          end: 'bottom 60%',
          scrub: 0.6,
          onUpdate: self => setStep(self.progress),
        },
      })
      if (railV) st.fromTo(railV, { scaleY: 0 }, { scaleY: 1, ease: 'none' }, 0)
      return () => { st.scrollTrigger?.kill(); st.kill() }
    })

    return () => mm.revert()
  })

  return (
    <section
      ref={scopeRef}
      className="section-padding relative overflow-hidden"
      style={{ background: 'var(--surface-dark)' }}
    >
      <div className="absolute inset-0 motif-bindu-dark pointer-events-none" />
      <YantraWatermark size={460} tone="dark" className="-bottom-32 -left-28" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">

        {/* ── Header ── */}
        <div className="text-center mb-16 reveal">
          <span className="badge-divine badge-divine-dark mb-5 inline-flex">
            <Icon name="yantra" size={14} />
            Simple Process
          </span>
          <h2 className="t-display-2 text-[var(--text-on-dark)] mb-4">How Tathastu Works</h2>
          <p className="t-body text-[var(--text-on-dark-secondary)] max-w-xl mx-auto">
            From birth data to complete life guidance in minutes. The Nakshatra engine handles every calculation.
          </p>
        </div>

        {/* ── The path ── */}
        <div data-steps className="relative">

          {/* Rail - horizontal on desktop, vertical on mobile. Purely
              decorative, so it is hidden from assistive tech. */}
          <div
            className="hidden lg:block absolute left-0 right-0 pointer-events-none"
            style={{ top: '38px' }}
            aria-hidden="true"
          >
            <div className="relative h-px mx-[12.5%]" style={{ background: 'rgba(245,239,227,0.14)' }}>
              <div
                data-rail-fill="h"
                className="absolute inset-0 origin-left"
                style={{ background: 'linear-gradient(90deg, var(--kumkum-500), var(--gold-500))' }}
              />
            </div>
          </div>
          <div
            className="lg:hidden absolute top-0 bottom-0 pointer-events-none"
            style={{ left: '27px' }}
            aria-hidden="true"
          >
            <div className="relative w-px h-full" style={{ background: 'rgba(245,239,227,0.14)' }}>
              <div
                data-rail-fill="v"
                className="absolute inset-0 origin-top"
                style={{ background: 'linear-gradient(180deg, var(--kumkum-500), var(--gold-500))' }}
              />
            </div>
          </div>

          <ol className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-6 relative">
            {STEPS.map((step, i) => {
              const isActive = i <= active
              return (
                <li key={step.num} className="relative flex lg:flex-col gap-5 lg:gap-0 pl-0">
                  {/* Station marker sits ON the rail */}
                  <div className="flex-shrink-0 lg:mb-7 flex lg:justify-center lg:w-full">
                    <span
                      className="relative flex items-center justify-center rounded-full transition-all duration-500"
                      style={{
                        width: 56,
                        height: 56,
                        background: isActive ? 'var(--surface-dark)' : 'var(--surface-dark)',
                        border: `1.5px solid ${isActive ? 'var(--gold-500)' : 'rgba(245,239,227,0.18)'}`,
                        color: isActive ? 'var(--gold-300)' : 'var(--text-on-dark-muted)',
                        boxShadow: isActive ? '0 0 0 8px rgba(201,153,46,0.07)' : 'none',
                      }}
                    >
                      <Icon name={step.icon} size={24} />
                    </span>
                  </div>

                  <div
                    className="card-step flex-1"
                    data-active={isActive ? 'true' : 'false'}
                  >
                    <span
                      className="t-data block mb-3 transition-colors duration-500"
                      style={{ color: isActive ? 'var(--gold-500)' : 'var(--text-on-dark-muted)', fontSize: '15px' }}
                    >
                      {step.num}
                    </span>
                    <h3 className="t-h4 text-[var(--text-on-dark)] mb-2">{step.title}</h3>
                    <p className="t-body-sm text-[var(--text-on-dark-secondary)]">{step.desc}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="text-center mt-14">
          <Link href="/register" className="btn-gold">
            Start Your Journey
            <Icon name="arrow_forward" size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}
