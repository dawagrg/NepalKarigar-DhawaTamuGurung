import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IUser, ILock, IEye, IEyeOff, IAlertCirc, IWrench } from "./Icons";
import { loginUser } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setId]  = useState("");
  const [password,   setPw]  = useState("");
  const [showPw,     setShow] = useState(false);
  const [error,      setErr]  = useState("");
  const [loading,    setLoad] = useState(false);

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
      localStorage.setItem("role",          d.role || "customer");
      navigate("/");
    } catch (err) {
      setErr(err.response?.data?.error || "Incorrect phone/email or password.");
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