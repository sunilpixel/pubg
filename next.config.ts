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
    // build single-threaded makes it far more reliable. Costs a few seconds of
    // build time; changes nothing about the shipped output.
    //
    // NOTE: `webpackBuildWorker` was also set here, but this Next version
    // rejects it as an unknown experiment (it prints `⨯ webpackBuildWorker`),
    // so it was doing nothing. Removed.
    cpus: 1,
  },
};

export default nextConfig;
