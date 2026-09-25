import { mediaPassword, passwordMatches, sessionCookie } from "../../../lib/netlify-session";
import { publicOrigin } from "../../../lib/article-workflow";

export const dynamic = "force-dynamic";

function siteUrl(request: Request, path: string) {
  return new URL(path, publicOrigin(request.url) || request.url);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const requested = String(form.get("return_to") ?? "/");
  const returnTo = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";
  if (!mediaPassword()) {
    return Response.redirect(siteUrl(request, "/signin?error=config"), 303);
  }
  if (!passwordMatches(password)) {
    return Response.redirect(siteUrl(request, `/signin?error=password&return_to=${encodeURIComponent(returnTo)}`), 303);
  }
  return new Response(null, {
    status: 303,
    headers: { Location: returnTo, "Set-Cookie": sessionCookie() },
  });
}
