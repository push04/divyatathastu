import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // astronomy-engine has native bindings — keep it external.
  // @react-pdf/renderer was previously external, but that causes its bundled
  // react-reconciler to use a scheduler context isolated from Next.js's server
  // execution context — flushSyncWork() becomes a no-op, container.document
  // stays null, and renderToBuffer fails with "Cannot read properties of null".
  // Bundling it with Turbopack (removing it from here) fixes this.
  serverExternalPackages: ['astronomy-engine'],

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
