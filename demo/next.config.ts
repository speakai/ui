import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/ui",
  images: { unoptimized: true },
  transpilePackages: ["@speakai/ui"],
};

export default nextConfig;
