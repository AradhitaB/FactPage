import type { NextConfig } from "next";

const devOrigins = process.env.DEV_ALLOWED_ORIGINS
  ?.split(",").map((s) => s.trim()).filter(Boolean) ?? []

// API URL is a build-time constant — used in connect-src so JS can only call
// the known backend and nothing else.
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

// Content Security Policy
// - script-src / style-src require 'unsafe-inline': Next.js injects hydration
//   scripts and Tailwind emits inline styles; nonce-based hardening is a
//   future improvement once a nonce strategy is in place.
// - connect-src locks outbound fetch/XHR to self + the known API origin.
// - frame-ancestors 'none' is the modern equivalent of X-Frame-Options: DENY
//   (both are set for defence-in-depth).
// - object-src 'none' disables Flash/plugin attacks.
// - base-uri 'self' prevents <base> tag injection.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `connect-src 'self' ${apiUrl}`,
  "img-src 'self' data:",
  "font-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ")

const nextConfig: NextConfig = {
  ...(devOrigins.length > 0 && { allowedDevOrigins: devOrigins }),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
