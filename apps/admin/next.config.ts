import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone output bundles a minimal server + only the deps that are
  // actually traced/used, which keeps the image small.
  output: 'standalone',
  transpilePackages: ['@ai-history/ui'],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
