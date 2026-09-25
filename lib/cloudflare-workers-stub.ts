/** Used only by the Netlify Next.js build. The Sites build keeps the real Cloudflare binding. */
export const env: {
  DB?: undefined;
  BUCKET?: undefined;
  HUB_ENCRYPTION_KEY?: string;
  MEDIA_BRIDGE_KEY?: string;
} = {
  HUB_ENCRYPTION_KEY: process.env.HUB_ENCRYPTION_KEY,
  MEDIA_BRIDGE_KEY: process.env.MEDIA_BRIDGE_KEY,
};
