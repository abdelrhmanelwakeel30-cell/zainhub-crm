import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    qualities: [100, 75],
    remotePatterns: [
      { protocol: 'https' as const, hostname: '**' },
    ],
  },
};

export default withNextIntl(nextConfig);
