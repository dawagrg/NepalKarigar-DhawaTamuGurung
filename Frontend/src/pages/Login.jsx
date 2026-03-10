import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

const STATS = [
  { value: "12K+", label: "Verified Karigar" },
  { value: "98%",  label: "Happy Customers"  },
  { value: "77",   label: "Districts"         },
];

const TESTIMONIALS = [
  { text: "Found a plumber in under 10 minutes. Saved my entire Sunday!",    name: "Priya Shrestha", loc: "Lalitpur"  },
  { text: "As a karigar I doubled my monthly income within the first month.", name: "Ram Bahadur",    loc: "Pokhara"   },
  { text: "Transparent pricing, fast booking — best platform in Nepal!",      name: "Sita Tamang",    loc: "Bhaktapur" },
];

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ username: "", password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoad]  = useState(false);
  const [focused, setFocus] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [tIdx, setTIdx]     = useState(0);

  const onChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(""); };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) { setError("Please fill in all fields."); return; }
    setLoad(true);
    try {
      const res = await loginUser(form);
      const d = res.data;
      localStorage.setItem("access_token", d.access);
      localStorage.setItem("refresh_token", d.refresh);
      localStorage.setItem("username", d.username);
      localStorage.setItem("user_id", d.user_id);
      localStorage.setItem("role", d.role || "customer");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid credentials. Please try again.");
    } finally { setLoad(false); }
  };

  const T = TESTIMONIALS[tIdx];

  return (
    <div style={{ minHeight: "100vh", background: "white", display: "flex", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── LEFT PANEL (indigo gradient) ── */}
      <div className="auth-left" style={{ background: "linear-gradient(150deg, #4338CA 0%, #4F46E5 40%, #7C3AED 100%)" }}>
        {/* Blobs */}
        <div className="blob" style={{ width: 440, height: 440, background: "rgba(255,255,255,0.1)", top: -120, left: -100 }} />
        <div className="blob" style={{ width: 300, height: 300, background: "rgba(124,58,237,0.25)", bottom: 40, right: -80 }} />
        <div className="blob" style={{ width: 200, height: 200, background: "rgba(99,102,241,0.3)", top: "45%", right: "10%" }} />
        <div className="dot-bg" style={{ position: "absolute", inset: 0, opacity: 0.07 }} />

        {/* Logo */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, background: "white", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 14, color: "#4F46E5", boxShadow: "0 6px 20px rgba(0,0,0,0.12)" }}>NK</div>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 22, color: "white" }}>NepalKarigar</span>
        </div>

        {/* Hero copy */}
        <div style={{ position: "relative" }}>
          <span style={{ display: "inline-block", padding: "5px 14px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 100, fontSize: 12, fontWeight: 600, color: "white", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 22 }}>
            🇳🇵 Nepal's #1 Skill Platform
          </span>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 48, lineHeight: 1.06, letterSpacing: "-1.5px", color: "white", marginBottom: 16 }}>
            Welcome<br />back.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.68)", fontSize: 15, lineHeight: 1.8, maxWidth: 320, marginBottom: 32 }}>
            Find verified electricians, plumbers, carpenters and more — anywhere in Nepal.
          </p>
          {/* Stats */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {STATS.map(({ value, label }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.13)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 14, padding: "10px 16px", textAlign: "center" }}>
                <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 20, color: "white" }}>{value}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div style={{ position: "relative" }}>
          <div style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 20, padding: "22px" }}>
            <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>
              {[0,1,2,3,4].map(i => <span key={i} style={{ color: "#FCD34D", fontSize: 14 }}>★</span>)}
            </div>
            <p style={{ color: "rgba(255,255,255,0.82)", fontSize: 14, lineHeight: 1.75, fontStyle: "italic", marginBottom: 16 }}>"{T.text}"</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "white" }}>{T.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "white" }}>{T.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>📍 {T.loc}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                {TESTIMONIALS.map((_, i) => (
                  <button key={i} onClick={() => setTIdx(i)} style={{ width: i === tIdx ? 22 : 7, height: 7, borderRadius: 100, border: "none", background: i === tIdx ? "white" : "rgba(255,255,255,0.3)", cursor: "pointer", padding: 0, transition: "all 0.25s" }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 36px", overflowY: "auto", background: "white" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* Mobile logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 44 }}>
            <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #4F46E5, #7C3AED)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 13, color: "white", boxShadow: "0 4px 14px rgba(79,70,229,0.3)" }}>NK</div>
            <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 19, color: "#0F172A" }}>Nepal<span style={{ color: "#4F46E5" }}>Karigar</span></span>
          </div>

          <div className="fade-up d1">
            <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 36, color: "#0F172A", marginBottom: 6, letterSpacing: "-1px" }}>Sign in</h1>
            <p style={{ color: "#94A3B8", fontSize: 15, marginBottom: 34 }}>
              No account yet?{" "}
              <Link to="/register" style={{ color: "#4F46E5", fontWeight: 700, textDecoration: "none" }}>Create one free →</Link>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="fade-in" style={{ background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: 12, padding: "13px 18px", marginBottom: 24, color: "#BE123C", fontSize: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ marginTop: 1 }}>⚠</span><span>{error}</span>
            </div>
          )}

          <div className="fade-up d2" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Username */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Username or Phone</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#94A3B8" }}>👤</span>
                <input name="username" type="text" placeholder="Enter username or phone" value={form.username} onChange={onChange}
                  onFocus={() => setFocus("u")} onBlur={() => setFocus("")}
                  className={`nk-input${focused === "u" ? " focused" : ""}`} style={{ paddingLeft: 44 }} />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "0.06em", textTransform: "uppercase" }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: 13, color: "#4F46E5", textDecoration: "none", fontWeight: 600 }}>Forgot?</Link>
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#94A3B8" }}>🔒</span>
                <input name="password" type={showPw ? "text" : "password"} placeholder="Your password" value={form.password} onChange={onChange}
                  onFocus={() => setFocus("p")} onBlur={() => setFocus("")}
                  className={`nk-input${focused === "p" ? " focused" : ""}`} style={{ paddingLeft: 44, paddingRight: 48 }} />
                <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 17, color: "#94A3B8", lineHeight: 1 }}>{showPw ? "🙈" : "👁"}</button>
              </div>
            </div>

            {/* Sign in button */}
            <button onClick={submit} disabled={loading} className="btn btn-primary" style={{ width: "100%", padding: "15px", borderRadius: 13, fontSize: 16, marginTop: 4 }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, position: "relative", zIndex: 1 }}>
                {loading ? <><div className="spinner" />Signing in…</> : "Sign In →"}
              </span>
            </button>

          </div>

          {/* OR divider */}
          <div className="hr-or" style={{ margin: "26px 0" }}>or</div>

          {/* Quick role register */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Link to="/register" state={{ role: "customer" }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 12, textDecoration: "none", fontSize: 13, fontWeight: 600, background: "#EEF2FF", border: "1.5px solid #C7D2FE", color: "#4F46E5", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#E0E7FF"; e.currentTarget.style.borderColor = "#A5B4FC"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#EEF2FF"; e.currentTarget.style.borderColor = "#C7D2FE"; }}>
              🏠 Customer
            </Link>
            <Link to="/register" state={{ role: "karigar" }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 12, textDecoration: "none", fontSize: 13, fontWeight: 600, background: "#FFF1F2", border: "1.5px solid #FECDD3", color: "#E11D48", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#FFE4E6"; e.currentTarget.style.borderColor = "#FDA4AF"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#FFF1F2"; e.currentTarget.style.borderColor = "#FECDD3"; }}>
              🔧 Karigar
            </Link>
          </div>

          <p style={{ textAlign: "center", marginTop: 28, fontSize: 12, color: "#CBD5E1" }}>🔐 Protected with 256-bit encryption</p>
        </div>
      </div>
    </div>
  );
}