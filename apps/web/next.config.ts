import type { NextConfig } from 'next';
import path from 'path';

/**
 * F1-01 — Admin Portal is a client-first static app (ADR-007 intent via Next.js).
 * No SSR, Route Handlers, or Server Actions. NestJS remains the only backend.
 */
const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  reactStrictMode: true,
  // Avoid picking an unrelated lockfile above the monorepo (Next workspace-root inference).
  outputFileTracingRoot: path.join(__dirname, '../..'),
};

export default nextConfig;
