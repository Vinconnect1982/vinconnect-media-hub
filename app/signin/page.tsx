export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ return_to?: string; error?: string }> }) {
  const query = await searchParams;
  const returnTo = query.return_to?.startsWith("/") && !query.return_to.startsWith("//") ? query.return_to : "/";
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#071112", color: "#eef3f4", fontFamily: "Outfit, Segoe UI, sans-serif" }}>
      <form action="/api/session" method="post" style={{ width: "min(100% - 2rem, 24rem)", border: "1px solid #2a3d45", background: "#0d181c", padding: "1.5rem" }}>
        <p style={{ margin: 0, fontSize: "1.6rem" }}>VINCONNECT</p>
        <p style={{ color: "#9aadb4" }}>Media Hub</p>
        <input type="hidden" name="return_to" value={returnTo} />
        <input name="password" type="password" autoComplete="current-password" placeholder="Hub password" required style={{ width: "100%", marginTop: "1rem", boxSizing: "border-box", background: "#182830", color: "#eef3f4", border: "1px solid #2a3d45", padding: "0.75rem" }} />
        <button type="submit" style={{ width: "100%", marginTop: "0.75rem", background: "#62dfc8", color: "#071112", border: 0, padding: "0.75rem", fontWeight: 600 }}>Open</button>
        {query.error === "password" && <p style={{ color: "#d45b4a" }}>That password is not right.</p>}
        {query.error === "config" && <p style={{ color: "#d45b4a" }}>Set MEDIA_HUB_PASSWORD on the Netlify site, then try again.</p>}
      </form>
    </main>
  );
}
