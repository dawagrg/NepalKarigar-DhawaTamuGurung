import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IUser, IPhone, IMail, ILock, IEye, IEyeOff, IAlertCirc, ICheckCirc, IWrench } from "../components/Icons";
import { registerUser } from "../services/api";
import { isValidNepalPhone, passwordStrength, PW_STRENGTH_COLOR, PW_STRENGTH_LABEL } from "../utils";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name:   "",
    last_name:    "",
    phone_number: "",
    email:        "",
    role:         "",
    password:     "",
    confirm:      "",
  });
  const [showPw,  setShowPw]  = useState(false);
  const [showCf,  setShowCf]  = useState(false);
  const [error,   setErr]     = useState("");
  const [loading, setLoad]    = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErr(""); };

  const validate = () => {
    if (!form.first_name.trim())   return "First name is required.";
    if (!form.last_name.trim())    return "Last name is required.";
    if (!form.phone_number.trim()) return "Phone number is required.";
    if (!isValidNepalPhone(form.phone_number)) return "Enter a valid Nepal phone number (e.g. 98XXXXXXXX).";
    if (!form.email.trim())        return "Email address is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email address.";
    if (!form.role)                return "Please select a role.";
    if (!form.password)            return "Password is required.";
    if (form.password.length < 8)  return "Password must be at least 8 characters.";
    if (form.password !== form.confirm) return "Passwords do not match.";
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) { setErr(err); return; }
    setLoad(true); setErr("");
    try {
      // auto-generate a username from email prefix + last 4 digits of phone
      const emailPrefix = form.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");
      const suffix      = form.phone_number.replace(/\D/g, "").slice(-4);
      const username    = `${emailPrefix}_${suffix}`;

      const payload = {
        first_name:   form.first_name.trim(),
        last_name:    form.last_name.trim(),
        username,
        phone_number: form.phone_number.trim(),
        email:        form.email.trim(),
        role:         form.role,
        password:     form.password,
      };
      const res = await registerUser(payload);
      const d   = res.data;
      localStorage.setItem("access_token",  d.access);
      localStorage.setItem("refresh_token", d.refresh);
      localStorage.setItem("username",      d.username);
      localStorage.setItem("user_id",       d.user_id);
      localStorage.setItem("role",          d.role);
      navigate("/");
    } catch (err) {
      const data = err.response?.data;
      const raw  = data?.error
        || data?.username?.[0]
        || data?.phone_number?.[0]
        || data?.email?.[0]
        || (data && Object.values(data)[0])
        || "Registration failed. Please try again.";
      setErr(Array.isArray(raw) ? raw[0] : raw);
    } finally { setLoad(false); }
  };

  /* password strength */
  const str    = passwordStrength(form.password);
  const strClr = PW_STRENGTH_COLOR[str];
  const strTxt = PW_STRENGTH_LABEL[str];

  return (
    <div className="auth-page">

      {/* Logo — identical to Login */}
      <div className="auth-logo">
        <div className="auth-logo-icon">
          <IWrench size={18} color="#fff" />
        </div>
        <span className="auth-logo-name">NepalKarigar</span>
      </div>

      {/* Card — same class, wider variant */}
      <div className="auth-card auth-card-wide fu">
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-sub">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>

        {/* Error */}
        {error && (
          <div className="alert alert-err" style={{ marginBottom: 16 }}>
            <IAlertCirc size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <div className="form-stack">

          {/* Name row */}
          <div className="form-row">

            {/* First name */}
            <div>
              <label className="lbl">First Name</label>
              <div className="input-wrap">
                <span className="input-icon-l"><IUser size={15} /></span>
                <input
                  type="text"
                  className="field pl"
                  placeholder="John"
                  value={form.first_name}
                  onChange={e => set("first_name", e.target.value)}
                  autoComplete="given-name"
                />
              </div>
            </div>

            {/* Last name */}
            <div>
              <label className="lbl">Last Name</label>
              <input
                type="text"
                className="field"
                placeholder="Doe"
                value={form.last_name}
                onChange={e => set("last_name", e.target.value)}
                autoComplete="family-name"
              />
            </div>

          </div>

          {/* Phone */}
          <div>
            <label className="lbl">Phone Number</label>
            <div className="input-wrap">
              <span className="input-icon-l"><IPhone size={15} /></span>
              <input
                type="tel"
                className="field pl"
                placeholder="98XXXXXXXX"
                value={form.phone_number}
                onChange={e => set("phone_number", e.target.value)}
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Phone hint */}
          {form.phone_number && !isValidNepalPhone(form.phone_number) && (
            <p style={{ fontSize:11, color:"#DC2626", marginTop:-8, marginBottom:4, display:"flex", alignItems:"center", gap:4 }}>
              ⚠ Enter a valid Nepal number (97/98/96XXXXXXXX)
            </p>
          )}

          {/* Email */}
          <div>
            <label className="lbl">Email Address</label>
            <div className="input-wrap">
              <span className="input-icon-l"><IMail size={15} /></span>
              <input
                type="email"
                className="field pl"
                placeholder="you@email.com"
                value={form.email}
                onChange={e => set("email", e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="lbl">I am a</label>
            <select
              className="field"
              value={form.role}
              onChange={e => set("role", e.target.value)}
              style={{ color: form.role ? "var(--text-h)" : "var(--text-p)" }}
            >
              <option value="" disabled>Select your role…</option>
              <option value="customer">Customer — I want to hire workers</option>
              <option value="karigar">Worker — I want to offer my skills</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="lbl">Password</label>
            <div className="input-wrap">
              <span className="input-icon-l"><ILock size={15} /></span>
              <input
                type={showPw ? "text" : "password"}
                className="field pl pr"
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={e => set("password", e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="input-icon-r"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-p)" }}
                onClick={() => setShowPw(s => !s)}
              >
                {showPw ? <IEyeOff size={15} /> : <IEye size={15} />}
              </button>
            </div>
            {form.password && (
              <>
                <div className="pw-bars">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="pw-bar" style={{ background: str >= i ? strClr : undefined }} />
                  ))}
                </div>
                <p className="pw-hint" style={{ color: strClr }}>{strTxt} password</p>
              </>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="lbl">Confirm Password</label>
            <div className="input-wrap">
              <span className="input-icon-l"><ILock size={15} /></span>
              <input
                type={showCf ? "text" : "password"}
                className="field pl pr"
                placeholder="Re-enter your password"
                value={form.confirm}
                onChange={e => set("confirm", e.target.value)}
                autoComplete="new-password"
              />
              <span className="input-icon-r">
                {form.confirm && (
                  form.password === form.confirm
                    ? <ICheckCirc size={15} color="#16A34A" />
                    : <IAlertCirc size={15} color="#DC2626" />
                )}
                <button
                  type="button"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-p)", display: "flex" }}
                  onClick={() => setShowCf(s => !s)}
                >
                  {showCf ? <IEyeOff size={15} /> : <IEye size={15} />}
                </button>
              </span>
            </div>
          </div>

          {/* Submit — same class as Login button */}
          <button
            className="btn btn-primary btn-lg btn-full"
            onClick={submit}
            disabled={loading}
            style={{ marginTop: 2 }}
          >
            {loading ? <><div className="spin" />Creating account…</> : "Create Account"}
          </button>

        </div>
      </div>

      {/* Footer note */}
      <p style={{ marginTop: 18, fontSize: 12, color: "var(--text-p)", textAlign: "center" }}>
        By registering you agree to our Terms of Service and Privacy Policy.
      </p>

    </div>
  );
}