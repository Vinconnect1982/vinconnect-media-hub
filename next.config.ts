import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias["cloudflare:workers"] = path.join(root, "lib/cloudflare-workers-stub.ts");
    return config;
  },
  turbopack: {
    resolveAlias: {
      "cloudflare:workers": "./lib/cloudflare-workers-stub.ts",
    },
  },
};

export default nextConfig;
