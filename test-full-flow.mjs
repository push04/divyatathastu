// Authenticates as the project owner and runs a full report generation via HTTP
// Run: npx tsx test-full-flow.mjs <email> <password>
// e.g. npx tsx test-full-flow.mjs levitatelabs.online@gmail.com yourpassword

import { createClient } from '@supabase/supabase-js'

const [,, email, password] = process.argv
if (!email || !password) {
  console.error('Usage: npx tsx test-full-flow.mjs <email> <password>')
  process.exit(1)
}

const SUPABASE_URL = 'https://yknbedtbtsgnwiffpfnz.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ0.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbmJlZHRidHNnbndpZmZwZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMjAyMjcsImV4cCI6MjA5NDg5NjIyN30.Gi9NCOuDndZ1-p2fclhTCV7APO4Zj7flTLVM1l4DSjs'

const db = createClient(SUPABASE_URL, ANON_KEY)
const { data: authData, error: authErr } = await db.auth.signInWithPassword({ email, password })
if (authErr) { console.error('Auth failed:', authErr.message); process.exit(1) }

const token = authData.session.access_token
console.log('✓  Authenticated as', authData.user.email)

// Get first family member
const { data: family } = await db.from('families').select('id').eq('owner_id', authData.user.id).single()
if (!family) { console.error('No family found for user'); process.exit(1) }
const { data: members } = await db.from('family_members').select('id,full_name').eq('family_id', family.id).limit(1)
if (!members?.length) { console.error('No family members found'); process.exit(1) }

const memberId = members[0].id
console.log('✓  Using member:', members[0].full_name, '(', memberId, ')')

// Make a real HTTP call to the local dev server
const SERVER = 'http://localhost:3001'
console.log(`\nPOST ${SERVER}/api/noxatra...`)

const res = await fetch(`${SERVER}/api/noxatra`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': `sb-yknbedtbtsgnwiffpfnz-auth-token=${JSON.stringify(authData.session)}`,
  },
  body: JSON.stringify({
    family_member_id: memberId,
    report_types: ['numerology'],
  }),
})

console.log('HTTP status:', res.status)
const body = await res.text()
console.log('Response body:', body.slice(0, 500))

if (!res.ok) {
  console.error('\n✗  Request failed — see body above')
  process.exit(1)
}

const data = JSON.parse(body)
const result = data.results?.[0]
console.log('\nResult:', JSON.stringify(result))

if (result?.status === 'generated') {
  console.log('\n✓  Report generated successfully!')
} else {
  console.error('\n✗  Report status:', result?.status)
}
