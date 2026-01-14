import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  distDir: process.env.APP_ENV === 'test' ? '.next-test' : '.next',
  // Trigger restart 2
  experimental: {
    serverActions: {
      bodySizeLimit: '200mb',
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
