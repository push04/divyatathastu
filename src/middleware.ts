import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PATHS = [
  '/dashboard',
  '/family',
  '/reports',
  '/ai-guide',
  '/orders',
  '/consultations',
  '/mailbox',
  '/my-library',
  '/social',
  '/settings',
  '/handwritten-report',
  '/shop/checkout',
  // Reviews are members-only by design, and referral links/credits are
  // per-account, so both belong behind the login wall.
  '/reviews',
  '/refer',
  '/meditation',
]

/** Routes that must work without a session. Everything else under /api/ now
 *  requires authentication at the middleware level. */
const PUBLIC_API_PREFIXES = [
  '/api/newsletter',      // public subscribe form
  '/api/chat',            // public site chatbot (reads the session if present)
  '/api/crystal-recommendation', // public crystal calculator
  '/api/panchang',        // public almanac widget
  '/api/mandir',          // public temple finder
  '/api/reviews',         // public approved-review listing (POST re-checks auth)
  '/api/report-pricing',  // public price list
  '/api/product-price',   // public price lookup
  '/api/cron',            // guarded by CRON_SECRET, not by a session
]

/**
 * Only allow same-origin, path-only redirects.
 *
 * The previous `startsWith('/') && !startsWith('//')` test let several forms
 * through: a backslash that some clients normalise to a slash, and percent
 * encoded separators that only become meaningful after decoding. Resolving the
 * candidate against a throwaway origin and confirming the host is unchanged
 * settles all of them at once.
 */
function safeRedirect(candidate: string | null): string {
  const FALLBACK = '/dashboard'
  if (!candidate) return FALLBACK
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return FALLBACK
  if (candidate.includes('\\')) return FALLBACK

  let decoded = candidate
  try {
    decoded = decodeURIComponent(candidate)
  } catch {
    return FALLBACK
  }
  if (decoded.startsWith('//') || decoded.includes('\\') || /^\/+[a-z][a-z0-9+.-]*:/i.test(decoded)) {
    return FALLBACK
  }

  try {
    const probe = new URL(candidate, 'http://redirect-probe.invalid')
    if (probe.host !== 'redirect-probe.invalid') return FALLBACK
    return probe.pathname + probe.search + probe.hash
  } catch {
    return FALLBACK
  }
}


/** The subset of routing decisions that need no session lookup, because the
 *  request provably has no session. Returns a response to send, or null to let
 *  the request continue. Kept in step with the authenticated branch below. */
function handleUnauthenticated(request: NextRequest, path: string): NextResponse | null {
  if (path.startsWith('/api/admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (path.startsWith('/api/') && !PUBLIC_API_PREFIXES.some(p => path === p || path.startsWith(p + '/'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isProtected = PROTECTED_PATHS.some(p => path === p || path.startsWith(p + '/'))
  if (isProtected || path.startsWith('/admin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  return null
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request })
  }

  const path = request.nextUrl.pathname

  // Fast path for signed-out visitors.
  //
  // `supabase.auth.getUser()` is a network round-trip to the Supabase Auth
  // server, and it ran unconditionally on every request the matcher accepted -
  // which is every page. On a warm lambda that is ~200ms; on a cold one it was
  // the bulk of an 11-second TTFB, measured against production.
  //
  // When the request carries no Supabase auth cookie there is no session to
  // validate: getUser() can only return null, so the round-trip buys nothing.
  // Skipping it changes no security decision - a request with no cookie is
  // still treated as unauthenticated, so protected paths still redirect and
  // guarded APIs still 401. Anything that DOES present a cookie is validated
  // exactly as before; a forged cookie fails in getUser(), not here.
  const hasAuthCookie = request.cookies.getAll()
    .some(c => c.name.startsWith('sb-') && c.name.includes('auth-token'))

  if (!hasAuthCookie) {
    const unauthed = handleUnauthenticated(request, path)
    if (unauthed) return unauthed
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  // HIGH-4: Protect all /api/admin/* routes at the middleware level (defense-in-depth)
  if (path.startsWith('/api/admin')) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // Every other /api/* route enforced its own auth inline, so a single missing
  // check in any handler was an unauthenticated endpoint with nothing behind
  // it. Authentication is now required by default and the genuinely public
  // routes are named explicitly - the safe direction for the list to fail in.
  if (path.startsWith('/api/') && !PUBLIC_API_PREFIXES.some(p => path === p || path.startsWith(p + '/'))) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const isProtected = PROTECTED_PATHS.some(p => path === p || path.startsWith(p + '/'))

  if (isProtected && !user) {
    // Send existing users to /login, not /register. Pointing this at /register
    // was half of a redirect ping-pong: a sign-in whose cookies had not yet
    // landed bounced /dashboard → /register, and /register (which by then DID
    // see the cookies) bounced straight back to /dashboard. During a soft
    // client-side navigation that loop simply stalls, which is why the
    // dashboard appeared to hang until a manual refresh.
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  if (path.startsWith('/admin') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  if (path.startsWith('/admin') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  if ((path === '/login' || path === '/register') && user) {
    // Honour ?redirect= so a bounced deep link resumes where it left off.
    // It must be a relative in-app path - an absolute URL here would be an
    // open redirect straight off the site.
    const wanted = request.nextUrl.searchParams.get('redirect')
    return NextResponse.redirect(new URL(safeRedirect(wanted), request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
