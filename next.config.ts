import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't bundle astronomy-engine — let Node load it natively at runtime.
  // Node's require() picks the CJS entry ("./astronomy.js") from the exports
  // map, avoiding the ESM crash when bundled into a CJS Turbopack chunk.
  serverExternalPackages: ['astronomy-engine'],

  // Belt-and-suspenders: explicitly alias astronomy-engine to its CJS file
  // so even if Turbopack bundles it, it processes the CJS build (not ESM).
  turbopack: {
    resolveAlias: {
      'astronomy-engine': './node_modules/astronomy-engine/astronomy.js',
    },
  },
};

export default nextConfig;
