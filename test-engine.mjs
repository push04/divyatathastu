// Quick smoke-test for the noxatra calculation engine.
// Run: node test-engine.mjs
// Does NOT need a running server or Supabase connection.

import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// Use ts-node/esm would require extra setup; instead we transpile inline via tsx.
// This file is just a runner — actual test is below via a subprocess.

import { execSync } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'

const testScript = `
import * as Astronomy from './node_modules/astronomy-engine/astronomy.js'

// ── minimal calculateKundli smoke test ──────────────────────────────────────
function getLahiriAyanamsa(jd) {
  return 23.85 + (jd - 2451545.0) * (50.3 / 3600) / 365.25
}

const birthDate = '1990-06-15'
const birthTime = '10:30'
const lat = 28.6139, lng = 77.2090, tz = 'Asia/Kolkata'

const [y, m, d] = birthDate.split('-').map(Number)
const [hr, mn] = birthTime.split(':').map(Number)
const utHour = hr + mn / 60 - 5.5   // IST offset

const astroDate = new Astronomy.AstroTime(
  new Date(Date.UTC(y, m - 1, d, Math.floor(utHour), Math.round((utHour % 1) * 60)))
)
const observer = new Astronomy.Observer(lat, lng, 0)

let errors = []
let success = 0

for (const body of [Astronomy.Body.Sun, Astronomy.Body.Moon, Astronomy.Body.Mars]) {
  try {
    const eq  = Astronomy.Equator(body, astroDate, observer, true, true)
    const ecl = Astronomy.Ecliptic(eq.vec)
    const ayanamsa = getLahiriAyanamsa(astroDate.tt)
    const lon = ((ecl.elon - ayanamsa) % 360 + 360) % 360
    console.log(body + ': lon=' + lon.toFixed(2) + '°')
    success++
  } catch(e) {
    errors.push(body + ': ' + e.message)
  }
}

if (errors.length) {
  console.error('ERRORS:', errors.join(', '))
  process.exit(1)
}
console.log('astronomy-engine OK: ' + success + ' bodies computed')
`

writeFileSync('_test_astro.mjs', testScript)
try {
  const out = execSync('node _test_astro.mjs 2>&1', { cwd: process.cwd(), encoding: 'utf8' })
  console.log(out)
} catch(e) {
  console.error('Test FAILED:\n', e.stdout || e.message)
} finally {
  unlinkSync('_test_astro.mjs')
}
