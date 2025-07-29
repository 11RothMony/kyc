/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: [],
  experimental: {
    typedRoutes: true,
  },
  trailingSlash: true,
  // Static export configuration for Capacitor
  output: 'export',
  distDir: 'out',
  assetPrefix: undefined,
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
}

export default nextConfig