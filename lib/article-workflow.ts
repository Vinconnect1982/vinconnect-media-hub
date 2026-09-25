export type ArticleStatus = "pending" | "approved" | "published";
export type ArticleAction = "save" | "approve" | "pending" | "publish";
export type ArticleRevision = { status: string; revision: number };

export function isOwnerEmail(email: unknown): boolean {
  return typeof email === "string" && ["destefano.vince1@gmail.com", "vince@vinconnect.com.au"].includes(email.trim().toLowerCase());
}

export function publicOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol)) return null;
    let host = url.hostname;
    if (host.endsWith(".netlify.app")) {
      const mark = host.indexOf("--");
      if (mark >= 0) host = host.slice(mark + 2);
    }
    return `${url.protocol}//${host}${url.port ? `:${url.port}` : ""}`;
  } catch {
    return null;
  }
}

export function isSameOrigin(requestUrl: string, origin: string | null): boolean {
  if (!origin || origin === "null") return false;
  try {
    const source = new URL(origin);
    if (source.username || source.password || source.search || source.hash) return false;
    if (source.pathname !== "/") return false;
    const requestOrigin = publicOrigin(requestUrl);
    const sourceOrigin = publicOrigin(origin);
    return Boolean(requestOrigin && sourceOrigin && requestOrigin === sourceOrigin);
  } catch {
    return false;
  }
}

export function validateDraft(draft: unknown): { title: string; body: string } {
  if (!draft || typeof draft !== "object" || Array.isArray(draft)) {
    throw new Error("Draft must contain a title and body.");
  }
  const { title, body } = draft as Record<string, unknown>;
  if (typeof title !== "string" || title.trim().length < 3 || title.length > 180) {
    throw new Error("Title must be between 3 and 180 characters.");
  }
  if (typeof body !== "string" || body.trim().length < 20 || body.length > 20000) {
    throw new Error("Article must be between 20 and 20,000 characters.");
  }
  // Keep user text verbatim; the renderer must display it as text, never HTML.
  return { title, body };
}

export function validateAction(article: ArticleRevision | null | undefined, action: unknown, revision: unknown): void {
  if (!article) throw new Error("Article not found.");
  if (!["pending", "approved", "published"].includes(article.status)) throw new Error("Invalid article status.");
  if (!Number.isInteger(article.revision) || article.revision < 0) throw new Error("Invalid stored revision.");
  if (typeof revision !== "number" || !Number.isInteger(revision) || revision < 0) throw new Error("A valid revision is required.");
  if (revision !== article.revision) throw new Error("This article has changed. Reload it before continuing.");
  if (typeof action !== "string" || !["save", "approve", "pending", "publish"].includes(action)) throw new Error("Invalid article action.");
  if (article.status === "published") throw new Error("Published articles cannot be changed or published again.");
  if (action === "approve" && article.status !== "pending") throw new Error("Only pending articles can be approved.");
  if (action === "pending" && article.status !== "approved") throw new Error("Only approved articles can return to pending.");
  if (action === "publish" && article.status !== "approved") throw new Error("Approve this article before publishing.");
}

export function isArticleId(value:unknown):value is string {return typeof value==='string'&&/^(vinconnect-article-\d{2}|vinconnect-install-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/.test(value);}
