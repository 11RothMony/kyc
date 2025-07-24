/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: [],
  experimental: {
    typedRoutes: true,
  },
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

export default nextConfig