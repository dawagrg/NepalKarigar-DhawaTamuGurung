import { Link, useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>

        {/* Logo */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 40 }}>
          <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#111827" }}>NepalKarigar</span>
        </div>

        {/* Big 404 */}
        <div style={{ position: "relative", marginBottom: 32 }}>
          <div style={{ fontSize: 120, fontWeight: 900, color: "#EFF6FF", lineHeight: 1, userSelect: "none", letterSpacing: "-4px" }}>404</div>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52 }}>🔧</div>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 10 }}>Page Not Found</h1>
        <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.75, marginBottom: 32, maxWidth: 360, margin: "0 auto 32px" }}>
          Looks like this page went missing — maybe the karigar took it with them. Let's get you back on track.
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate(-1)}
            style={{ padding: "10px 20px", borderRadius: 9, border: "1.5px solid #E5E7EB", background: "#fff", color: "#374151", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            ← Go Back
          </button>
          <Link to="/"
            style={{ padding: "10px 20px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 14, textDecoration: "none", display: "inline-block" }}>
            🏠 Go Home
          </Link>
          <Link to="/search"
            style={{ padding: "10px 20px", borderRadius: 9, border: "1.5px solid #BFDBFE", background: "#EFF6FF", color: "#2563EB", fontWeight: 700, fontSize: 14, textDecoration: "none", display: "inline-block" }}>
            Find a Karigar
          </Link>
        </div>

        <p style={{ marginTop: 40, fontSize: 12, color: "#9CA3AF" }}>
          Still lost? <Link to="/about#contact" style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none" }}>Contact us</Link>
        </p>
      </div>
    </div>
  );
}