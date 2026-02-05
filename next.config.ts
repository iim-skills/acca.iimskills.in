import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";
import redirect from "./redirect";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,

  async redirects() {
    return redirect;
  },

  async rewrites() {
    return [
    ];
  },

  images: {
    domains: ["iimskills.com"],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    unoptimized: true,
  },

  experimental: {
    serverActions: {},
    // ✅ ONLY THIS NEEDED FOR BIG UPLOADS
    middlewareClientMaxBodySize: 50 * 1024 * 1024, // 50MB
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

const config = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(nextConfig);

export default config;
