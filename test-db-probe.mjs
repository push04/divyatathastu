// Direct Supabase DB probe — bypasses auth to test every step the API route takes
// Run: node test-db-probe.mjs
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yknbedtbtsgnwiffpfnz.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbmJlZHRidHNnbndpZmZwZm56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTMyMDIyNywiZXhwIjoyMDk0ODk2MjI3fQ.TXnP9T2b40LkPPYuVpuwMh1cR9PUs2TIUpgvA8rak3M'

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

async function check(label, fn) {
  try {
    const r = await fn()
    if (r && r.error) {
      console.error(`✗  ${label}: DB error → ${r.error.code} ${r.error.message}`)
      return null
    }
    console.log(`✓  ${label}`)
    return r?.data ?? r
  } catch(e) {
    console.error(`✗  ${label}: THREW → ${e.message}`)
    return null
  }
}

// 1. List all families
const families = await check('List families', () => db.from('families').select('id,owner_id').limit(5))
console.log('   ', JSON.stringify(families?.slice?.(0,3)))

if (!families?.length) { console.error('\nNo families found — user must create a family first'); process.exit(1) }

const familyId = families[0].id
const ownerId  = families[0].owner_id
console.log(`   Using family: ${familyId}, owner: ${ownerId}`)

// 2. List family members
const members = await check('List family members', () =>
  db.from('family_members').select('id,full_name,date_of_birth,time_of_birth,place_of_birth,birth_latitude,birth_longitude,birth_timezone,gender,mobile_number').eq('family_id', familyId).limit(5)
)
console.log('   ', JSON.stringify(members?.slice?.(0,2)))

if (!members?.length) { console.error('\nNo family members found — add a member first'); process.exit(1) }

const memberId = members[0].id
const member   = members[0]
console.log(`   Using member: ${memberId} (${member.full_name})`)

// 3. Test the families!inner join that the API route uses
const joinResult = await check('Family member with families!inner join', () =>
  db.from('family_members').select('*, families!inner(owner_id)').eq('id', memberId).single()
)

// 4. Test report INSERT
const reportInsert = await check('Insert report (processing)', () =>
  db.from('reports').insert({
    family_member_id: memberId,
    family_id: familyId,
    report_type: 'numerology',
    status: 'processing',
    order_id: null,
  }).select().single()
)

if (!reportInsert) {
  // Try without order_id
  const r2 = await check('Insert report (no order_id)', () =>
    db.from('reports').insert({
      family_member_id: memberId,
      family_id: familyId,
      report_type: 'numerology',
      status: 'processing',
    }).select().single()
  )
  if (!r2) { console.error('Report insert always fails — check schema'); process.exit(1) }
}

const reportId = reportInsert?.id || null

// 5. Test update to 'generated'
if (reportId) {
  await check("Update report to 'generated'", () =>
    db.from('reports').update({ status: 'generated', report_content: { test: true } }).eq('id', reportId)
  )
  // 6. Test update to 'failed' (needs migration 011)
  await check("Update report to 'failed' (needs migration 011)", () =>
    db.from('reports').update({ status: 'failed' }).eq('id', reportId)
  )
  // Cleanup
  await db.from('reports').delete().eq('id', reportId)
  console.log('   Cleaned up test report')
}

// 7. Check notifications table
const notifCheck = await check('Insert notification', () =>
  db.from('notifications').insert({
    user_id: ownerId,
    type: 'report_ready',
    title: 'Test',
    body: 'Test body',
    data: { test: true },
  }).select().single()
)
if (notifCheck?.id) {
  await db.from('notifications').delete().eq('id', notifCheck.id)
  console.log('   Cleaned up test notification')
}

// 8. Run actual generateReportData
console.log('\n── Running generateReportData ──')
const { generateReportData } = await import('./src/lib/noxatra/engine.ts')
try {
  const result = await generateReportData(
    { id: member.id, full_name: member.full_name, date_of_birth: member.date_of_birth,
      time_of_birth: member.time_of_birth, place_of_birth: member.place_of_birth,
      birth_latitude: member.birth_latitude, birth_longitude: member.birth_longitude,
      birth_timezone: member.birth_timezone, gender: member.gender, mobile_number: member.mobile_number },
    'numerology'
  )
  console.log('✓  generateReportData: OK →', Object.keys(result).join(', '))
} catch(e) {
  console.error('✗  generateReportData THREW:', e.message)
}

console.log('\n── Summary: if all steps show ✓ then generation should work ──')
