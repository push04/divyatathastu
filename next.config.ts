import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // astronomy-engine has native bindings — keep it external.
  //
  // @react-pdf/renderer MUST also be external. When Turbopack bundles it, the
  // route handler runs in a React Server context where only
  // __SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE is
  // exported. The @react-pdf/reconciler-33 accesses
  // __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.S which
  // is undefined in that context → "Cannot read properties of undefined
  // (reading 'S')". When externalized, react-pdf loads its own isolated CJS
  // React which has the full client internals available.
  //
  // The separate flushSyncWork/null-container issue on Vercel is fixed by
  // using a callback-based updateContainer in the API route (see pdf-utils.ts).
  serverExternalPackages: ['astronomy-engine', '@react-pdf/renderer', '@react-pdf/reconciler'],



  // Belt-and-suspenders: explicitly alias astronomy-engine to its CJS file
  turbopack: {
    resolveAlias: {
      'astronomy-engine': './node_modules/astronomy-engine/astronomy.js',
    },
  },

  // Type errors fail the build. This was `ignoreBuildErrors: true`, which meant
  // a wrong Supabase table name, a bad API contract or a missing null-check
  // shipped silently - and the codebase leans on `(admin as any).from(...)`
  // casts that only type-checking can keep honest.
  typescript: {
    ignoreBuildErrors: false,
  },

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },

  // Compress responses
  compress: true,

  // Security headers. None were set, so the app shipped with no clickjacking
  // defence, no HSTS and no MIME-sniffing protection.
  async headers() {
    // CSP is report-only for now: the app uses inline styles and inline JSON-LD
    // (`dangerouslySetInnerHTML` on the homepage), and Razorpay/LiveKit inject
    // their own scripts. Enforcing straight away would break checkout. Watch the
    // reports, tighten, then switch the key to `Content-Security-Policy`.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.razorpay.com https://*.livekit.cloud wss://*.livekit.cloud https://api.groq.com",
      "frame-src https://*.razorpay.com https://www.youtube.com https://youtube.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // camera/microphone: LiveKit video consultations.
          // geolocation: the mandir finder, the language prompt and
          // lib/utils/getLocation all call navigator.geolocation - blocking it
          // outright (as a generic hardening checklist would) silently breaks
          // "find temples near me".
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self), interest-cohort=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Content-Security-Policy-Report-Only', value: csp },
        ],
      },
      {
        // Never let an API response be cached by a shared proxy, and never let
        // one be framed.
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ]
  },
};

export default nextConfig;
