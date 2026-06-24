import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't bundle astronomy-engine — let Node load it natively at runtime.
  serverExternalPackages: ['astronomy-engine'],

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
