import { useState } from "react";
import { Link } from "react-router-dom";

const PRIMARY    = "#2563EB";
const PRIMARY_BG = "#EFF6FF";
const PRIMARY_BD = "#BFDBFE";

// ── Simple icon SVGs inline (no external deps) ────────────────────────────────
const IconMail    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const IconPhone   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IconMapPin  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconUsers   = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconShield  = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconStar    = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IconHeart   = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const IconWrench  = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const IconCheck   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconSend    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IconFB      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
const IconTW      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>;
const IconIG      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;

const TEAM = [
  { name: "Dhawa Tamu Gurung",  id: "24045866", role: "Full-Stack Lead",        emoji: "DT", color: "#2563EB", bg: "#EFF6FF", bd: "#BFDBFE" },
  { name: "Sumit Giri",         id: "24046109", role: "Backend Developer",      emoji: "SG",  color: "#7C3AED", bg: "#F5F3FF", bd: "#DDD6FE" },
  { name: "Suprim Bista",       id: "24046115", role: "Frontend Developer",     emoji: "SB",  color: "#D97706", bg: "#FFFBEB", bd: "#FDE68A" },
  { name: "Sijal Newar",        id: "24046079", role: "UI/UX & QA Engineer",    emoji: "SN",  color: "#16A34A", bg: "#F0FDF4", bd: "#BBF7D0" },
];

const VALUES = [
  { icon: <IconShield/>,  title: "Trust & Safety",    color: "#2563EB", bg: "#EFF6FF", desc: "Every karigar on our platform is verified and reviewed by real customers to ensure quality work." },
  { icon: <IconStar/>,    title: "Quality First",     color: "#D97706", bg: "#FFFBEB", desc: "We maintain high standards — only skilled, experienced professionals are listed on NepalKarigar." },
  { icon: <IconHeart/>,   title: "Community Driven",  color: "#DC2626", bg: "#FEF2F2", desc: "Built for Nepal, by Nepalis. We support local artisans and help them grow their livelihoods." },
  { icon: <IconUsers/>,   title: "Fair Opportunity",  color: "#16A34A", bg: "#F0FDF4", desc: "Bargaining tools let customers and karigars agree on fair rates — no hidden fees, no middlemen." },
];

const STATS = [
  { value: "500+",   label: "Karigars",        emoji: "tool" },
  { value: "2,000+", label: "Bookings",         emoji: "book" },
  { value: "20+",    label: "Service Types",    emoji: "SG"  },
  { value: "4.8",     label: "Avg Rating",       emoji: "star"  },
];

const CONTACT_INFO = [
  { icon: <IconMail/>,   label: "Email",    value: "support@nepalkarigar.com.np",  href: "mailto:support@nepalkarigar.com.np",   color: PRIMARY },
  { icon: <IconPhone/>,  label: "Phone",    value: "+977-025-123456",               href: "tel:+977025123456",                     color: "#16A34A" },
  { icon: <IconMapPin/>, label: "Address",  value: "Itahari-5, Sunsari, Province 1, Nepal", href: null,                           color: "#D97706" },
];

