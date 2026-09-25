import { env } from "cloudflare:workers";
import { articleSeeds } from "../app/article-seeds";
export function articleDb() {
  if (!env.DB) throw new Error("Article storage is unavailable. Please retry shortly.");
  return env.DB;
}
export async function seedArticles() {
  const db=articleDb();
  await db.batch(articleSeeds.map(a=>db.prepare("INSERT OR IGNORE INTO articles (id,title,body,category,image,status,revision,updated_at) VALUES (?,?,?,?,?,'pending',0,?)").bind(a.id,a.title,a.body,a.category,a.image,"2026-09-14T00:00:00.000Z")));
}
