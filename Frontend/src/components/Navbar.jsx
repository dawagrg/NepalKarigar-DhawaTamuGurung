import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const dropRef   = useRef();
  const [user, setUser]         = useState(null);
  const [role, setRole]         = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    setUser(localStorage.getItem("username"));
    setRole(localStorage.getItem("role"));
  }, [location]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const fn = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const logout = () => {
    ["access_token","refresh_token","username","user_id","role"].forEach(k => localStorage.removeItem(k));
    setUser(null); setRole(null); setOpen(false);
    navigate("/login");
  };

  const isKarigar  = role === "karigar";
  const accentColor = isKarigar ? "#E11D48" : "#4F46E5";
  const accentBg    = isKarigar ? "#FFF1F2" : "#EEF2FF";
  const accentBdr   = isKarigar ? "#FECDD3" : "#C7D2FE";
  const roleLabel   = isKarigar ? "🔧 Karigar" : "🏠 Customer";
  const avatarGrad  = isKarigar
    ? "linear-gradient(135deg, #E11D48, #9F1239)"
    : "linear-gradient(135deg, #4F46E5, #7C3AED)";

  return (
    <nav className={`nk-nav${scrolled ? " scrolled" : ""}`}
      style={{ background: scrolled ? undefined : "rgba(255,255,255,0.9)", backdropFilter: !scrolled ? "blur(12px)" : undefined }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>

          {/* Logo */}
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, background: "linear-gradient(135deg, #4F46E5, #7C3AED)", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 13, color: "white", boxShadow: "0 4px 14px rgba(79,70,229,0.3)" }}>NK</div>
            <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 19, color: "#0F172A" }}>
              Nepal<span style={{ color: "#4F46E5" }}>Karigar</span>
            </span>
          </Link>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {user ? (
              <div ref={dropRef} style={{ position: "relative" }}>

                {/* Avatar trigger */}
                <button onClick={() => setOpen(!open)} style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "6px 12px 6px 7px",
                  background: open ? "#F8FAFC" : "white",
                  border: `1.5px solid ${open ? "#C7D2FE" : "#E2E8F0"}`,
                  borderRadius: 100, cursor: "pointer", transition: "all 0.2s",
                  boxShadow: open ? "0 2px 12px rgba(79,70,229,0.12)" : "0 1px 4px rgba(0,0,0,0.05)",
                }}>
                  {/* Avatar circle */}
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: avatarGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white", fontFamily: "Syne, sans-serif" }}>
                    {user[0].toUpperCase()}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", lineHeight: 1.2 }}>{user}</span>
                    <span style={{ fontSize: 10, color: accentColor, fontWeight: 700, lineHeight: 1.2 }}>{roleLabel}</span>
                  </div>

                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: "#94A3B8", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                    <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* Dropdown */}
                {open && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 10px)", right: 0, minWidth: 220,
                    background: "white", border: "1.5px solid #E2E8F0", borderRadius: 16,
                    boxShadow: "0 16px 48px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.06)",
                    overflow: "hidden", animation: "dropIn 0.18s cubic-bezier(.16,1,.3,1)",
                  }}>
                    {/* User info */}
                    <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid #F1F5F9", background: "#FAFAFA" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>{user}</div>
                      <span className="pill" style={{ background: accentBg, color: accentColor, border: `1px solid ${accentBdr}`, fontSize: 11 }}>
                        {roleLabel}
                      </span>
                    </div>

                    {/* Links */}
                    <div style={{ padding: "6px 0" }}>
                      {[{ to: "/profile", icon: "👤", label: "My Profile" }].map(({ to, icon, label }) => (
                        <Link key={to} to={to} onClick={() => setOpen(false)} style={{
                          display: "flex", alignItems: "center", gap: 12, padding: "11px 18px",
                          textDecoration: "none", color: "#334155", fontSize: 14, fontWeight: 500,
                          transition: "background 0.15s",
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <span style={{ fontSize: 16 }}>{icon}</span> {label}
                        </Link>
                      ))}
                    </div>

                    <div style={{ height: 1, background: "#F1F5F9" }} />

                    <div style={{ padding: "6px 0" }}>
                      <button onClick={logout} style={{
                        display: "flex", alignItems: "center", gap: 12, width: "100%",
                        padding: "11px 18px", background: "none", border: "none",
                        color: "#E11D48", fontSize: 14, fontWeight: 600, cursor: "pointer",
                        fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "background 0.15s",
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = "#FFF1F2"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}>
                        <span style={{ fontSize: 16 }}>🚪</span> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Link to="/login" style={{ padding: "9px 18px", color: "#475569", fontSize: 14, fontWeight: 600, textDecoration: "none", borderRadius: 10, transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#4F46E5"}
                  onMouseLeave={e => e.currentTarget.style.color = "#475569"}>
                  Sign In
                </Link>
                <Link to="/register" style={{
                  padding: "9px 22px", background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                  borderRadius: 10, color: "white", fontSize: 14, fontWeight: 700, textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(79,70,229,0.32)", transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(79,70,229,0.42)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(79,70,229,0.32)"; }}>
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes dropIn{from{opacity:0;transform:translateY(-8px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
    </nav>
  );
}