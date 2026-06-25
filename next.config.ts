import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't bundle these — let Node load them natively at runtime.
  serverExternalPackages: ['astronomy-engine', '@react-pdf/renderer'],

  // Force Vercel's output file tracer to include font files that react-pdf reads at runtime
  // (path.join(process.cwd(),...) is not statically traceable by nft)
  outputFileTracingIncludes: {
    '/api/reports/[reportId]/pdf': [
      './node_modules/@fontsource/cormorant-garamond/files/*.woff2',
      './node_modules/@fontsource/lato/files/*.woff2',
    ],
  },

  // Belt-and-suspenders: explicitly alias astronomy-engine to its CJS file
  turbopack: {
    resolveAlias: {
      'astronomy-engine': './node_modules/astronomy-engine/astronomy.js',
    },
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
