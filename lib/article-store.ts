import { env } from "cloudflare:workers";
import { articleSeeds } from "../app/article-seeds";
import { netlifyArticleDb, type ArticleDatabase } from "./netlify-db";

export function articleDb(): ArticleDatabase {
  if (env?.DB) return env.DB as unknown as ArticleDatabase;
  return netlifyArticleDb();
}

const livePublished = ["vinconnect-article-01", "vinconnect-article-03"];

export async function seedArticles() {
  const db = articleDb();
  await db.batch(articleSeeds.map((a) => db.prepare("INSERT OR IGNORE INTO articles (id,title,body,category,image,status,revision,updated_at) VALUES (?,?,?,?,?,'pending',0,?)").bind(a.id, a.title, a.body, a.category, a.image, "2026-09-14T00:00:00.000Z")));
  // These two are published on the live Sites hub. Only untouched seed rows are promoted, so later edits are left alone.
  for (const id of livePublished) {
    await db.prepare("UPDATE articles SET status='published', published_url=?, published_at=COALESCE(published_at, updated_at), approved_by=COALESCE(approved_by, 'vince@vinconnect.com.au') WHERE id=? AND status='pending' AND revision=0").bind(`/articles/${id}`, id).run();
  }
}
