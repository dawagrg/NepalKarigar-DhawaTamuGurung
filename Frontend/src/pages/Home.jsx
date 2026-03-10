import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const SKILLS = [
  { icon: "🔧", name: "Plumber",     count: "120+", color: "#0EA5E9", bg: "#F0F9FF" },
  { icon: "⚡", name: "Electrician", count: "95+",  color: "#D97706", bg: "#FFFBEB" },
  { icon: "🏗️", name: "Mason",       count: "200+", color: "#059669", bg: "#F0FDF4" },
  { icon: "🎨", name: "Painter",     count: "80+",  color: "#7C3AED", bg: "#F5F3FF" },
  { icon: "🪚", name: "Carpenter",   count: "140+", color: "#0D9488", bg: "#F0FDFA" },
  { icon: "🔩", name: "Mechanic",    count: "60+",  color: "#4F46E5", bg: "#EEF2FF" },
  { icon: "🍳", name: "Cook",        count: "75+",  color: "#E11D48", bg: "#FFF1F2" },
  { icon: "🌿", name: "Gardener",    count: "50+",  color: "#059669", bg: "#F0FDF4" },
];

const FEATURES = [
  { icon: "✓",  title: "Verified Professionals", desc: "Every karigar is background-checked and verified. Your safety comes first.", color: "#4F46E5", bg: "#EEF2FF" },
  { icon: "⚡", title: "Book in Minutes",        desc: "Find and book skilled workers for your job instantly, any time of day.", color: "#059669", bg: "#F0FDF4" },
  { icon: "★",  title: "Real Reviews",           desc: "Transparent ratings from genuine customers help you hire with confidence.", color: "#D97706", bg: "#FFFBEB" },
  { icon: "🛡", title: "Secure Payments",        desc: "Pay safely. Funds are released only after you confirm job completion.", color: "#0D9488", bg: "#F0FDFA" },
];

const HOW = [
  { n: "01", title: "Choose a Category",   desc: "Browse plumbers, electricians, carpenters and more.",         color: "#4F46E5" },
  { n: "02", title: "Pick Your Karigar",   desc: "Read reviews, compare prices and choose the best fit.",       color: "#7C3AED" },
  { n: "03", title: "Book & Get it Done",  desc: "Confirm your slot, the karigar arrives and completes the job.", color: "#059669" },
];

const STATS = [
  { value: "12,000+", label: "Verified Karigar",   color: "#4F46E5" },
  { value: "50,000+", label: "Jobs Completed",      color: "#059669" },
  { value: "77",      label: "Districts Covered",   color: "#0EA5E9" },
  { value: "4.9★",    label: "Average Rating",       color: "#D97706" },
];

