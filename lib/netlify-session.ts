import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "vc-media";
const OWNER = "vince@vinconnect.com.au";
const WEEK = 14 * 24 * 60 * 60 * 1000;

export function mediaPassword() {
  return process.env.MEDIA_HUB_PASSWORD || process.env.ADMIN_PASSWORD || "";
}

export function onNetlify() {
  return process.env.NETLIFY === "true" || process.env.MEDIA_HUB_RUNTIME === "netlify" || process.env.SITE_NAME === "vinconnect-media";
}

function sign(payload: string) {
  return createHmac("sha256", mediaPassword()).update(payload).digest("base64url");
}

export function sessionCookie(email = OWNER) {
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + WEEK })).toString("base64url");
  return `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=1209600`;
}

export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function readSession(cookieHeader: string | null): { email: string; displayName: string } | null {
  const secret = mediaPassword();
  if (!cookieHeader || !secret) return null;
  const pair = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`));
  if (!pair) return null;
  const token = pair.slice(COOKIE.length + 1);
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = sign(payload);
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { email?: string; exp?: number };
    if (data.email !== OWNER || !data.exp || data.exp < Date.now()) return null;
    return { email: OWNER, displayName: "Vince" };
  } catch {
    return null;
  }
}

export function passwordMatches(input: string) {
  const expected = mediaPassword();
  if (!expected) return false;
  const left = Buffer.from(input);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
