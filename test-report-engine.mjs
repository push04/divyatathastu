// Full engine test — runs generateReportData for every report type with sample data
// Run: node --loader tsx/esm test-report-engine.mjs
// Or:  npx tsx test-report-engine.mjs

import { generateReportData } from './src/lib/noxatra/engine.ts'

const member = {
  id: 'test-001',
  full_name: 'Ravi Kumar',
  date_of_birth: '1990-06-15',
  time_of_birth: '10:30',
  place_of_birth: 'New Delhi',
  birth_latitude: 28.6139,
  birth_longitude: 77.2090,
  birth_timezone: 'Asia/Kolkata',
  gender: 'male',
  mobile_number: '9876543210',
}

const REPORT_TYPES = [
  'astrology','numerology','shakti_chakra','prakriti','yantra_colour',
  'mantra_chanting','astro_vastu','psychology','dmit','colour_therapy',
  'child_development',
]

let passed = 0, failed = 0
for (const type of REPORT_TYPES) {
  try {
    const result = await generateReportData(member, type)
    if (result.error) {
      console.log(`⚠  ${type}: ${result.error}`)
    } else {
      console.log(`✓  ${type}: OK (keys: ${Object.keys(result).join(', ')})`)
      passed++
    }
  } catch(e) {
    console.error(`✗  ${type}: THREW → ${e.message}`)
    failed++
  }
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
