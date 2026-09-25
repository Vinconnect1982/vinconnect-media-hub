import { mediaPassword, passwordMatches, sessionCookie } from "../../../lib/netlify-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const requested = String(form.get("return_to") ?? "/");
  const returnTo = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";
  if (!mediaPassword()) {
    return Response.redirect(new URL("/signin?error=config", request.url), 303);
  }
  if (!passwordMatches(password)) {
    return Response.redirect(new URL(`/signin?error=password&return_to=${encodeURIComponent(returnTo)}`, request.url), 303);
  }
  return new Response(null, {
    status: 303,
    headers: { Location: returnTo, "Set-Cookie": sessionCookie() },
  });
}
