import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IUser, ILock, IEye, IEyeOff, IAlertCirc, IWrench } from "../components/Icons";
import { loginUser } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setId]  = useState("");
  const [password,   setPw]  = useState("");
  const [showPw,     setShow] = useState(false);
  const [error,      setErr]  = useState("");
  const [loading,    setLoad] = useState(false);
  const [banInfo,    setBan]  = useState(null);  // { reason, date }

  const submit = async () => {
    if (!identifier.trim()) { setErr("Please enter your phone number or email."); return; }
    if (!password)          { setErr("Please enter your password."); return; }
    setLoad(true); setErr("");
    try {
      const res = await loginUser({ username: identifier.trim(), password });
      const d   = res.data;
      localStorage.setItem("access_token",  d.access);
      localStorage.setItem("refresh_token", d.refresh);
      localStorage.setItem("username",      d.username);
      localStorage.setItem("user_id",       d.user_id);
      // Staff/superusers get role "admin"
      const effectiveRole = (d.is_staff || d.role === "admin") ? "admin" : (d.role || "customer");
      localStorage.setItem("role",          effectiveRole);
      localStorage.setItem("is_staff",      d.is_staff ? "true" : "false");
      navigate("/");
    } catch (err) {
      const d = err.response?.data;
      if (d?.error === "banned") {
        setBan({ reason: d.ban_reason, date: d.ban_date });
        setErr("");
      } else {
        setErr(d?.message || d?.error || "Incorrect phone/email or password.");
      }
    } finally { setLoad(false); }
  };

  return (
    <div className="auth-page">

      {/* Logo */}
      <div className="auth-logo">
        <div className="auth-logo-icon">
          <IWrench size={18} color="#fff" />
        </div>
        <span className="auth-logo-name">NepalKarigar</span>
      </div>

      {/* Card */}
      <div className="auth-card fu">
        <h1 className="auth-title">Sign in</h1>
        <p className="auth-sub">
          Don't have an account?{" "}
          <Link to="/register" className="auth-link">Create one</Link>
        </p>

        {/* Ban notice */}
        {banInfo && (
          <div style={{ marginBottom:16, padding:"16px", background:"#FEF2F2",
            border:"1.5px solid #FECACA", borderRadius:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <IAlertCirc size={18} color="#DC2626"/>
              <span style={{ fontSize:14, fontWeight:800, color:"#DC2626" }}>
                Account Banned
              </span>
            </div>
            <p style={{ fontSize:13, color:"#991B1B", marginBottom:6, lineHeight:1.6 }}>
              Your account has been suspended by the administrator.
            </p>
            <div style={{ background:"#FEE2E2", borderRadius:7, padding:"10px 12px",
              fontSize:13, color:"#7F1D1D", lineHeight:1.6 }}>
              <strong>Reason:</strong> {banInfo.reason}
            </div>
            {banInfo.date && (
              <p style={{ fontSize:11, color:"#DC2626", marginTop:6 }}>
                Banned on: {banInfo.date}
              </p>
            )}
            <p style={{ fontSize:12, color:"#991B1B", marginTop:8 }}>
              Contact <strong>support@nepalkarigar.com.np</strong> to appeal.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-err" style={{ marginBottom: 16 }}>
            <IAlertCirc size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <div className="form-stack">

          {/* Phone or email */}
          <div>
            <label className="lbl">Phone number or email address</label>
            <div className="input-wrap">
              <span className="input-icon-l"><IUser size={15} /></span>
              <input
                type="text"
                className="field pl"
                placeholder="98XXXXXXXX  or  you@email.com"
                value={identifier}
                onChange={e => { setId(e.target.value); setErr(""); }}
                onKeyDown={e => e.key === "Enter" && submit()}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <label className="lbl" style={{ margin: 0 }}>Password</label>
              <Link to="/forgot-password" className="auth-link" style={{ fontSize: 12, fontWeight: 500 }}>
                Forgot password?
              </Link>
            </div>
            <div className="input-wrap">
              <span className="input-icon-l"><ILock size={15} /></span>
              <input
                type={showPw ? "text" : "password"}
                className="field pl pr"
                placeholder="Enter your password"
                value={password}
                onChange={e => { setPw(e.target.value); setErr(""); }}
                onKeyDown={e => e.key === "Enter" && submit()}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-icon-r"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-p)" }}
                onClick={() => setShow(s => !s)}
              >
                {showPw ? <IEyeOff size={15} /> : <IEye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            className="btn btn-primary btn-lg btn-full"
            onClick={submit}
            disabled={loading}
            style={{ marginTop: 2 }}
          >
            {loading ? <><div className="spin" />Signing in…</> : "Sign In"}
          </button>

        </div>
      </div>

      {/* Footer note */}
      <p style={{ marginTop: 18, fontSize: 12, color: "var(--text-p)", textAlign: "center" }}>
        By signing in you agree to our Terms of Service and Privacy Policy.
      </p>

    </div>
  );
}