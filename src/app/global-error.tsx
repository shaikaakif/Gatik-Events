"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ margin: 0, background: "#F6F1E8", color: "#24211D", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px" }}>
          <div style={{ maxWidth: "480px", border: "2px solid #24211D", padding: "32px", boxShadow: "5px 5px 0 #24211D" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>Gatik Events</p>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: "44px", fontWeight: 400, lineHeight: 1, margin: "18px 0" }}>The page stopped safely.</h1>
            <p>No change was silently accepted. Retry, or return later if the issue continues.</p>
            <button type="button" onClick={reset} style={{ minHeight: "48px", marginTop: "20px", border: "2px solid #24211D", background: "#E65B45", padding: "10px 18px", fontWeight: 700 }}>
              Retry page
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
