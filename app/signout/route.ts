import { clearSessionCookie } from "../../lib/netlify-session";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("return_to") ?? "/signin";
  const returnTo = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/signin";
  const location = returnTo === "/" ? "/signin" : returnTo;
  return new Response(null, {
    status: 303,
    headers: { Location: location, "Set-Cookie": clearSessionCookie() },
  });
}
