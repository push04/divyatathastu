import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keeps astronomy-engine external (not bundled by Turbopack/webpack).
  // Node.js loads it natively at runtime, picking the CJS entry point from
  // the package's exports map — avoiding the ESM "Unexpected token 'export'"
  // crash that occurs when Turbopack bundles the ESM version into a CJS chunk.
  serverExternalPackages: ['astronomy-engine'],
};

export default nextConfig;
