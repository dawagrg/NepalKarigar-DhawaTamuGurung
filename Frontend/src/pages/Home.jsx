import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { IWrench, ICheckCirc, IShield, IStar, IUser, IArrow } from "../components/Icons";
import { formatNPR } from "../utils";

const CATEGORIES = [
  { name: "Plumber",      count: "120+", color: "#2563EB", bg: "#EFF6FF" },
  { name: "Electrician",  count: "95+",  color: "#D97706", bg: "#FFFBEB" },
  { name: "Mason",        count: "200+", color: "#16A34A", bg: "#F0FDF4" },
  { name: "Painter",      count: "80+",  color: "#7C3AED", bg: "#F5F3FF" },
  { name: "Carpenter",    count: "140+", color: "#0D9488", bg: "#F0FDFA" },
  { name: "Mechanic",     count: "60+",  color: "#DC2626", bg: "#FEF2F2" },
  { name: "Cook",         count: "75+",  color: "#EA580C", bg: "#FFF7ED" },
  { name: "Gardener",     count: "50+",  color: "#16A34A", bg: "#F0FDF4" },
];

const FEATURES = [
  { Icon: IShield,    title: "Verified Workers",    desc: "Every karigar is background-checked before joining." },
  { Icon: ICheckCirc, title: "Book in Minutes",     desc: "Find and book a skilled worker instantly, any time." },
  { Icon: IStar,      title: "Genuine Reviews",     desc: "Transparent ratings from real customers." },
  { Icon: IWrench,    title: "All Skills Covered",  desc: "From plumbing to painting — we have every trade." },
];

export default function Home() {
  const user  = localStorage.getItem("username");
  const [stats, setStats] = useState([
    { value: "500+",   label: "Verified Workers"  },
    { value: "2,000+", label: "Jobs Completed"    },
    { value: "20+",    label: "Service Types"     },
    { value: "4.8",   label: "Average Rating"    },
  ]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/accounts/admin/stats/", {
      headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        setStats([
          { value: `${(d.users?.total || 0).toLocaleString()}+`,       label: "Registered Users"   },
          { value: `${(d.bookings?.total || 0).toLocaleString()}+`,    label: "Bookings Made"      },
          { value: `${(d.karigars?.verified || 0).toLocaleString()}+`, label: "Verified Karigars"  },
          { value: `${(d.reviews?.total || 0).toLocaleString()}+`,     label: "Reviews Given"      },
        ]);
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ background: "white" }}>

      {/* HERO */}
      <section style={{ paddingTop: 120, paddingBottom: 72, background: "#F9FAFB", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 24px" }}>
          <span style={{ display: "inline-block", padding: "3px 12px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 100, fontSize: 12, fontWeight: 600, color: "#2563EB", marginBottom: 18 }}>
            Nepal's Most Trusted Karigar Platform
          </span>
          <h1 style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "clamp(32px,5vw,52px)", lineHeight: 1.1, color: "#111827", marginBottom: 16, letterSpacing: "-1px" }}>
            Find skilled workers<br />across Nepal.
          </h1>
          <p style={{ fontSize: 16, color: "#6B7280", lineHeight: 1.75, marginBottom: 32 }}>
            Connect with verified plumbers, electricians, carpenters and more — in your area, at fair prices.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 48 }}>
            <Link to="/search" className="btn btn-primary btn-lg" style={{ textDecoration: "none" }}>
              Find a Karigar
            </Link>
            <Link to={user ? "/" : "/register"} state={{ role: "karigar" }} className="btn btn-outline btn-lg" style={{ textDecoration: "none" }}>
              Join as Karigar
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {stats.map(({ value, label }) => (
              <div key={label} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 10, padding: "12px 18px", textAlign: "center", minWidth: 100 }}>
                <div style={{ fontWeight: 700, fontSize: 20, color: "#111827" }}>{value}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section" style={{ background: "white" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Browse Services</p>
            <h2 style={{ fontWeight: 700, fontSize: "clamp(22px,3vw,32px)", color: "#111827" }}>What do you need help with?</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            {CATEGORIES.map(({ name, count, color, bg }) => (
              <Link key={name} to={`/search?q=${encodeURIComponent(name)}`} style={{ textDecoration:"none" }}>
                <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "18px 16px", cursor: "pointer", textAlign: "left", transition: "all .18s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = bg; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.background = "white"; e.currentTarget.style.transform = ""; }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "#111827", marginBottom: 4 }}>{name}</div>
                  <div style={{ fontSize: 12, color, fontWeight: 500 }}>{count} workers</div>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ textAlign:"center", marginTop:20 }}>
            <Link to="/services" style={{ fontSize:13, fontWeight:600, color:"var(--primary)", textDecoration:"none" }}>
              View all service categories →
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section" style={{ background: "#F9FAFB" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Why NepalKarigar</p>
            <h2 style={{ fontWeight: 700, fontSize: "clamp(22px,3vw,32px)", color: "#111827" }}>Built for trust and reliability</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {FEATURES.map(({ Icon, title, desc }) => (
              <div key={title} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "22px 20px" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Icon size={20} color="#2563EB" />
                </div>
                <h3 style={{ fontWeight: 600, fontSize: 15, color: "#111827", marginBottom: 6 }}>{title}</h3>
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: "white" }}>
        <div className="container">
          <div style={{ background: "#2563EB", borderRadius: 16, padding: "52px 36px", textAlign: "center" }}>
            <h2 style={{ fontWeight: 700, fontSize: "clamp(22px,3vw,32px)", color: "white", marginBottom: 12 }}>
              Ready to get started?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 15, marginBottom: 30 }}>
              Join thousands of customers and workers already using NepalKarigar.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/register" style={{ padding: "11px 24px", background: "white", borderRadius: 8, color: "#2563EB", fontWeight: 700, fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7 }}>
                Find a Karigar <IArrow size={15} color="#2563EB" />
              </Link>
              <Link to="/register" state={{ role: "karigar" }} style={{ padding: "11px 24px", background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: 8, color: "white", fontWeight: 700, fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7 }}>
                <IWrench size={15} color="white" /> Join as Karigar
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #E5E7EB", background: "white", padding: "22px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IWrench size={15} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>NepalKarigar</span>
          </div>
          <p style={{ color: "#9CA3AF", fontSize: 13 }}>© 2025 NepalKarigar. Connecting Nepal's skill economy.</p>
          <Link to="/about" style={{ fontSize: 13, color: "#2563EB", fontWeight: 600, textDecoration: "none" }}>About Us & Contact</Link>
        </div>
      </footer>
    </div>
  );
}