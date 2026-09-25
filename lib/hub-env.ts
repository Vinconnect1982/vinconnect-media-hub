import { env } from "cloudflare:workers";

/** Sites bindings win when present. Netlify reads the same names from the site environment. */
export function hubEnv(name: "HUB_ENCRYPTION_KEY" | "MEDIA_BRIDGE_KEY"): string | undefined {
  try {
    const bound = (env as { HUB_ENCRYPTION_KEY?: string; MEDIA_BRIDGE_KEY?: string } | undefined)?.[name];
    if (bound) return bound;
  } catch {
    /* Netlify has no Cloudflare binding. */
  }
  return process.env[name] || undefined;
}
