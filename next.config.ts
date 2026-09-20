import type { NextConfig } from "next";

/**
 * Same conservative baseline as ul-console (F16 there): no CSP yet — a
 * strict Content-Security-Policy needs nonce-based work to not break
 * Next.js hydration or Supabase's OAuth redirect, and this phase is about
 * establishing the tenant console's foundation, not re-litigating that.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
