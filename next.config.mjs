/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // For Docker
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'server.yalaride.com',
        pathname: '/**',
      },
    ],
  },
  // Turbopack configuration (Next.js 16 default)
  turbopack: {},
};

export default nextConfig;
