import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  compress: true,
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/politica-de-privacidad',
        destination: '/legal/privacidad',
        permanent: true,
      },
      {
        source: '/terminos-y-condiciones',
        destination: '/legal/terminos',
        permanent: true,
      },
      {
        source: '/privacidad',
        destination: '/legal/privacidad',
        permanent: true,
      },
      {
        source: '/terminos',
        destination: '/legal/terminos',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
