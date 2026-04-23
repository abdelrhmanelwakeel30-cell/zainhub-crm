import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin();

// Content Security Policy — defense-in-depth against XSS.
// Deployed in report-only mode first (CSP_REPORT_ONLY=true) to catch false positives before enforcing.
// `unsafe-inline` is still required for Next.js <Style> / shadcn runtime theming and Framer Motion style props.
// `unsafe-eval` is only needed in dev for HMR; stripped in production.
const cspDirectives = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== 'production' ? " 'unsafe-eval'" : ''}`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `img-src 'self' data: blob: https:`,
  `font-src 'self' data: https://fonts.gstatic.com`,
  `connect-src 'self' https://*.vercel-insights.com https://*.neon.tech wss: https:`,
  `frame-ancestors 'self'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `object-src 'none'`,
].join('; ')

const cspHeaderKey = process.env.CSP_REPORT_ONLY === 'true'
  ? 'Content-Security-Policy-Report-Only'
  : 'Content-Security-Policy'

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: cspHeaderKey, value: cspDirectives },
]

// Allowlisted image hosts — keep this tight to prevent SSRF via the Next.js
// image optimizer acting as an open proxy. Extend via NEXT_IMAGE_HOSTS
// (comma-separated) if tenants need custom CDNs.
const baseImageHosts = [
  'res.cloudinary.com',
  'images.unsplash.com',
  'avatars.githubusercontent.com',
  'lh3.googleusercontent.com',
  'ucarecdn.com',
  'uploadthing.com',
  'utfs.io',
  'zainhub.ae',
  'crm.zainhub.ae',
  'www.zainhub.ae',
  'api.dicebear.com',
  'gravatar.com',
  'secure.gravatar.com',
]
const extraHosts = (process.env.NEXT_IMAGE_HOSTS ?? '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean)
const imageHosts = Array.from(new Set([...baseImageHosts, ...extraHosts]))

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      'date-fns',
    ],
  },
  poweredByHeader: false,
  images: {
    qualities: [100, 75],
    remotePatterns: imageHosts.map((hostname) => ({
      protocol: 'https' as const,
      hostname,
    })),
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
};

export default withNextIntl(nextConfig);
