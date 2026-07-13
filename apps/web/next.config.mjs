/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@riskforge/domain'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
  images: {
    remotePatterns: [],
  },
  // Dev proxy: with NEXT_PUBLIC_API_URL unset/empty, the browser calls
  // same-origin /v1/* and /health, and Next forwards them to the API. This
  // avoids cross-origin requests in dev entirely (no CORS configuration in
  // the browser path). Set API_PROXY_TARGET if the API runs elsewhere.
  async rewrites() {
    const target = (process.env.API_PROXY_TARGET ?? 'http://localhost:3001').replace(/\/$/, '')
    return [
      { source: '/v1/:path*', destination: `${target}/v1/:path*` },
      { source: '/health', destination: `${target}/health` },
    ]
  },
}

export default nextConfig
