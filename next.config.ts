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

  // Suppress TS build errors (we rely on type checking separately)
  typescript: {
    ignoreBuildErrors: true,
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
};

export default nextConfig;
