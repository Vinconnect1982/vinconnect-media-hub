import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const DIR = process.env.MEDIA_HUB_DATA_DIR || "/tmp/vinconnect-media-hub";

async function blobStore() {
  if (process.env.MEDIA_HUB_FILE_ONLY === "1") return null;
  try {
    const { getStore } = await import("@netlify/blobs");
    return getStore({ name: "vinconnect-media-hub", consistency: "strong" });
  } catch {
    return null;
  }
}

function fileFor(id: string) {
  return join(DIR, "photos", id);
}

export function netlifyBucket() {
  return {
    async put(id: string, bytes: Uint8Array) {
      const store = await blobStore();
      if (store) {
        const copy = new Uint8Array(bytes);
        await store.set(`photo/${id}`, copy.buffer);
        return;
      }
      mkdirSync(join(DIR, "photos"), { recursive: true });
      writeFileSync(fileFor(id), bytes);
    },
    async get(id: string) {
      const store = await blobStore();
      if (store) {
        const saved = await store.get(`photo/${id}`, { type: "arrayBuffer" });
        if (!saved) return null;
        return { body: new Uint8Array(saved) };
      }
      if (!existsSync(fileFor(id))) return null;
      return { body: new Uint8Array(readFileSync(fileFor(id))) };
    },
    async delete(id: string) {
      const store = await blobStore();
      if (store) {
        await store.delete(`photo/${id}`);
        return;
      }
      if (existsSync(fileFor(id))) unlinkSync(fileFor(id));
    },
  };
}
