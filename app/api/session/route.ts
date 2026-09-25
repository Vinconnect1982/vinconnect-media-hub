import { mediaPassword, passwordMatches, sessionCookie } from "../../../lib/netlify-session";

export const dynamic = "force-dynamic";

function siteUrl(request: Request, path: string) {
  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwarded && !forwarded.includes("--") ? forwarded : request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  return new URL(path, host ? `${proto}://${host}` : request.url);
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
