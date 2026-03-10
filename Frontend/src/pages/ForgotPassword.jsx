import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/api";

export default function ForgotPassword() {
  const [identifier, setId] = useState("");
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState("");
  const [result, setResult] = useState(null);
  const [focused, setFocus] = useState(false);
  const [copied, setCopied] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (!identifier.trim()) { setError("Please enter your phone number or email."); return; }
    setLoad(true); setError("");
    try {
      const res = await forgotPassword({ identifier });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally { setLoad(false); }
  };

  const copy = () => {
    if (result?.reset_token) {
      navigator.clipboard.writeText(result.reset_token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px", fontFamily: "'Plus Jakarta Sans', sans-serif", position: "relative" }}>

      {/* Subtle bg blobs */}
      <div className="blob" style={{ width: 500, height: 500, background: "rgba(79,70,229,0.07)", top: "5%", right: "5%", position: "fixed" }} />
      <div className="blob" style={{ width: 350, height: 350, background: "rgba(124,58,237,0.05)", bottom: "10%", left: "5%", position: "fixed" }} />
      <div className="dot-bg" style={{ position: "fixed", inset: 0, opacity: 0.35 }} />

      <div style={{ width: "100%", maxWidth: 460, position: "relative", zIndex: 1 }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
          <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #4F46E5, #7C3AED)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 13, color: "white", boxShadow: "0 4px 14px rgba(79,70,229,0.3)" }}>NK</div>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 19, color: "#0F172A" }}>Nepal<span style={{ color: "#4F46E5" }}>Karigar</span></span>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: "40px 36px", borderRadius: 24 }}>

          {!result ? (
            <div className="fade-up d1">
              {/* Icon */}
              <div style={{ width: 64, height: 64, borderRadius: 18, background: "#EEF2FF", border: "1px solid #C7D2FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 28 }}>🔑</div>

              <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 30, color: "#0F172A", marginBottom: 8, letterSpacing: "-0.5px" }}>Forgot password?</h1>
              <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
                No worries — enter your registered phone number or email and we'll generate a secure reset token.
              </p>

              {error && (
                <div className="fade-in" style={{ background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: 12, padding: "13px 18px", marginBottom: 24, color: "#BE123C", fontSize: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span>⚠</span><span>{error}</span>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Phone or Email</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#94A3B8" }}>📱</span>
                    <input type="text" placeholder="98XXXXXXXX or you@email.com" value={identifier}
                      onChange={e => { setId(e.target.value); setError(""); }}
                      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
                      className={`nk-input${focused ? " focused" : ""}`} style={{ paddingLeft: 44 }} />
                  </div>
                </div>

                <button onClick={submit} disabled={loading} className="btn btn-primary" style={{ width: "100%", padding: "15px", borderRadius: 13, fontSize: 15 }}>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, position: "relative", zIndex: 1 }}>
                    {loading ? <><div className="spinner" />Sending…</> : "Send Reset Token →"}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="fade-up d1">
              {/* Success icon */}
              <div style={{ width: 64, height: 64, borderRadius: 18, background: "#F0FDF4", border: "1px solid #A7F3D0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 28 }}>✅</div>

              <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 28, color: "#0F172A", marginBottom: 10 }}>Token Generated!</h2>
              <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>{result.message}</p>

              {result.reset_token && (
                <div style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 16, padding: "20px", marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase" }}>Reset Token</span>
                    <button onClick={copy} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", background: copied ? "#F0FDF4" : "white", border: `1px solid ${copied ? "#A7F3D0" : "#E2E8F0"}`, borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, color: copied ? "#059669" : "#475569", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s" }}>
                      {copied ? "✓ Copied!" : "📋 Copy"}
                    </button>
                  </div>
                  <code style={{ fontSize: 12, color: "#4F46E5", wordBreak: "break-all", lineHeight: 1.7, display: "block", fontFamily: "monospace" }}>{result.reset_token}</code>
                  <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 12, display: "flex", alignItems: "center", gap: 5 }}>
                    <span>⏰</span> Expires in 1 hour
                  </div>
                </div>
              )}

              <Link to="/reset-password" state={{ token: result.reset_token }} className="btn btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "15px", borderRadius: 13, color: "white", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
                Reset My Password →
              </Link>
            </div>
          )}

        </div>

        <p style={{ textAlign: "center", marginTop: 24 }}>
          <Link to="/login" style={{ color: "#94A3B8", fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 500 }}>
            ← Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}