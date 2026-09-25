import { spawnSync } from "node:child_process";

if (process.env.NETLIFY === "true") {
  const result = spawnSync(process.execPath, ["./node_modules/next/dist/bin/next", "build"], {
    stdio: "inherit",
    env: { ...process.env, MEDIA_HUB_RUNTIME: "netlify" },
  });
  process.exit(result.status ?? 1);
}

const result = spawnSync(process.execPath, ["scripts/run-framework.mjs", "build"], { stdio: "inherit" });
process.exit(result.status ?? 1);