function Section({ id, children, style = {} }) {
  return (
    <section id={id} style={{ padding: "72px 20px", ...style }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>{children}</div>
    </section>
  );
}

function SectionTitle({ eyebrow, title, subtitle }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 48 }}>
      {eyebrow && (
        <span style={{ display: "inline-block", padding: "3px 14px", background: PRIMARY_BG, border: `1px solid ${PRIMARY_BD}`, borderRadius: 100, fontSize: 12, fontWeight: 700, color: PRIMARY, marginBottom: 14, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          {eyebrow}
        </span>
      )}
      <h2 style={{ fontSize: 30, fontWeight: 800, color: "#111827", marginBottom: 10, lineHeight: 1.2 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 15, color: "#6B7280", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>{subtitle}</p>}
    </div>
  );
}

export default function AboutUs() {
  const [form, setForm]       = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [formErr, setFormErr] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setFormErr("");
    if (!form.name.trim())    { setFormErr("Please enter your name."); return; }
    if (!form.email.trim() || !form.email.includes("@")) { setFormErr("Please enter a valid email."); return; }
    if (!form.subject.trim()) { setFormErr("Please enter a subject."); return; }
    if (!form.message.trim()) { setFormErr("Please write a message."); return; }
    setSending(true);
    // Simulate sending (no real backend for contact form)
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
  };

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 9, border: "1.5px solid #E5E7EB",
    fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
    background: "#FAFAFA", transition: "border-color .15s",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", paddingTop: 64 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
        .nk-about-page { font-family: 'Sora', 'Segoe UI', sans-serif; }
        .nk-about-page h1, .nk-about-page h2, .nk-about-page h3 { font-family: 'Sora', 'Segoe UI', sans-serif; }
        .value-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1) !important; }
        .team-card:hover  { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1) !important; }
        .contact-input:focus { border-color: ${PRIMARY} !important; background: #fff !important; box-shadow: 0 0 0 3px ${PRIMARY_BG}; }
        .nav-anchor { color: #6B7280; text-decoration: none; font-size: 13px; font-weight: 600; padding: 6px 12px; border-radius: 20px; transition: all .15s; }
        .nav-anchor:hover { color: ${PRIMARY}; background: ${PRIMARY_BG}; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp .6s ease forwards; }
      `}</style>

      <div className="nk-about-page">

        {/* ── Sticky in-page nav ────────────────────────────────────────────── */}
        <div style={{ position: "sticky", top: 64, zIndex: 50, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)", borderBottom: "1px solid #F3F4F6", padding: "8px 20px" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", gap: 4, overflowX: "auto" }}>
            {["About", "Mission", "Team", "Stats", "Contact"].map(s => (
              <a key={s} href={`#${s.toLowerCase()}`} className="nav-anchor">{s}</a>
            ))}
          </div>
        </div>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section id="about" style={{ background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%)", padding: "80px 20px 100px", position: "relative", overflow: "hidden" }}>
          {/* decorative circles */}
          <div style={{ position:"absolute", top:-60, right:-60, width:300, height:300, borderRadius:"50%", background:"rgba(255,255,255,0.06)", pointerEvents:"none" }}/>
          <div style={{ position:"absolute", bottom:-80, left:-40, width:260, height:260, borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" }}/>

          <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center", position:"relative", zIndex:1 }} className="fade-up">
            <div style={{ display:"inline-flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:100, padding:"6px 18px 6px 10px", marginBottom:28 }}>
              <div style={{ width:28, height:28, background:"white", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <IconWrench/>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:"white", letterSpacing:"0.03em" }}>NepalKarigar Platform</span>
            </div>

            <h1 style={{ fontSize: 44, fontWeight: 800, color: "white", lineHeight: 1.15, marginBottom: 18 }}>
              Connecting Nepal's<br/>
              <span style={{ color:"#93C5FD" }}>Skilled Karigars</span> with<br/>
              People Who Need Them
            </h1>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.82)", lineHeight: 1.8, maxWidth: 600, margin: "0 auto 36px" }}>
              NepalKarigar is a digital marketplace that bridges the gap between skilled tradespeople and customers across Nepal — making it easy to find, book, and review local craftspeople.
            </p>
            <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <Link to="/search" style={{ padding:"12px 28px", background:"white", borderRadius:9, color:PRIMARY, fontWeight:700, fontSize:14, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:8 }}>
                Find a Karigar →
              </Link>
              <a href="#contact" style={{ padding:"12px 28px", background:"rgba(255,255,255,0.12)", border:"1.5px solid rgba(255,255,255,0.3)", borderRadius:9, color:"white", fontWeight:700, fontSize:14, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:8 }}>
                Contact Us
              </a>
            </div>
          </div>
        </section>

        {/* ── Mission / Values ────────────────────────────────────────────── */}
        <Section id="mission" style={{ background:"white" }}>
          <SectionTitle
            eyebrow="Our Mission"
            title="Why NepalKarigar Exists"
            subtitle="Millions of skilled workers in Nepal struggle to find consistent work while customers struggle to find reliable help. We're changing that."
          />
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:20 }}>
            {VALUES.map(v => (
              <div key={v.title} className="value-card"
                style={{ background:"#fff", border:`1.5px solid ${v.bd}`, borderRadius:14, padding:"24px 20px", transition:"all .25s", cursor:"default" }}>
                <div style={{ width:48, height:48, borderRadius:12, background:v.bg, color:v.color, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                  {v.icon}
                </div>
                <h3 style={{ fontSize:15, fontWeight:700, color:"#111827", marginBottom:8 }}>{v.title}</h3>
                <p style={{ fontSize:13, color:"#6B7280", lineHeight:1.7 }}>{v.desc}</p>
              </div>
            ))}
          </div>

          {/* Story block */}
          <div style={{ marginTop:48, background:"linear-gradient(135deg,#EFF6FF,#F0FDF4)", border:"1.5px solid #BFDBFE", borderRadius:16, padding:"32px 36px", display:"flex", gap:28, alignItems:"flex-start", flexWrap:"wrap" }}>
            <div style={{ flex:1, minWidth:260 }}>
              <h3 style={{ fontSize:20, fontWeight:800, color:"#111827", marginBottom:12 }}>Our Story</h3>
              <p style={{ fontSize:14, color:"#374151", lineHeight:1.8, marginBottom:12 }}>
                NepalKarigar started as a second-year university project at <strong>Itahari International College</strong>, affiliated with London Metropolitan University. Our team saw first-hand how difficult it was for families in Sunsari and beyond to find a trustworthy plumber, electrician, or carpenter on short notice.
              </p>
              <p style={{ fontSize:14, color:"#374151", lineHeight:1.8 }}>
                We built a platform where karigars can showcase their skills, set fair rates, negotiate bookings, and build a verified reputation — while customers can browse, compare, and book with confidence.
              </p>
            </div>
            <div style={{ flexShrink:0, minWidth:180 }}>
              <div style={{ background:"white", border:"1px solid #E5E7EB", borderRadius:12, padding:"20px", textAlign:"center" }}>
                <div style={{ marginBottom:8, display:"flex", justifyContent:"center" }}><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg></div>
                <div style={{ fontSize:13, fontWeight:700, color:"#111827", marginBottom:4 }}>Academic Project</div>
                <div style={{ fontSize:12, color:"#6B7280", lineHeight:1.6 }}>
                  Itahari International College<br/>London Metropolitan University<br/>
                  <strong style={{ color:PRIMARY }}>2024 Cohort</strong>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Team ────────────────────────────────────────────────────────── */}
        <Section id="team" style={{ background:"#FAFAFA" }}>
          <SectionTitle
            eyebrow="The Team"
            title="Meet the Builders"
            subtitle="Four students who turned a real problem into a working solution."
          />
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:20 }}>
            {TEAM.map(m => (
              <div key={m.id} className="team-card"
                style={{ background:"white", border:`1.5px solid ${m.bd}`, borderRadius:14, padding:"28px 20px", textAlign:"center", transition:"all .25s", cursor:"default" }}>
                <div style={{ width:64, height:64, borderRadius:"50%", background:m.bg, border:`2px solid ${m.bd}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:28 }}>
                  {m.emoji}
                </div>
                <div style={{ fontSize:15, fontWeight:700, color:"#111827", marginBottom:4 }}>{m.name}</div>
                <div style={{ fontSize:12, fontWeight:700, color:m.color, background:m.bg, border:`1px solid ${m.bd}`, borderRadius:20, display:"inline-block", padding:"2px 10px", marginBottom:6 }}>
                  {m.role}
                </div>
                <div style={{ fontSize:11, color:"#9CA3AF", fontWeight:600 }}>ID: {m.id}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <Section id="stats" style={{ background:PRIMARY, padding:"56px 20px" }}>
          <div style={{ maxWidth:1000, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:40 }}>
              <h2 style={{ fontSize:28, fontWeight:800, color:"white", marginBottom:8 }}>NepalKarigar by the Numbers</h2>
              <p style={{ fontSize:14, color:"rgba(255,255,255,0.75)" }}>Growing every day across Nepal.</p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:16 }}>
              {STATS.map(s => (
                <div key={s.label} style={{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:14, padding:"24px 16px", textAlign:"center" }}>
                  <div style={{ fontSize:28, marginBottom:6 }}>{s.emoji}</div>
                  <div style={{ fontSize:32, fontWeight:800, color:"white", lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.75)", marginTop:6 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Contact ──────────────────────────────────────────────────────── */}
        <Section id="contact" style={{ background:"white" }}>
          <SectionTitle
            eyebrow="Get in Touch"
            title="Contact Us"
            subtitle="Have a question, partnership idea, or feedback? We'd love to hear from you."
          />

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:32, alignItems:"start" }}>

            {/* Left: contact info */}
            <div>
              <div style={{ display:"flex", flexDirection:"column", gap:16, marginBottom:28 }}>
                {CONTACT_INFO.map(c => (
                  <div key={c.label} style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"16px", background:"#FAFAFA", border:"1.5px solid #F3F4F6", borderRadius:12 }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:c.color+"15", color:c.color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      {c.icon}
                    </div>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:3 }}>{c.label}</div>
                      {c.href
                        ? <a href={c.href} style={{ fontSize:14, fontWeight:600, color:c.color, textDecoration:"none" }}>{c.value}</a>
                        : <span style={{ fontSize:14, fontWeight:600, color:"#374151" }}>{c.value}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Office hours */}
              <div style={{ background:"#FFFBEB", border:"1.5px solid #FDE68A", borderRadius:12, padding:"16px" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#92400E", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:10 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Office Hours</div>
                {[
                  ["Sun – Fri", "9:00 AM – 6:00 PM"],
                  ["Saturday",  "10:00 AM – 2:00 PM"],
                  ["Holidays",  "Closed"],
                ].map(([d,t]) => (
                  <div key={d} style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#374151", marginBottom:5 }}>
                    <span style={{ fontWeight:600 }}>{d}</span>
                    <span style={{ color:"#92400E", fontWeight:700 }}>{t}</span>
                  </div>
                ))}
              </div>

              {/* Social */}
              <div style={{ marginTop:20 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:12 }}>Follow Us</div>
                <div style={{ display:"flex", gap:10 }}>
                  {[
                    { icon:<IconFB/>,  label:"Facebook",  color:"#1877F2", bg:"#EFF6FF" },
                    { icon:<IconTW/>,  label:"Twitter",   color:"#1DA1F2", bg:"#EFF6FF" },
                    { icon:<IconIG/>,  label:"Instagram", color:"#E1306C", bg:"#FEF2F2" },
                  ].map(s => (
                    <button key={s.label} title={s.label}
                      style={{ width:40, height:40, borderRadius:10, background:s.bg, border:"1.5px solid #E5E7EB", color:s.color, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                      {s.icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: contact form */}
            <div style={{ background:"#FAFAFA", border:"1.5px solid #E5E7EB", borderRadius:16, padding:"28px 24px" }}>
              {sent ? (
                <div style={{ textAlign:"center", padding:"40px 20px" }}>
                  <div style={{ width:64, height:64, borderRadius:"50%", background:"#F0FDF4", border:"2px solid #BBF7D0", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", color:"#16A34A" }}>
                    <IconCheck/>
                  </div>
                  <h3 style={{ fontSize:18, fontWeight:700, color:"#111827", marginBottom:8 }}>Message Sent!</h3>
                  <p style={{ fontSize:14, color:"#6B7280", lineHeight:1.7, marginBottom:20 }}>
                    Thank you for reaching out. We'll get back to you within 1–2 business days.
                  </p>
                  <button onClick={() => { setSent(false); setForm({name:"",email:"",subject:"",message:""}); }}
                    style={{ padding:"9px 20px", borderRadius:9, border:`1.5px solid ${PRIMARY}`, background:"white", color:PRIMARY, fontWeight:700, fontSize:13, cursor:"pointer" }}>
                    Send Another Message
                  </button>
                </div>
              ) : (
                <>
                  <h3 style={{ fontSize:16, fontWeight:700, color:"#111827", marginBottom:20 }}>Send Us a Message</h3>

                  {formErr && (
                    <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#DC2626", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> {formErr}
                    </div>
                  )}

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                    <div>
                      <label style={{ fontSize:11, fontWeight:700, color:"#6B7280", display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.04em" }}>Your Name *</label>
                      <input className="contact-input" value={form.name} onChange={e=>set("name",e.target.value)}
                        placeholder="Hari Prasad Sharma" style={inputStyle}/>
                    </div>
                    <div>
                      <label style={{ fontSize:11, fontWeight:700, color:"#6B7280", display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.04em" }}>Email Address *</label>
                      <input className="contact-input" type="email" value={form.email} onChange={e=>set("email",e.target.value)}
                        placeholder="hari@email.com" style={inputStyle}/>
                    </div>
                  </div>

                  <div style={{ marginBottom:12 }}>
                    <label style={{ fontSize:11, fontWeight:700, color:"#6B7280", display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.04em" }}>Subject *</label>
                    <input className="contact-input" value={form.subject} onChange={e=>set("subject",e.target.value)}
                      placeholder="e.g. Partnership inquiry" style={inputStyle}/>
                  </div>

                  <div style={{ marginBottom:20 }}>
                    <label style={{ fontSize:11, fontWeight:700, color:"#6B7280", display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.04em" }}>Message *</label>
                    <textarea className="contact-input" value={form.message} onChange={e=>set("message",e.target.value)}
                      rows={5} placeholder="Write your message here…"
                      style={{ ...inputStyle, resize:"vertical" }}/>
                  </div>

                  <button onClick={handleSubmit} disabled={sending}
                    style={{ width:"100%", padding:"12px", borderRadius:9, border:"none", background:PRIMARY, color:"white",
                      fontWeight:700, fontSize:14, cursor:sending?"not-allowed":"pointer", opacity:sending?0.8:1,
                      display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"opacity .15s" }}>
                    {sending ? (
                      <><div style={{ width:16, height:16, border:"2px solid rgba(255,255,255,.4)", borderTopColor:"white", borderRadius:"50%", animation:"spin .7s linear infinite" }}/> Sending…</>
                    ) : (
                      <><IconSend/> Send Message</>
                    )}
                  </button>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </>
              )}
            </div>
          </div>
        </Section>

        {/* ── Footer strip ────────────────────────────────────────────────── */}
        <div style={{ borderTop:"1px solid #E5E7EB", background:"white", padding:"24px 20px", textAlign:"center" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:8 }}>
            <div style={{ width:28, height:28, background:PRIMARY, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <IconWrench/>
            </div>
            <span style={{ fontWeight:800, fontSize:15, color:"#111827" }}>NepalKarigar</span>
          </div>
          <p style={{ fontSize:12, color:"#9CA3AF", marginBottom:8 }}>
            Nepal's trusted karigar booking platform — Connecting skill with opportunity.
          </p>
          <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
            <Link to="/"        style={{ fontSize:12, color:"#6B7280", textDecoration:"none", fontWeight:600 }}>Home</Link>
            <Link to="/services" style={{ fontSize:12, color:"#6B7280", textDecoration:"none", fontWeight:600 }}>Services</Link>
            <Link to="/search"  style={{ fontSize:12, color:"#6B7280", textDecoration:"none", fontWeight:600 }}>Find Karigars</Link>
            <a href="#contact"  style={{ fontSize:12, color:PRIMARY,   textDecoration:"none", fontWeight:600 }}>Contact</a>
          </div>
          <p style={{ fontSize:11, color:"#D1D5DB", marginTop:14 }}>
            © 2025 NepalKarigar 
          </p>
        </div>

      </div>
    </div>
  );
}