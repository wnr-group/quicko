import type { NextConfig } from "next";

// Opening `next dev` from a phone on the same Wi-Fi means requesting it by LAN
// IP, which Next blocks as a cross-origin dev request unless the origin is
// allowed. That address differs per machine and per network, so it is read from
// the environment rather than committed:
//   DEV_ORIGINS=192.168.0.107,192.168.0.108 npm run dev
// Dev-only — `allowedDevOrigins` has no effect on a production build.
const devOrigins = (process.env.DEV_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean)
  .flatMap((o) => (/^https?:\/\//.test(o) ? [o] : [o, `http://${o}:3000`]));

const nextConfig: NextConfig = {
  ...(devOrigins.length ? { allowedDevOrigins: devOrigins } : {}),
};

export default nextConfig;
