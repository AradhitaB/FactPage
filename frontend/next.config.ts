import type { NextConfig } from "next";

// Local network testing (e.g. phone on same Wi-Fi) — comma-separated IPs
const devOrigins = process.env.DEV_ALLOWED_ORIGINS
  ?.split(",").map((s) => s.trim()).filter(Boolean) ?? []

const nextConfig: NextConfig = {
  // Static export — all pages are 'use client' with no server components or
  // API routes. Produces a plain HTML/JS/CSS bundle for Cloudflare Pages.
  // Security headers live in frontend/public/_headers (Cloudflare applies them
  // at the edge). The headers() function is not available in static export mode.
  output: "export",
  ...(devOrigins.length > 0 && { allowedDevOrigins: devOrigins }),
};

export default nextConfig;