export default function Home() {
  const [user]  = useState(() => localStorage.getItem("username"));
  const [role]  = useState(() => localStorage.getItem("role"));
  const [hover, setHover] = useState(null);

  return (
    <div style={{ background: "white", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#0F172A" }}>

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", background: "white", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 24px 80px", position: "relative", overflow: "hidden" }}>
        {/* Soft blobs */}
        <div className="blob" style={{ width: 600, height: 600, background: "rgba(79,70,229,0.07)", top: -80, right: -80 }} />
        <div className="blob" style={{ width: 400, height: 400, background: "rgba(13,148,136,0.06)", bottom: -60, left: -60 }} />
        <div className="blob" style={{ width: 300, height: 300, background: "rgba(217,119,6,0.05)", top: "30%", left: "20%" }} />
        <div className="dot-bg" style={{ position: "absolute", inset: 0, opacity: 0.4 }} />

        <div style={{ maxWidth: 820, textAlign: "center", position: "relative" }}>
          {/* Badge */}
          <span className="fade-up d1 pill pill-indigo" style={{ fontSize: 13, marginBottom: 28, display: "inline-flex" }}>
            🇳🇵 Nepal's Most Trusted Karigar Platform
          </span>

          <h1 className="fade-up d2" style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(40px, 7vw, 76px)", lineHeight: 1.05, letterSpacing: "-2px", color: "#0F172A", marginBottom: 24 }}>
            Find skilled{" "}
            <span style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>karigar</span>
            <br />across Nepal.
          </h1>

          <p className="fade-up d3" style={{ fontSize: "clamp(16px, 2vw, 19px)", color: "#64748B", lineHeight: 1.75, maxWidth: 560, margin: "0 auto 44px" }}>
            Connect with verified plumbers, electricians, carpenters and more — in your area, at fair prices.
          </p>

          {/* CTA buttons */}
          <div className="fade-up d4" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 56 }}>
            <Link to={user ? "/" : "/register"} state={{ role: "customer" }} className="btn btn-primary" style={{ padding: "16px 36px", borderRadius: 14, fontSize: 16, textDecoration: "none", display: "inline-flex" }}>
              <span style={{ position: "relative", zIndex: 1 }}>🏠 Find a Karigar</span>
            </Link>
            <Link to={user ? "/" : "/register"} state={{ role: "karigar" }} style={{ padding: "15px 36px", borderRadius: 14, fontSize: 16, fontWeight: 700, textDecoration: "none", background: "white", border: "2px solid #E2E8F0", color: "#0F172A", display: "inline-flex", alignItems: "center", gap: 8, transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#4F46E5"; e.currentTarget.style.color = "#4F46E5"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.color = "#0F172A"; }}>
              🔧 Join as Karigar
            </Link>
          </div>

          {/* Stats row */}
          <div className="fade-up d5" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {STATS.map(({ value, label, color }) => (
              <div key={label} style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 14, padding: "14px 20px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", minWidth: 110 }}>
                <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 22, color }}>{value}</div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section style={{ padding: "96px 24px", background: "#F8FAFC" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span className="pill pill-teal" style={{ marginBottom: 16, display: "inline-flex" }}>Browse Services</span>
            <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 42px)", letterSpacing: "-1px", color: "#0F172A", marginBottom: 12 }}>
              What do you need help with?
            </h2>
            <p style={{ color: "#64748B", fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
              From quick fixes to major renovations — we have skilled workers for every job.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {SKILLS.map(({ icon, name, count, color, bg }) => (
              <button key={name} style={{ background: "white", border: `1px solid #E2E8F0`, borderRadius: 18, padding: "24px 20px", cursor: "pointer", textAlign: "left", transition: "all 0.25s", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${color}20`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 16 }}>{icon}</div>
                <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 16, color: "#0F172A", marginBottom: 4 }}>{name}</div>
                <div style={{ fontSize: 13, color, fontWeight: 600 }}>{count} workers</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "96px 24px", background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <span className="pill pill-amber" style={{ marginBottom: 16, display: "inline-flex" }}>Simple Process</span>
            <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 42px)", letterSpacing: "-1px", color: "#0F172A" }}>
              How it works
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28 }}>
            {HOW.map(({ n, title, desc, color }) => (
              <div key={n} className="card card-hover" style={{ padding: "32px 28px", borderRadius: 20 }}>
                <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 44, color: `${color}20`, marginBottom: 20, lineHeight: 1 }}>{n}</div>
                <div style={{ width: 48, height: 3, background: color, borderRadius: 2, marginBottom: 20 }} />
                <h3 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 20, color: "#0F172A", marginBottom: 10 }}>{title}</h3>
                <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.75 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "96px 24px", background: "#F8FAFC" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <span className="pill pill-green" style={{ marginBottom: 16, display: "inline-flex" }}>Why NepalKarigar</span>
            <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 42px)", letterSpacing: "-1px", color: "#0F172A" }}>
              Built for trust & reliability
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
            {FEATURES.map(({ icon, title, desc, color, bg }) => (
              <div key={title} className="card card-hover" style={{ padding: "30px 26px", borderRadius: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 20, color, fontWeight: 800 }}>{icon}</div>
                <h3 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 18, color: "#0F172A", marginBottom: 10 }}>{title}</h3>
                <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.75 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)", borderRadius: 28, padding: "64px 48px", textAlign: "center", position: "relative", overflow: "hidden", boxShadow: "0 20px 60px rgba(79,70,229,0.3)" }}>
            <div className="blob" style={{ width: 350, height: 350, background: "rgba(255,255,255,0.08)", top: -80, right: -60 }} />
            <div className="blob" style={{ width: 250, height: 250, background: "rgba(0,0,0,0.06)", bottom: -60, left: -40 }} />
            <div className="dot-bg" style={{ position: "absolute", inset: 0, opacity: 0.06 }} />
            <div style={{ position: "relative" }}>
              <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 44px)", color: "white", marginBottom: 16, letterSpacing: "-1px" }}>
                Ready to get started?
              </h2>
              <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 17, marginBottom: 40, lineHeight: 1.7 }}>
                Join thousands of customers and karigar already using NepalKarigar.
              </p>
              <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
                <Link to="/register" state={{ role: "customer" }} style={{ padding: "15px 32px", background: "white", borderRadius: 12, color: "#4F46E5", fontWeight: 700, fontSize: 15, textDecoration: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: 8 }}>
                  🏠 Find a Karigar
                </Link>
                <Link to="/register" state={{ role: "karigar" }} style={{ padding: "15px 32px", background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: 12, color: "white", fontWeight: 700, fontSize: 15, textDecoration: "none", transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: 8 }}>
                  🔧 Join as Karigar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #E2E8F0", background: "#F8FAFC", padding: "40px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #4F46E5, #7C3AED)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 12, color: "white" }}>NK</div>
            <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 17, color: "#0F172A" }}>Nepal<span style={{ color: "#4F46E5" }}>Karigar</span></span>
          </div>
          <p style={{ color: "#94A3B8", fontSize: 13 }}>© 2025 NepalKarigar. Built with ❤️ for Nepal.</p>
        </div>
      </footer>

    </div>
  );
}