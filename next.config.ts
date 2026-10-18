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
    return [
      { source: "/:path*", headers: securityHeaders },
      // Block 2B — a public proposal link carries its token in the path: never sent onward as a Referer,
      // never stored by a shared cache, never indexed. (Later entries override the same header above.)
      {
        source: "/p/:token*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "private, no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
