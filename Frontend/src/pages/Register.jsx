import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { registerUser } from "../services/api";

const ROLES = [
  {
    id: "customer", cls: "rc-customer", pillCls: "pill-indigo",
    emoji: "🏠", title: "Customer", sub: "I need skilled help",
    desc: "Browse & book verified professionals across Nepal.",
    perks: ["Find workers near you", "Clear & fair pricing", "Secure bookings", "Ratings & reviews"],
    grad: "linear-gradient(135deg, #4F46E5, #7C3AED)",
    glow: "rgba(79,70,229,0.22)", accent: "#4F46E5",
    leftBg: "linear-gradient(150deg, #4338CA 0%, #4F46E5 45%, #7C3AED 100%)",
    activeCls: "active",
  },
  {
    id: "karigar", cls: "rc-karigar", pillCls: "pill-rose",
    emoji: "🔧", title: "Karigar", sub: "I offer my skills",
    desc: "Create your professional profile and connect with thousands of customers.",
    perks: ["Showcase your skills", "Set your own price", "More job opportunities", "Get verified badge"],
    grad: "linear-gradient(135deg, #E11D48, #9F1239)",
    glow: "rgba(225,29,72,0.2)", accent: "#E11D48",
    leftBg: "linear-gradient(150deg, #9F1239 0%, #E11D48 50%, #BE123C 100%)",
    activeCls: "active",
  },
];

