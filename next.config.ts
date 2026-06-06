import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['astronomy-engine'],
  experimental: {
    turbo: {
      resolveAlias: {
        // Force the CJS build — Turbopack picks the ESM export otherwise,
        // which throws "SyntaxError: Unexpected token 'export'" at runtime
        'astronomy-engine': './node_modules/astronomy-engine/astronomy.js',
      },
    },
  },
};

export default nextConfig;
