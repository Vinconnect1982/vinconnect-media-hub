import { mkdirSync, rmSync } from "node:fs";
import { articleSeeds } from "../app/article-seeds.ts";
import { jpegDimensions } from "../lib/jpeg.ts";
import { netlifyArticleDb } from "../lib/netlify-db.ts";
import { netlifyBucket } from "../lib/netlify-media.ts";
import { passwordMatches, readSession, sessionCookie } from "../lib/netlify-session.ts";

const dir = process.env.MEDIA_HUB_DATA_DIR;
if (!dir) throw new Error("MEDIA_HUB_DATA_DIR is required for this check.");
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
process.env.MEDIA_HUB_PASSWORD = "test-hub-password";

const db = netlifyArticleDb();
await db.batch(articleSeeds.map((article) => db.prepare("INSERT OR IGNORE INTO articles (id,title,body,category,image,status,revision,updated_at) VALUES (?,?,?,?,?,'pending',0,?)").bind(article.id, article.title, article.body, article.category, article.image, "2026-09-14T00:00:00.000Z")));
const loaded = await db.prepare("SELECT * FROM articles ORDER BY id").all<{ id: string; title: string; revision: number }>();
if (loaded.results.length !== 15) throw new Error(`Expected 15 seeded articles, got ${loaded.results.length}.`);

const first = loaded.results[0];
const saved = await db.prepare("UPDATE articles SET title=?,body=?,status=?,revision=revision+1,updated_at=?,approved_by=NULL,published_url=NULL,published_at=NULL WHERE id=? AND revision=?").bind("Edited title for the editor check", "Body long enough for the editor check.", "pending", new Date().toISOString(), first.id, first.revision).run();
if (saved.meta.changes !== 1) throw new Error("Editor save did not update the article.");
const edited = await db.prepare("SELECT title,revision FROM articles WHERE id=?").bind(first.id).first<{ title: string; revision: number }>();
if (edited?.title !== "Edited title for the editor check" || edited.revision !== 1) throw new Error("Edited article did not persist.");

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x04, 0x38, 0x04, 0x38, 0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x00, 0x03, 0x11, 0x00, 0xff, 0xd9]);
const size = jpegDimensions(jpeg);
if (!size || size.width !== 1080 || size.height !== 1080) throw new Error("JPEG check failed.");
const photoId = "11111111-1111-4111-8111-111111111111";
await netlifyBucket().put(photoId, jpeg);
await db.prepare("INSERT INTO media_assets(id,kind,path,size,is_public,created_at) VALUES (?,?,?,?,0,?)").bind(photoId, "render", `/media/${photoId}.jpg`, jpeg.length, new Date().toISOString()).run();
const stored = await netlifyBucket().get(photoId);
if (!stored || stored.body.length !== jpeg.length) throw new Error("Uploaded photo was not stored.");
const asset = await db.prepare("SELECT path FROM media_assets WHERE id=?").bind(photoId).first<{ path: string }>();
if (asset?.path !== `/media/${photoId}.jpg`) throw new Error("Upload record was not stored.");

if (!passwordMatches("test-hub-password") || passwordMatches("wrong")) throw new Error("Password check failed.");
const cookie = sessionCookie();
const session = readSession(cookie.split(";")[0]);
if (session?.email !== "vince@vinconnect.com.au") throw new Error("Session cookie did not verify.");

console.log("Netlify hub check passed: 15 articles, editor save, photo upload, sign-in.");
