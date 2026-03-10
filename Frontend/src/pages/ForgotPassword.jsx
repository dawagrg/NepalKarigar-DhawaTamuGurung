import { useState } from "react";
import { Link } from "react-router-dom";
import { IPhone, IKey, ILock, IEye, IEyeOff, ICopy, ICheck, ICheckCirc, IAlertCirc, IClock, IWrench } from "./Icons";
import { forgotPassword, resetPassword } from "../services/api";

export default function ForgotPassword() {
  const [step,       setStep]   = useState(1);
  const [identifier, setId]     = useState("");
  const [token,      setToken]  = useState("");       // returned by API (dev mode)
  const [tokenPaste, setTPaste] = useState("");       // user-pasted (prod mode)
  const [pw,         setPw]     = useState({ new_password: "", confirm_password: "" });
  const [showPw,     setShowPw] = useState(false);
  const [loading,    setLoad]   = useState(false);
  const [error,      setErr]    = useState("");
  const [copied,     setCopied] = useState(false);

  /* Step 1 — request token */
  const sendToken = async () => {
    if (!identifier.trim()) { setErr("Please enter your phone number or email."); return; }
    setLoad(true); setErr("");
    try {
      const res = await forgotPassword({ identifier: identifier.trim() });
      setToken(res.data.reset_token || "");
      setStep(2);
    } catch (e) {
      setErr(e.response?.data?.error || "No account found with that identifier.");
    } finally { setLoad(false); }
  };

  /* Step 2 — set new password */
  const setNewPw = async () => {
    const usedToken = token || tokenPaste.trim();
    if (!usedToken)                          { setErr("Please enter your reset token."); return; }
    if (!pw.new_password)                    { setErr("Please enter a new password."); return; }
    if (pw.new_password.length < 8)          { setErr("Password must be at least 8 characters."); return; }
    if (pw.new_password !== pw.confirm_password) { setErr("Passwords do not match."); return; }
    setLoad(true); setErr("");
    try {
      await resetPassword({ reset_token: usedToken, new_password: pw.new_password, confirm_password: pw.confirm_password });
      setStep(3);
    } catch (e) {
      setErr(e.response?.data?.error || "Invalid or expired token. Please request a new one.");
    } finally { setLoad(false); }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const len    = pw.new_password.length;
  const str    = len === 0 ? 0 : len < 6 ? 1 : len < 10 ? 2 : len < 14 ? 3 : 4;
  const strClr = ["","#DC2626","#D97706","#16A34A","#2563EB"][str];
  const strTxt = ["","Weak","Fair","Good","Strong"][str];

  /* Step progress dots */
  const Steps = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 22 }}>
      {[1,2,3].map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", flex: s < 3 ? 1 : "none" }}>
          <div style={{
            width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 600, transition: "all .25s",
            background: step >= s ? "var(--primary)" : "var(--bg-card)",
            border: `1.5px solid ${step >= s ? "var(--primary)" : "var(--border)"}`,
            color: step >= s ? "#fff" : "var(--text-p)",
          }}>
            {step > s ? <ICheck size={11} color="#fff" w={2.5} /> : s}
          </div>
          {s < 3 && (
            <div style={{ flex: 1, height: 2, margin: "0 4px", transition: "background .3s",
              background: step > s ? "var(--primary)" : "var(--border)" }} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="auth-page">

      {/* Logo */}
      <div className="auth-logo">
        <div className="auth-logo-icon"><IWrench size={18} color="#fff" /></div>
        <span className="auth-logo-name">NepalKarigar</span>
      </div>

      {/* Card */}
      <div className="auth-card fu">
        <Steps />

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <>
            <h1 className="auth-title">Forgot password?</h1>
            <p className="auth-sub">Enter the phone number or email on your account.</p>

            {error && (
              <div className="alert alert-err" style={{ marginBottom: 16 }}>
                <IAlertCirc size={15} style={{ flexShrink: 0, marginTop: 1 }} /><span>{error}</span>
              </div>
            )}

            <div className="form-stack">
              <div>
                <label className="lbl">Phone number or email address</label>
                <div className="input-wrap">
                  <span className="input-icon-l"><IPhone size={15} /></span>
                  <input type="text" className="field pl"
                    placeholder="98XXXXXXXX  or  you@email.com"
                    value={identifier}
                    onChange={e => { setId(e.target.value); setErr(""); }}
                    onKeyDown={e => e.key === "Enter" && sendToken()}
                  />
                </div>
              </div>
              <button className="btn btn-primary btn-lg btn-full" onClick={sendToken} disabled={loading}>
                {loading ? <><div className="spin" />Sending…</> : "Send Reset Token"}
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <>
            <h1 className="auth-title">Create new password</h1>
            <p className="auth-sub">
              {token ? "Your reset token is shown below." : "Paste your reset token, then choose a new password."}
            </p>

            {/* Token box (shown when API returned token) */}
            {token && (
              <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-s)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 4 }}>
                    <IKey size={11} /> Reset Token
                  </span>
                  <button onClick={copyToken} className="btn btn-outline btn-sm"
                    style={{ fontSize: 12, color: copied ? "#16A34A" : undefined, borderColor: copied ? "#BBF7D0" : undefined, background: copied ? "#F0FDF4" : undefined }}>
                    {copied ? <><ICheck size={12} color="#16A34A" />Copied</> : <><ICopy size={12} />Copy</>}
                  </button>
                </div>
                <code style={{ fontSize: 11, color: "var(--primary)", wordBreak: "break-all", lineHeight: 1.6, display: "block" }}>{token}</code>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 7, fontSize: 11, color: "var(--text-p)" }}>
                  <IClock size={11} /> Expires in 1 hour
                </div>
              </div>
            )}

            {error && (
              <div className="alert alert-err" style={{ marginBottom: 16 }}>
                <IAlertCirc size={15} style={{ flexShrink: 0, marginTop: 1 }} /><span>{error}</span>
              </div>
            )}

            <div className="form-stack">

              {/* Paste token (only if API didn't return one) */}
              {!token && (
                <div>
                  <label className="lbl">Reset Token</label>
                  <div className="input-wrap">
                    <span className="input-icon-l"><IKey size={15} /></span>
                    <input type="text" className="field pl"
                      placeholder="Paste token here"
                      value={tokenPaste}
                      onChange={e => { setTPaste(e.target.value); setErr(""); }}
                      style={{ fontFamily: "monospace", fontSize: 12 }}
                    />
                  </div>
                </div>
              )}

              {/* New password */}
              <div>
                <label className="lbl">New Password</label>
                <div className="input-wrap">
                  <span className="input-icon-l"><ILock size={15} /></span>
                  <input type={showPw ? "text" : "password"} className="field pl pr"
                    placeholder="Minimum 8 characters"
                    value={pw.new_password}
                    onChange={e => { setPw(p => ({ ...p, new_password: e.target.value })); setErr(""); }}
                  />
                  <button type="button" className="input-icon-r"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-p)" }}
                    onClick={() => setShowPw(s => !s)}>
                    {showPw ? <IEyeOff size={15} /> : <IEye size={15} />}
                  </button>
                </div>
                {pw.new_password && (
                  <>
                    <div className="pw-bars">
                      {[1,2,3,4].map(i => <div key={i} className="pw-bar" style={{ background: str >= i ? strClr : undefined }} />)}
                    </div>
                    <p className="pw-hint" style={{ color: strClr }}>{strTxt} password</p>
                  </>
                )}
              </div>

              {/* Confirm */}
              <div>
                <label className="lbl">Confirm New Password</label>
                <div className="input-wrap">
                  <span className="input-icon-l"><ILock size={15} /></span>
                  <input type="password" className="field pl pr"
                    placeholder="Re-enter new password"
                    value={pw.confirm_password}
                    onChange={e => { setPw(p => ({ ...p, confirm_password: e.target.value })); setErr(""); }}
                  />
                  {pw.confirm_password && (
                    <span className="input-icon-r">
                      {pw.new_password === pw.confirm_password
                        ? <ICheckCirc size={15} color="#16A34A" />
                        : <IAlertCirc size={15} color="#DC2626" />
                      }
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                <button className="btn btn-outline btn-md"
                  onClick={() => { setStep(1); setErr(""); setPw({ new_password:"", confirm_password:"" }); setToken(""); setTPaste(""); }}>
                  Back
                </button>
                <button className="btn btn-primary btn-md" style={{ flex: 1 }} onClick={setNewPw} disabled={loading}>
                  {loading ? <><div className="spin" />Updating…</> : "Set New Password"}
                </button>
              </div>

            </div>
          </>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--primary-bg)", border: "2px solid var(--primary-bd)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <ICheckCirc size={28} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-h)", marginBottom: 8 }}>Password updated!</h2>
            <p style={{ fontSize: 13, color: "var(--text-s)", marginBottom: 22 }}>
              Your password has been changed. You can now sign in.
            </p>
            <Link to="/login" className="btn btn-primary btn-lg btn-full" style={{ textDecoration: "none" }}>
              Go to Sign In
            </Link>
          </div>
        )}

      </div>

      <p style={{ marginTop: 18, fontSize: 13 }}>
        <Link to="/login" style={{ color: "var(--text-s)", textDecoration: "none" }}>← Back to Sign In</Link>
      </p>
    </div>
  );
}