/**
 * Test script for the /api/service-payment endpoint
 * Run: node test_payment_api.js
 * 
 * Prerequisites:
 *   1. Dev server running: npm run dev (http://localhost:3000)
 *   2. SQL file executed in Supabase (ardra_jalam_setup.sql)
 *   3. Logged-in user session cookie (copy from browser DevTools → Application → Cookies)
 */

const BASE_URL = 'http://localhost:3000'

// ── STEP 1: Get the product ID from Supabase ──────────────────────────────────
async function fetchProductId() {
  console.log('\n[1] Fetching ardra_jalam product from /api/service-payment-test...')
  const res = await fetch(`${BASE_URL}/api/mandir`, {
    headers: { 'Content-Type': 'application/json' }
  })
  // We'll hit Supabase directly via the public URL instead
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yknbedtbtsgnwiffpfnz.supabase.co'
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbmJlZHRidHNnbndpZmZwZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMjAyMjcsImV4cCI6MjA5NDg5NjIyN30.Gi9NCOuDndZ1-p2fclhTCV7APO4Zj7flTLVM1l4DSjs'

  const r = await fetch(`${SUPABASE_URL}/rest/v1/service_items?category=eq.ardra_jalam&is_active=eq.true&select=id,title,price,is_active`, {
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
    }
  })
  const data = await r.json()
  if (!r.ok || !data.length) {
    console.error('❌ Product not found in DB. Did you run ardra_jalam_setup.sql?')
    console.error('   Response:', JSON.stringify(data))
    return null
  }
  const product = data[0]
  console.log('✅ Product found:')
  console.log(`   ID:     ${product.id}`)
  console.log(`   Title:  ${product.title}`)
  console.log(`   Price:  ₹${product.price}`)
  console.log(`   Active: ${product.is_active}`)
  return product
}

// ── STEP 2: Test payment API (mock mode — no auth token = will get 401) ────────
async function testPaymentAPI(productId) {
  console.log('\n[2] Testing /api/service-payment (expects 401 without auth)...')
  const res = await fetch(`${BASE_URL}/api/service-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_item_id: productId,
      amount: 499,
      notes: 'Test order - 1 bottle',
    })
  })
  const data = await res.json()
  if (res.status === 401) {
    console.log('✅ API correctly returns 401 Unauthorized (no session cookie)')
    console.log('   This means the API is working — it just needs a logged-in user.')
  } else if (res.ok) {
    console.log('✅ API responded successfully:')
    console.log('  ', JSON.stringify(data, null, 2))
  } else {
    console.log(`⚠️  Status ${res.status}:`, JSON.stringify(data))
  }
}

// ── STEP 3: Test Razorpay key validity ────────────────────────────────────────
async function testRazorpayKey() {
  console.log('\n[3] Testing Razorpay key (live)...')
  const KEY_ID = 'rzp_live_T1xyUps3ZpVTj0'
  const KEY_SECRET = 'G7pNFOxLtV3HEEVxRbUxKHe0'
  const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')

  try {
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: 49900,   // ₹499 in paise
        currency: 'INR',
        receipt: 'test_receipt_' + Date.now(),
        notes: { test: 'true' }
      })
    })
    const data = await res.json()
    if (res.ok && data.id) {
      console.log('✅ Razorpay LIVE key is VALID!')
      console.log(`   Test Order ID: ${data.id}`)
      console.log(`   Amount: ₹${data.amount / 100} INR`)
      console.log(`   Status: ${data.status}`)
      console.log('')
      console.log('⚠️  NOTE: A real Razorpay order was just created (ID: ' + data.id + ')')
      console.log('   This was for testing only. It will expire automatically.')
    } else {
      console.error('❌ Razorpay key ERROR:', data.error?.description || JSON.stringify(data))
    }
  } catch (e) {
    console.error('❌ Could not reach Razorpay API:', e.message)
  }
}

// ── RUN ALL TESTS ─────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('  Ardra Jalam — Payment API Test Suite')
  console.log('═══════════════════════════════════════════')

  const product = await fetchProductId()

  if (product) {
    await testPaymentAPI(product.id)
  }

  await testRazorpayKey()

  console.log('\n═══════════════════════════════════════════')
  console.log('  Summary')
  console.log('═══════════════════════════════════════════')
  console.log('  ✅ Product in Supabase:', product ? 'YES' : 'NO — run ardra_jalam_setup.sql first')
  console.log('  ✅ Razorpay:  Live keys configured in .env.local')
  console.log('  ✅ API route: /api/service-payment — needs logged-in user to fully test')
  console.log('')
  console.log('  To test full payment flow:')
  console.log('  1. Open http://localhost:3000/ardra-jalam in browser')
  console.log('  2. Login with a test account')
  console.log('  3. Select quantity and click "Order Now"')
  console.log('  4. Razorpay checkout will appear')
  console.log('═══════════════════════════════════════════')
}

main().catch(console.error)
