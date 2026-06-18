'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const steps = [
  {
    num: '01',
    icon: 'family_restroom',
    title: 'Add Your Family',
    desc: 'Create your family account and add members with their birth details - name, date, time & place of birth.',
    color: 'var(--terracotta)',
  },
  {
    num: '02',
    icon: 'auto_awesome',
    title: 'Nakshatra Generates Reports',
    desc: 'Our Nakshatra engine analyzes the cosmic blueprint using Vedic sciences and AI - all 14 reports auto-generated.',
    color: 'var(--saffron)',
  },
  {
    num: '03',
    icon: 'description',
    title: 'Receive Your Reports',
    desc: 'Get beautifully formatted PDF reports with personalized insights, remedies, and life guidance.',
    color: 'var(--indigo-deep)',
  },
  {
    num: '04',
    icon: 'support_agent',
    title: 'Consult an Expert',
    desc: 'Book a 1-on-1 session with our certified Vedic astrologers to discuss and implement your report insights.',
    color: 'var(--plum-light)',
  },
]

export default function HowItWorks() {
  return (
    <section className="section-padding bg-[var(--indigo-deep)] section-dark-pattern relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="ambient-orb animate-drift-1 pointer-events-none"
        style={{ width: 400, height: 400, top: '-100px', right: '-50px', background: 'radial-gradient(circle, rgba(198,125,83,0.08) 0%, transparent 70%)' }} />
      <div className="ambient-orb animate-drift-2 pointer-events-none"
        style={{ width: 300, height: 300, bottom: '-80px', left: '-60px', background: 'radial-gradient(circle, rgba(185,152,107,0.07) 0%, transparent 70%)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="badge-divine badge-divine-dark mb-4 inline-flex"
          >
            <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
            Simple Process
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            How Tathastu Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/60 max-w-xl mx-auto"
          >
            From birth data to comprehensive life guidance in minutes. Our Nakshatra AI engine handles the complex calculations.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, type: 'spring', stiffness: 80 }}
              className="relative"
            >
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full h-px bg-white/10 z-0" />
              )}
              <div className="card-dark p-6 relative z-10 group">
                <div
                  className="text-[10px] font-semibold text-[var(--saffron)] mb-4 tracking-widest"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {step.num}
                </div>
                <div className="icon-divine w-12 h-12 rounded-2xl mb-5 group-hover:scale-110 group-hover:rotate-[-5deg] transition-transform duration-300 animate-glow" style={{ background: 'linear-gradient(135deg, var(--terracotta), var(--saffron-vivid))', animationDelay: `${i * 0.5}s` }}>
                  <span
                    className="material-symbols-outlined text-[24px] text-white"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {step.icon}
                  </span>
                </div>
                <h3 className="text-white font-bold text-lg mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{step.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link href="/register" className="btn-divine text-base px-8 py-3.5 inline-flex items-center gap-2">
            Start Your Journey
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
