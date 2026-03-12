import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { IWrench, IUser, IChevDown, ILogOut, ISettings, ICalendar } from "./Icons";
import { getProfile } from "../services/api";

const MEDIA_BASE = "http://127.0.0.1:8000";

// Build full image URL from whatever the API returns
function buildImageUrl(raw) {
  if (!raw) return null;
  if (raw.startsWith("http")) return raw;
  return `${MEDIA_BASE}${raw.startsWith("/") ? raw : "/media/" + raw}`;
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropRef  = useRef();

  const [user,   setUser]   = useState(null);
  const [role,   setRole]   = useState(null);
  const [avatar, setAvatar] = useState(null); // profile image URL
  const [initials, setInitials] = useState("U");
  const [open,   setOpen]   = useState(false);

  // Fetch profile and cache image URL in localStorage
  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    const uname = localStorage.getItem("username");
    if (!token || !uname) { setUser(null); setRole(null); setAvatar(null); return; }

    setUser(uname);
    setRole(localStorage.getItem("role"));

    // Use cached image first for instant display
    const cached = localStorage.getItem("profile_image");
    if (cached) setAvatar(cached);

    // Then fetch fresh from API
    try {
      const res = await getProfile();
      const d   = res.data;
      const url = buildImageUrl(d.profile_image);
      setAvatar(url);
      // Cache it so next page load is instant
      if (url) localStorage.setItem("profile_image", url);
      else      localStorage.removeItem("profile_image");
      // Update initials in case name changed
      const letter = (d.first_name?.[0] || d.username?.[0] || "U").toUpperCase();
      setInitials(letter);
      if (d.role) { setRole(d.role); localStorage.setItem("role", d.role); }
    } catch {
      // token may be expired — keep cached data, don't redirect here
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [location.pathname]); // re-run every time page changes (catches post-upload navigation)

  useEffect(() => {
    const fn = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Listen for a custom event fired by Profile.jsx after a successful photo save
  useEffect(() => {
    const handler = () => loadProfile();
    window.addEventListener("profile-updated", handler);
    return () => window.removeEventListener("profile-updated", handler);
  }, [loadProfile]);

  const logout = () => {
    ["access_token","refresh_token","username","user_id","role","profile_image"]
      .forEach(k => localStorage.removeItem(k));
    setUser(null); setRole(null); setAvatar(null); setOpen(false);
    navigate("/login");
  };

  const roleLabel = role === "karigar" ? "Karigar" : "Customer";

  // Avatar circle — shows photo if available, otherwise coloured initial
  const AvatarCircle = ({ size = 26, fontSize = 12 }) => (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
      background: avatar ? "transparent" : "var(--primary-bg)",
      border: avatar ? "1.5px solid var(--primary-bd)" : "none",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {avatar
        ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setAvatar(null)} />
        : <IUser size={Math.round(size * 0.55)} color="var(--primary)" />
      }
    </div>
  );

  const navLink = (to, label) => (
    <Link key={to} to={to} style={{
      textDecoration: "none", fontSize: 13, fontWeight: 600,
      color: location.pathname === to ? "var(--primary)" : "var(--text-s)",
      borderBottom: location.pathname === to ? "2px solid var(--primary)" : "2px solid transparent",
      padding: "4px 2px", transition: "color .15s",
    }}
    onMouseEnter={e => { if(location.pathname!==to) e.currentTarget.style.color="var(--text-h)"; }}
    onMouseLeave={e => { if(location.pathname!==to) e.currentTarget.style.color="var(--text-s)"; }}
    >{label}</Link>
  );

  return (
    <nav className="nk-nav">
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, background: "var(--primary)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IWrench size={16} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text-h)" }}>NepalKarigar</span>
        </Link>

        {/* Centre nav links */}
        <div style={{ display: "flex", gap: 20, alignItems: "center", flex: 1, paddingLeft: 24 }}>
          {navLink("/services", "Services")}
          {navLink("/search", "Find Karigar")}
          {user && role === "karigar" && navLink("/karigar-dashboard", "My Dashboard")}
        </div>

        {/* Right side */}
        {user ? (
          <div ref={dropRef} style={{ position: "relative" }}>
            <button
              onClick={() => setOpen(o => !o)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 10px 5px 7px", background: "#fff", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)"}
              onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = "var(--border)"; }}>
              <AvatarCircle size={28} />
              <div style={{ lineHeight: 1.25, textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-h)" }}>{user}</div>
                <div style={{ fontSize: 11, color: "var(--primary)", fontWeight: 500 }}>{roleLabel}</div>
              </div>
              <IChevDown size={13} color="var(--text-p)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>

            {open && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, minWidth: 196, background: "#fff", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 6px 20px rgba(0,0,0,0.1)", overflow: "hidden" }}>
                {/* Dropdown header with larger avatar */}
                <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 10 }}>
                  <AvatarCircle size={36} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-h)" }}>{user}</div>
                    <div style={{ fontSize: 11, color: "var(--primary)", fontWeight: 500, marginTop: 1 }}>{roleLabel}</div>
                  </div>
                </div>
                <Link to="/profile" onClick={() => setOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 14px", textDecoration: "none", color: "var(--text-b)", fontSize: 13, fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-subtle)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <ISettings size={14} color="var(--text-s)" /> My Profile
                </Link>
                {role === "karigar" && (
                  <Link to="/karigar-dashboard" onClick={() => setOpen(false)}
                    style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 14px", textDecoration: "none", color: "var(--text-b)", fontSize: 13, fontWeight: 500 }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-subtle)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <IWrench size={14} color="var(--text-s)" /> My Dashboard
                  </Link>
                )}
                <Link to="/my-bookings" onClick={() => setOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 14px", textDecoration: "none", color: "var(--text-b)", fontSize: 13, fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-subtle)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <ICalendar size={14} color="var(--text-s)" /> My Bookings
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