import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { IWrench, IUser, IChevDown, ILogOut, ISettings } from "./Icons";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropRef  = useRef();
  const [user, setUser]   = useState(null);
  const [role, setRole]   = useState(null);
  const [open, setOpen]   = useState(false);

  useEffect(() => {
    setUser(localStorage.getItem("username"));
    setRole(localStorage.getItem("role"));
  }, [location]);

  useEffect(() => {
    const fn = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const logout = () => {
    ["access_token","refresh_token","username","user_id","role"].forEach(k => localStorage.removeItem(k));
    setUser(null); setRole(null); setOpen(false);
    navigate("/login");
  };

  const roleLabel = role === "karigar" ? "Worker" : "Customer";

  return (
    <nav className="nk-nav">
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, background: "var(--primary)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IWrench size={16} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text-h)" }}>NepalKarigar</span>
        </Link>

        {/* Right side */}
        {user ? (
          <div ref={dropRef} style={{ position: "relative" }}>
            <button
              onClick={() => setOpen(o => !o)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 10px 5px 7px", background: "#fff", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)"}
              onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = "var(--border)"; }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--primary-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IUser size={14} color="var(--primary)" />
              </div>
              <div style={{ lineHeight: 1.25, textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-h)" }}>{user}</div>
                <div style={{ fontSize: 11, color: "var(--primary)", fontWeight: 500 }}>{roleLabel}</div>
              </div>
              <IChevDown size={13} color="var(--text-p)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>

            {open && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, minWidth: 176, background: "#fff", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 6px 20px rgba(0,0,0,0.1)", overflow: "hidden" }}>
                <div style={{ padding: "11px 14px 8px", borderBottom: "1px solid #F3F4F6" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-h)" }}>{user}</div>
                  <div style={{ fontSize: 12, color: "var(--text-s)", marginTop: 1 }}>{roleLabel}</div>
                </div>
                <Link to="/profile" onClick={() => setOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 14px", textDecoration: "none", color: "var(--text-b)", fontSize: 13, fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-subtle)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <ISettings size={14} color="var(--text-s)" /> My Profile
                </Link>
                <div style={{ height: 1, background: "#F3F4F6" }} />
                <button onClick={logout}
                  style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 14px", background: "none", border: "none", color: "var(--danger)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--danger-bg)"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}>
                  <ILogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <Link to="/login"    className="btn btn-outline btn-sm" style={{ textDecoration: "none" }}>Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>Register</Link>
          </div>
        )}

      </div>
    </nav>
  );
}