/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // taxonomy YAML files are read from disk at runtime (fs), not bundled as assets
    return config;
  },
};

module.exports = nextConfig;
