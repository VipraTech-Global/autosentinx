import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // self-contained server bundle for the Cloud Run container
};

export default nextConfig;
