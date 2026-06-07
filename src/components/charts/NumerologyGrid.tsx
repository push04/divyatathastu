'use client'

// Lo Shu / Pythagorean numerology grid showing number presence from birth date + name

const LO_SHU_POSITIONS = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
]

const NUMBER_MEANINGS: Record<number, string> = {
  1: 'Leadership', 2: 'Harmony', 3: 'Creativity',
  4: 'Stability', 5: 'Freedom', 6: 'Nurturing',
  7: 'Wisdom', 8: 'Abundance', 9: 'Completion',
}

interface NumerologyData {
  lifePathNumber: number
  destinyNumber: number
  soulUrgeNumber: number
  personalityNumber: number
  birthdayNumber?: number
  dateOfBirth: string
  fullName: string
}

function countDigitsInDOB(dob: string): Record<number, number> {
  const counts: Record<number, number> = {}
  const digits = dob.replace(/-/g, '').split('').map(Number).filter(d => d >= 1 && d <= 9)
  digits.forEach(d => { counts[d] = (counts[d] || 0) + 1 })
  return counts
}

function nameToNumbers(name: string): Record<number, number> {
  const PYTHAGOREAN: Record<string, number> = {
    a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9,
    j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9,
    s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8,
  }
  const counts: Record<number, number> = {}
  name.toLowerCase().replace(/[^a-z]/g, '').split('').forEach(ch => {
    const n = PYTHAGOREAN[ch]
    if (n) counts[n] = (counts[n] || 0) + 1
  })
  return counts
}

export default function NumerologyGrid({ numerology, member }: {
  numerology: NumerologyData
  member?: { name?: string; dob?: string }
}) {
  const dob = member?.dob || numerology.dateOfBirth || ''
  const name = member?.name || numerology.fullName || ''

  const dobCounts = countDigitsInDOB(dob)
  const nameCounts = nameToNumbers(name)

  // Combine counts
  const combined: Record<number, number> = {}
  for (let i = 1; i <= 9; i++) {
    combined[i] = (dobCounts[i] || 0) + (nameCounts[i] || 0)
  }

  const keyNumbers = [
    numerology.lifePathNumber,
    numerology.destinyNumber,
    numerology.soulUrgeNumber,
    numerology.personalityNumber,
  ].filter(Boolean)

  return (
    <div className="space-y-4">
      {/* Lo Shu Grid */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs text-[var(--warm-charcoal)]/50 font-medium tracking-wider uppercase">Lo Shu Numerology Grid</p>
        <div className="grid grid-cols-3 gap-2">
          {LO_SHU_POSITIONS.map((row, ri) =>
            row.map((num, ci) => {
              const count = combined[num] || 0
              const isKeyNum = keyNumbers.includes(num)
              const isEmpty = count === 0

              return (
                <div
                  key={`${ri}-${ci}`}
                  className={`w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                    isKeyNum
                      ? 'border-[var(--saffron)] bg-gradient-to-br from-amber-50 to-orange-50 shadow-md'
                      : isEmpty
                      ? 'border-dashed border-[var(--warm-sand)] bg-white/50 opacity-40'
                      : 'border-[var(--warm-sand)] bg-white'
                  }`}
                >
                  {/* Number */}
                  <span className={`text-2xl font-bold ${
                    isKeyNum ? 'text-[var(--terracotta)]'
                    : isEmpty ? 'text-[var(--warm-charcoal)]/20'
                    : 'text-[var(--indigo-deep)]'
                  }`} style={{ fontFamily: "'Playfair Display', serif" }}>
                    {num}
                  </span>
                  {/* Dots representing count */}
                  {count > 0 && (
                    <div className="flex gap-0.5 flex-wrap justify-center max-w-[40px]">
                      {Array.from({ length: Math.min(count, 6) }, (_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${
                          isKeyNum ? 'bg-[var(--terracotta)]' : 'bg-[var(--indigo-deep)]/40'
                        }`} />
                      ))}
                    </div>
                  )}
                  {/* Meaning */}
                  <span className="text-[8px] text-[var(--warm-charcoal)]/40 text-center px-1 leading-tight">
                    {NUMBER_MEANINGS[num]}
                  </span>
                </div>
              )
            })
          )}
        </div>
        <p className="text-[10px] text-[var(--warm-charcoal)]/40 text-center max-w-xs">
          Dots = frequency · Highlighted = your core numbers
        </p>
      </div>

      {/* Core Numbers Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Life Path', value: numerology.lifePathNumber, desc: 'Life purpose' },
          { label: 'Destiny', value: numerology.destinyNumber, desc: 'Soul mission' },
          { label: 'Soul Urge', value: numerology.soulUrgeNumber, desc: 'Heart desire' },
          { label: 'Personality', value: numerology.personalityNumber, desc: 'Outer self' },
        ].filter(n => n.value).map(n => (
          <div key={n.label} className="bg-gradient-to-br from-[var(--warm-sand)] to-amber-50 rounded-xl p-3 text-center border border-[var(--saffron)]/20">
            <p className="text-[10px] text-[var(--warm-charcoal)]/50 uppercase tracking-wider mb-1">{n.label}</p>
            <p className="text-3xl font-bold text-[var(--terracotta)]" style={{ fontFamily: "'Playfair Display', serif" }}>{n.value}</p>
            <p className="text-[10px] text-[var(--warm-charcoal)]/50 mt-1">{n.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
