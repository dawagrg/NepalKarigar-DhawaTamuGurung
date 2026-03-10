import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { IKey, ILock, IEye, IEyeOff, ICheckCirc, IAlertCirc, IWrench } from "./Icons";
import { resetPassword } from "../services/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm]   = useState({ reset_token: location.state?.token || "", new_password: "", confirm_password: "" });
  const [showPw, setShow] = useState(false);
  const [loading, setLoad]= useState(false);
  const [error,   setErr] = useState("");
  const [done,    setDone]= useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErr(""); };

  const submit = async () => {
    if (!form.reset_token)                              { setErr("Reset token is required."); return; }
    if (!form.new_password || !form.confirm_password)   { setErr("Please fill in both password fields."); return; }
    if (form.new_password !== form.confirm_password)     { setErr("Passwords do not match."); return; }
    if (form.new_password.length < 8)                   { setErr("Password must be at least 8 characters."); return; }
    setLoad(true);
    try {
      await resetPassword(form);
      setDone(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (e) {
      setErr(e.response?.data?.error || "Invalid or expired token.");
    } finally { setLoad(false); }
  };

  const len    = form.new_password.length;
  const str    = len === 0 ? 0 : len < 6 ? 1 : len < 10 ? 2 : len < 14 ? 3 : 4;
  const strClr = ["","#DC2626","#D97706","#16A34A","#2563EB"][str];
  const strTxt = ["","Weak","Fair","Good","Strong"][str];

  return (
    <div className="auth-page">
      <div className="auth-logo">
        <div className="auth-logo-icon"><IWrench size={18} color="#fff" /></div>
        <span className="auth-logo-name">NepalKarigar</span>
      </div>

      <div className="auth-card fu">
        {!done ? (
          <>
            <h1 className="auth-title">Set new password</h1>
            <p className="auth-sub">Enter your reset token and choose a new password.</p>

            {error && (
              <div className="alert alert-err" style={{ marginBottom: 16 }}>
                <IAlertCirc size={15} style={{ flexShrink: 0, marginTop: 1 }} /><span>{error}</span>
              </div>
            )}

            <div className="form-stack">
              <div>
                <label className="lbl">Reset Token</label>
                <div className="input-wrap">
                  <span className="input-icon-l"><IKey size={15} /></span>
                  <input type="text" className="field pl"
                    placeholder="Paste your reset token"
                    value={form.reset_token}
                    onChange={e => set("reset_token", e.target.value)}
                    style={{ fontFamily: "monospace", fontSize: 12 }}
                  />
                </div>
              </div>

              <div>
                <label className="lbl">New Password</label>
                <div className="input-wrap">
                  <span className="input-icon-l"><ILock size={15} /></span>
                  <input type={showPw ? "text" : "password"} className="field pl pr"
                    placeholder="Minimum 8 characters"
                    value={form.new_password}
                    onChange={e => set("new_password", e.target.value)}
                  />
                  <button type="button" className="input-icon-r"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-p)" }}
                    onClick={() => setShow(s => !s)}>
                    {showPw ? <IEyeOff size={15} /> : <IEye size={15} />}
                  </button>
                </div>
                {form.new_password && (
                  <>
                    <div className="pw-bars">
                      {[1,2,3,4].map(i => <div key={i} className="pw-bar" style={{ background: str >= i ? strClr : undefined }} />)}
                    </div>
                    <p className="pw-hint" style={{ color: strClr }}>{strTxt} password</p>
                  </>
                )}
              </div>

              <div>
                <label className="lbl">Confirm Password</label>
                <div className="input-wrap">
                  <span className="input-icon-l"><ILock size={15} /></span>
                  <input type="password" className="field pl pr"
                    placeholder="Re-enter password"
                    value={form.confirm_password}
                    onChange={e => set("confirm_password", e.target.value)}
                  />
                  {form.confirm_password && (
                    <span className="input-icon-r">
                      {form.new_password === form.confirm_password
                        ? <ICheckCirc size={15} color="#16A34A" />
                        : <IAlertCirc size={15} color="#DC2626" />
                      }
                    </span>
                  )}
                </div>
              </div>

              <button className="btn btn-primary btn-lg btn-full" onClick={submit} disabled={loading} style={{ marginTop: 2 }}>
                {loading ? <><div className="spin" />Updating…</> : "Set New Password"}
              </button>

              <p style={{ textAlign: "center", fontSize: 13 }}>
                <Link to="/forgot-password" style={{ color: "var(--text-s)", textDecoration: "none" }}>Request a new token</Link>
              </p>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--primary-bg)", border: "2px solid var(--primary-bd)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <ICheckCirc size={28} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-h)", marginBottom: 8 }}>Password updated!</h2>
            <p style={{ fontSize: 13, color: "var(--text-s)" }}>Redirecting to sign in…</p>
          </div>
        )}
      </div>

      <p style={{ marginTop: 18, fontSize: 13 }}>
        <Link to="/login" style={{ color: "var(--text-s)", textDecoration: "none" }}>← Back to Sign In</Link>
      </p>
    </div>
  );
}