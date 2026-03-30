import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  // ✅ THIS IS THE REAL FIX FOR YOUR ERROR
  experimental: {
    serverActions: {
      bodySizeLimit: "5000mb", // (optional, not for API)
    },

    // 🔥 IMPORTANT: FIXES 10MB LIMIT
    proxyClientMaxBodySize: "5000mb",
  },

  // ✅ Required for MySQL on VPS
  serverExternalPackages: ["mysql2"],

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