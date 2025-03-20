/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Use standalone output for production builds only
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
  // Enable webpack watching for hot reloading in Docker
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Use polling in Docker environments for better hot reloading
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay the rebuild after the first change
        ignored: /node_modules/,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
