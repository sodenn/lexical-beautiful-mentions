/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["lexical-beautiful-mentions"],
  productionBrowserSourceMaps: true,
};

module.exports = nextConfig;
