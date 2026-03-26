import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";
import redirect from "./redirect";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  /* ===============================
     UPLOAD LIMITS
  =============================== */
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },

  /* ===============================
     ROUTES
  =============================== */
  async rewrites() {
    return [];
  },

  /* ===============================
     IMAGES
  =============================== */
  images: {
    domains: ["iimskills.com", "res.cloudinary.com"],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    unoptimized: true,
  },

  /* ===============================
     HEADERS (CACHE OPTIMIZED)
  =============================== */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },

  /* ===============================
     SVG SUPPORT
  =============================== */
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(nextConfig);