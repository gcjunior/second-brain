import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://10.245.49.28:3000",
    "10.245.49.28",
  ],
};

export default nextConfig;