export default function Register() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const preRole   = location.state?.role || "";
  const [step, setStep]     = useState(preRole ? 2 : 1);
  const [role, setRole]     = useState(preRole);
  const [form, setForm]     = useState({ first_name: "", last_name: "", username: "", phone_number: "", email: "", password: "", confirmPassword: "" });
  const [error, setError]   = useState("");
  const [loading, setLoad]  = useState(false);
  const [focused, setFocus] = useState("");
  const [showPw, setShowPw] = useState(false);

  const R = ROLES.find(r => r.id === role);

  const onChange = e => { setForm({ ...form, [e.target.name]: e.target.value }); setError(""); };

  const submit = async e => {
    e.preventDefault();
    if (!form.username || !form.phone_number || !form.password) { setError("Username, phone and password are required."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoad(true);
    try {
      const res = await registerUser({ ...form, role, confirmPassword: undefined });
      const d = res.data;
      localStorage.setItem("access_token", d.access);
      localStorage.setItem("refresh_token", d.refresh);
      localStorage.setItem("username", d.username);
      localStorage.setItem("user_id", d.user_id);
      localStorage.setItem("role", d.role);
      navigate("/");
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.error || (data && Object.values(data)[0]) || "Registration failed.";
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally { setLoad(false); }
  };

  const pwLen = form.password.length;
  const str   = pwLen === 0 ? 0 : pwLen < 6 ? 1 : pwLen < 10 ? 2 : pwLen < 14 ? 3 : 4;
  const strC  = ["", "#E11D48", "#D97706", "#059669", "#4F46E5"][str];
  const strLbl= ["", "Weak", "Fair", "Good", "Strong"][str];

  const focusCls = name => `nk-input${R?.id === "karigar" ? " rk" : ""}${focused === name ? " focused" : ""}`;

  const FLabel = ({ children, req }) => (
    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
      {children}{req && <span style={{ color: R?.accent, marginLeft: 3 }}>*</span>}
    </label>
  );

  return (
    <div style={{ minHeight: "100vh", background: "white", display: "flex", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── LEFT PANEL ── */}
      <div className="auth-left" style={{ background: R ? R.leftBg : "linear-gradient(150deg, #4338CA 0%, #4F46E5 45%, #7C3AED 100%)", transition: "background 0.6s ease" }}>
        <div className="blob" style={{ width: 400, height: 400, background: "rgba(255,255,255,0.1)", top: -100, left: -80 }} />
        <div className="blob" style={{ width: 280, height: 280, background: "rgba(0,0,0,0.08)", bottom: 40, right: -60 }} />
        <div className="dot-bg" style={{ position: "absolute", inset: 0, opacity: 0.07 }} />

        {/* Logo */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, background: "white", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 14, color: R?.accent || "#4F46E5", boxShadow: "0 6px 20px rgba(0,0,0,0.12)", transition: "color 0.5s" }}>NK</div>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 22, color: "white" }}>NepalKarigar</span>
        </div>

        {/* Dynamic copy */}
        <div style={{ position: "relative" }}>
          {step === 1 && (
            <>
              <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 44, lineHeight: 1.07, letterSpacing: "-1.5px", color: "white", marginBottom: 16 }}>Join Nepal's<br />skill economy.</h2>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, lineHeight: 1.8 }}>Connect customers with trusted karigar professionals across all 77 districts.</p>
            </>
          )}
          {step === 2 && R && (
            <>
              <div style={{ fontSize: 52, marginBottom: 20 }}>{R.emoji}</div>
              <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 40, lineHeight: 1.07, letterSpacing: "-1.2px", color: "white", marginBottom: 14 }}>
                {role === "customer" ? "Find the right\nkarigar fast." : "Grow your\nkarigar career."}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.62)", fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>{R.desc}</p>
              {R.perks.map(p => (
                <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "white", flexShrink: 0 }}>✓</div>
                  <span style={{ color: "rgba(255,255,255,0.78)", fontSize: 14 }}>{p}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Steps */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 14 }}>
          {[{ n: 1, l: "Choose your role" }, { n: 2, l: "Fill in your details" }, { n: 3, l: "Start using NepalKarigar" }].map(({ n, l }) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 13, opacity: step === n ? 1 : step > n ? 0.75 : 0.35, transition: "opacity 0.4s" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: step > n ? "rgba(255,255,255,0.9)" : "transparent", border: `2px solid rgba(255,255,255,${step >= n ? 0.85 : 0.3})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: step > n ? 12 : 11, fontWeight: 800, color: step > n ? (R?.accent || "#4F46E5") : "white", flexShrink: 0, transition: "all 0.4s", fontFamily: "Syne, sans-serif" }}>
                {step > n ? "✓" : n}
              </div>
              <span style={{ color: `rgba(255,255,255,${step >= n ? 0.9 : 0.4})`, fontSize: 14, fontWeight: step === n ? 600 : 400 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT FORM ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 36px", overflowY: "auto", background: "white" }}>
        <div style={{ width: "100%", maxWidth: 500, padding: "20px 0" }}>

          {/* Logo mobile */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
            <div style={{ width: 40, height: 40, background: R ? R.grad : "linear-gradient(135deg, #4F46E5, #7C3AED)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 13, color: "white", boxShadow: `0 4px 14px ${R?.glow || "rgba(79,70,229,0.3)"}`, transition: "all 0.5s" }}>NK</div>
            <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 19, color: "#0F172A" }}>
              Nepal<span style={{ color: R?.accent || "#4F46E5", transition: "color 0.4s" }}>Karigar</span>
            </span>
          </div>

          {/* ── STEP 1: Role selection ── */}
          {step === 1 && (
            <div className="fade-up d1">
              <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 32, color: "#0F172A", marginBottom: 6, letterSpacing: "-0.5px" }}>I want to…</h1>
              <p style={{ color: "#94A3B8", fontSize: 15, marginBottom: 32 }}>
                Pick your role to get started.{" "}
                <Link to="/login" style={{ color: "#4F46E5", fontWeight: 700, textDecoration: "none" }}>Already have an account? →</Link>
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
                {ROLES.map(r => (
                  <button key={r.id} onClick={() => { setRole(r.id); setStep(2); }} className={`role-card ${r.cls}`}>
                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                      {/* Icon */}
                      <div style={{ width: 68, height: 68, borderRadius: 18, background: r.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, flexShrink: 0, boxShadow: `0 8px 22px ${r.glow}` }}>{r.emoji}</div>
                      {/* Text */}
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 20, color: "#0F172A", marginBottom: 4 }}>{r.title}</div>
                        <div style={{ fontSize: 13, color: "#64748B" }}>{r.sub}</div>
                      </div>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: "#CBD5E1", flexShrink: 0 }}>
                        <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Form ── */}
          {step === 2 && R && (
            <div className="fade-up d1">
              {/* Role badge + back */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 26 }}>
                <span className={`pill ${R.pillCls}`}>{R.emoji} Registering as {R.title}</span>
                <button onClick={() => { setStep(1); setError(""); }} style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  ← Change
                </button>
              </div>

              <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 28, color: "#0F172A", marginBottom: 6, letterSpacing: "-0.5px" }}>Create your account</h1>
              <p style={{ color: "#94A3B8", fontSize: 14, marginBottom: 26 }}>
                Already registered?{" "}
                <Link to="/login" style={{ color: R.accent, fontWeight: 700, textDecoration: "none" }}>Sign in →</Link>
              </p>

              {error && (
                <div className="fade-in" style={{ background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: 12, padding: "13px 18px", marginBottom: 22, color: "#BE123C", fontSize: 14, display: "flex", gap: 10 }}>
                  <span>⚠</span> {error}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Name row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[["first_name","First Name","First name"],["last_name","Last Name","Last name"]].map(([name,label,ph]) => (
                    <div key={name}>
                      <FLabel>{label}</FLabel>
                      <input name={name} type="text" placeholder={ph} value={form[name]} onChange={onChange}
                        onFocus={() => setFocus(name)} onBlur={() => setFocus("")}
                        className={focusCls(name)} />
                    </div>
                  ))}
                </div>

                {/* Username */}
                <div>
                  <FLabel req>Username</FLabel>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#94A3B8", fontWeight: 700 }}>@</span>
                    <input name="username" type="text" placeholder="Choose a username" value={form.username} onChange={onChange}
                      onFocus={() => setFocus("u")} onBlur={() => setFocus("")}
                      className={focusCls("u")} style={{ paddingLeft: 32 }} />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <FLabel req>Phone Number</FLabel>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🇳🇵</span>
                    <input name="phone_number" type="tel" placeholder="98XXXXXXXX" value={form.phone_number} onChange={onChange}
                      onFocus={() => setFocus("ph")} onBlur={() => setFocus("")}
                      className={focusCls("ph")} style={{ paddingLeft: 42 }} />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                    Email <span style={{ fontSize: 11, color: "#CBD5E1", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>optional</span>
                  </label>
                  <input name="email" type="email" placeholder="your@email.com" value={form.email} onChange={onChange}
                    onFocus={() => setFocus("em")} onBlur={() => setFocus("")}
                    className={focusCls("em")} />
                </div>

                {/* Password */}
                <div>
                  <FLabel req>Password</FLabel>
                  <div style={{ position: "relative" }}>
                    <input name="password" type={showPw ? "text" : "password"} placeholder="Min. 8 characters" value={form.password} onChange={onChange}
                      onFocus={() => setFocus("pw")} onBlur={() => setFocus("")}
                      className={focusCls("pw")} style={{ paddingRight: 48 }} />
                    <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 17, color: "#94A3B8", lineHeight: 1 }}>{showPw ? "🙈" : "👁"}</button>
                  </div>
                  {form.password && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
                        {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: str >= i ? strC : "#E2E8F0", transition: "background 0.3s" }} />)}
                      </div>
                      <span style={{ fontSize: 11, color: strC, fontWeight: 700 }}>{strLbl} password</span>
                    </div>
                  )}
                </div>

                {/* Confirm */}
                <div>
                  <FLabel req>Confirm Password</FLabel>
                  <div style={{ position: "relative" }}>
                    <input name="confirmPassword" type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={onChange}
                      onFocus={() => setFocus("cp")} onBlur={() => setFocus("")}
                      className={focusCls("cp")} style={{ paddingRight: 48 }} />
                    {form.confirmPassword && (
                      <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>
                        {form.password === form.confirmPassword ? "✅" : "❌"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Submit */}
                <button onClick={submit} disabled={loading} className={`btn ${R.id === "karigar" ? "btn-rose" : "btn-primary"}`} style={{ width: "100%", padding: "15px", borderRadius: 13, fontSize: 16, marginTop: 4 }}>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, position: "relative", zIndex: 1 }}>
                    {loading ? <><div className="spinner" />Creating account…</> : `Create ${R.title} Account →`}
                  </span>
                </button>

                <p style={{ textAlign: "center", color: "#CBD5E1", fontSize: 11 }}>By registering you agree to our Terms &amp; Privacy Policy.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}