import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    // Strip console noise from the production bundle, keep errors/warnings.
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    // Next 15.5 on Windows intermittently fails page-data collection and build
    // tracing with PageNotFoundError (/_document) or a missing *.nft.json —
    // its worker pool races the filesystem while writing .next. Running the
    // build single-threaded makes it deterministic. Costs a few seconds of
    // build time; changes nothing about the shipped output.
    cpus: 1,
    webpackBuildWorker: false,
  },
};

export default nextConfig;
