import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  /* config options here */
};

// Keeps esbuild out of the server bundle; it builds the service worker.
export default withSerwist(nextConfig);
