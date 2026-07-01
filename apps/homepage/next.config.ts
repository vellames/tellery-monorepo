import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Standalone output bundles a minimal server + only the deps that are
  // actually traced/used, which keeps the Railway/Docker image small.
  output: 'standalone',
  transpilePackages: ['@ai-history/ui'],
};

export default withNextIntl(nextConfig);
