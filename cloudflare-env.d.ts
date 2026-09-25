declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    MEDIA_BRIDGE_KEY?: string;
  }
}
