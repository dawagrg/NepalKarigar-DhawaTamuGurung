import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { resetPassword } from "../services/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm]     = useState({ reset_token: location.state?.token || "", new_password: "", confirm_password: "" });
  const [focused, setFocus] = useState("");
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState("");
  const [success, setOk]    = useState(false);
  const [showPw, setShowPw] = useState(false);

  const onChange = e => { setForm({ ...form, [e.target.name]: e.target.value }); setError(""); };

  const pwLen = form.new_password.length;
  const str   = pwLen === 0 ? 0 : pwLen < 6 ? 1 : pwLen < 10 ? 2 : pwLen < 14 ? 3 : 4;
  const strC  = ["", "#E11D48", "#D97706", "#059669", "#4F46E5"][str];
  const strLbl= ["", "Weak", "Fair", "Good", "Strong"][str];

  const submit = async e => {
    e.preventDefault();
    if (!form.reset_token || !form.new_password || !form.confirm_password) { setError("All fields are required."); return; }
    if (form.new_password !== form.confirm_password) { setError("Passwords do not match."); return; }
    if (form.new_password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoad(true);
    try {
      await resetPassword(form);
      setOk(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
    } finally { setLoad(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px", fontFamily: "'Plus Jakarta Sans', sans-serif", position: "relative" }}>
      <div className="blob" style={{ width: 460, height: 460, background: "rgba(79,70,229,0.07)", top: "5%", left: "5%", position: "fixed" }} />
      <div className="blob" style={{ width: 320, height: 320, background: "rgba(124,58,237,0.06)", bottom: "10%", right: "5%", position: "fixed" }} />
      <div className="dot-bg" style={{ position: "fixed", inset: 0, opacity: 0.35 }} />

      <div style={{ width: "100%", maxWidth: 460, position: "relative", zIndex: 1 }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
          <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #4F46E5, #7C3AED)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 13, color: "white", boxShadow: "0 4px 14px rgba(79,70,229,0.3)" }}>NK</div>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 19, color: "#0F172A" }}>Nepal<span style={{ color: "#4F46E5" }}>Karigar</span></span>
        </div>

        <div className="card" style={{ padding: "40px 36px", borderRadius: 24 }}>
          {!success ? (
            <div className="fade-up d1">
              <div style={{ width: 64, height: 64, borderRadius: 18, background: "#EEF2FF", border: "1px solid #C7D2FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 28 }}>🔒</div>

              <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 30, color: "#0F172A", marginBottom: 8, letterSpacing: "-0.5px" }}>Set New Password</h1>
              <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>Paste your reset token and choose a new strong password.</p>

              {error && (
                <div className="fade-in" style={{ background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: 12, padding: "13px 18px", marginBottom: 24, color: "#BE123C", fontSize: 14, display: "flex", gap: 10 }}>
                  <span>⚠</span> {error}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Token */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Reset Token</label>
                  <input name="reset_token" type="text" placeholder="Paste your reset token here" value={form.reset_token} onChange={onChange}
                    onFocus={() => setFocus("t")} onBlur={() => setFocus("")}
                    className={`nk-input${focused === "t" ? " focused" : ""}`}
                    style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: "0.03em" }} />
                </div>

                {/* New password */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>New Password</label>
                  <div style={{ position: "relative" }}>
                    <input name="new_password" type={showPw ? "text" : "password"} placeholder="Min. 8 characters" value={form.new_password} onChange={onChange}
                      onFocus={() => setFocus("np")} onBlur={() => setFocus("")}
                      className={`nk-input${focused === "np" ? " focused" : ""}`} style={{ paddingRight: 48 }} />
                    <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 17, color: "#94A3B8" }}>{showPw ? "🙈" : "👁"}</button>
                  </div>
                  {form.new_password && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                        {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: str >= i ? strC : "#E2E8F0", transition: "background 0.3s" }} />)}
                      </div>
                      <span style={{ fontSize: 11, color: strC, fontWeight: 700 }}>{strLbl} password</span>
                    </div>
                  )}
                </div>

                {/* Confirm */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Confirm Password</label>
                  <div style={{ position: "relative" }}>
                    <input name="confirm_password" type="password" placeholder="Re-enter new password" value={form.confirm_password} onChange={onChange}
                      onFocus={() => setFocus("cp")} onBlur={() => setFocus("")}
                      className={`nk-input${focused === "cp" ? " focused" : ""}`} style={{ paddingRight: 48 }} />
                    {form.confirm_password && (
                      <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>
                        {form.new_password === form.confirm_password ? "✅" : "❌"}
                      </span>
                    )}
                  </div>
                </div>

                <button onClick={submit} disabled={loading} className="btn btn-primary" style={{ width: "100%", padding: "15px", borderRadius: 13, fontSize: 15, marginTop: 4 }}>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, position: "relative", zIndex: 1 }}>
                    {loading ? <><div className="spinner" />Resetting…</> : "Reset Password →"}
                  </span>
                </button>

                <p style={{ textAlign: "center", fontSize: 13 }}>
                  <Link to="/forgot-password" style={{ color: "#94A3B8", textDecoration: "none", fontWeight: 500 }}>← Get a new token</Link>
                </p>
              </div>
            </div>
          ) : (
            <div className="fade-up d1" style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg, #4F46E5, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, margin: "0 auto 28px", boxShadow: "0 12px 36px rgba(79,70,229,0.35)" }}>✓</div>
              <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 28, color: "#0F172A", marginBottom: 10 }}>Password Reset!</h2>
              <p style={{ color: "#64748B", fontSize: 15, marginBottom: 6 }}>Your password has been updated successfully.</p>
              <p style={{ color: "#94A3B8", fontSize: 13 }}>Redirecting to sign in…</p>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: 24 }}>
          <Link to="/login" style={{ color: "#94A3B8", fontSize: 14, textDecoration: "none", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 5 }}>
            ← Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}