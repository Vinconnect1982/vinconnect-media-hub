import { env } from "cloudflare:workers";
import { netlifyBucket } from "./netlify-media";

type PhotoObject = { body: Uint8Array; httpMetadata?: { contentType?: string } };
type PhotoBucket = {
  put(id: string, bytes: Uint8Array, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  get(id: string): Promise<PhotoObject | null>;
  delete(id: string): Promise<unknown>;
};

export function mediaBucket(): PhotoBucket {
  if (env?.BUCKET) return env.BUCKET as unknown as PhotoBucket;
  return netlifyBucket();
}
