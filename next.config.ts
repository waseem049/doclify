import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turbopack config (Next.js 16 default bundler)
  turbopack: {},
  // Webpack fallback — keeps react-pdf working in webpack mode too
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

export default nextConfig;
