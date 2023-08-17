/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  reactStrictMode: true,
  transpilePackages: ["lexical-beautiful-mentions"],
  productionBrowserSourceMaps: true,
};

module.exports = nextConfig;
