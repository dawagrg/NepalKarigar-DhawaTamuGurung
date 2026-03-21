import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  adminGetStats, adminListUsers, adminToggleUser,
  adminListKarigars, adminVerifyKarigar, adminListBookings,
  adminListApplications, adminApproveApplication, adminRejectApplication,
  adminGetNotifications, adminMarkNotificationsRead, adminClearNotifications,
  adminListComplaints, adminRespondComplaint,
  adminListContactMessages, adminMarkContactRead, adminDeleteContactMessage,
} from "../services/api";
import { IUser, IWrench, ICheckCirc, IAlertCirc, ISearch, IShield,
         IClipboard, IThumbsUp, IThumbsDown, IPhone, IPin, IMoney,
         ISliders, IRefresh, ITool, ICheckSquare, ICloseCirc, IStar,
         IBell, IClose, IAlertTri, IMessage, ISend, IMail } from "../components/Icons";

const MEDIA_BASE = "http://127.0.0.1:8000";
const imgUrl = r => !r ? null : r.startsWith("http") ? r : `${MEDIA_BASE}${r.startsWith("/") ? r : "/media/" + r}`;

// ── Small reusable components ─────────────────────────────────────────────────

function Avatar({ src, name, size = 34 }) {
  const av = imgUrl(src);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "var(--primary-bg)", border: "2px solid var(--primary-bd)",
      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
    }}>
      {av
        ? <img src={av} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontWeight: 700, fontSize: size * 0.38, color: "var(--primary)" }}>
            {(name || "?")[0].toUpperCase()}
          </span>}
    </div>
  );
}

function Badge({ label, color, bg, bd }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, color, background: bg,
      border: `1px solid ${bd}`, borderRadius: 20, padding: "2px 9px", whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

const BOOKING_STYLE = {
  pending:    { color: "#D97706", bg: "#FFFBEB", bd: "#FDE68A",  label: "Pending" },
  bargaining: { color: "#7C3AED", bg: "#F5F3FF", bd: "#DDD6FE",  label: "Bargaining" },
  accepted:   { color: "#16A34A", bg: "#F0FDF4", bd: "#BBF7D0",  label: "Accepted" },
  completed:  { color: "#2563EB", bg: "#EFF6FF", bd: "#BFDBFE",  label: "Completed" },
  rejected:   { color: "#DC2626", bg: "#FEF2F2", bd: "#FECACA",  label: "Rejected" },
  cancelled:  { color: "#6B7280", bg: "#F3F4F6", bd: "#D1D5DB",  label: "Cancelled" },
};

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
      <div style={{
        width: 28, height: 28, border: "3px solid var(--border)",
        borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin .7s linear infinite",
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  return (
    <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 16 }}>
      <button onClick={() => onPage(page - 1)} disabled={page <= 1}
        style={{ padding: "5px 12px", borderRadius: 7, border: "1.5px solid var(--border)", background: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1, fontSize: 13 }}>
        ‹
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === pages || Math.abs(p - page) <= 1)
        .reduce((acc, p, i, arr) => {
          if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
          acc.push(p);
          return acc;
        }, [])
        .map((p, i) => p === "..." ? (
          <span key={`e${i}`} style={{ padding: "5px 4px", fontSize: 13, color: "var(--text-p)" }}>…</span>
        ) : (
          <button key={p} onClick={() => onPage(p)}
            style={{
              padding: "5px 11px", borderRadius: 7, border: "1.5px solid",
              borderColor: page === p ? "var(--primary)" : "var(--border)",
              background: page === p ? "var(--primary)" : "#fff",
              color: page === p ? "white" : "var(--text-s)",
              fontWeight: page === p ? 700 : 500, cursor: "pointer", fontSize: 13,
            }}>{p}</button>
        ))}
      <button onClick={() => onPage(page + 1)} disabled={page >= pages}
        style={{ padding: "5px 12px", borderRadius: 7, border: "1.5px solid var(--border)", background: "#fff", cursor: page >= pages ? "not-allowed" : "pointer", opacity: page >= pages ? 0.4 : 1, fontSize: 13 }}>
        ›
      </button>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = "var(--primary)", icon }) {
  return (
    <div className="card" style={{ padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, background: color + "18",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-h)", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-s)", marginTop: 3 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--text-p)", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Section tabs ──────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview",      label: "Overview" },
  { id: "applications",  label: "Applications", icon: "clipboard" },
  { id: "users",         label: "Users" },
  { id: "karigars",      label: "Karigar Verification" },
  { id: "bookings",      label: "Bookings" },
  { id: "complaints",    label: "Complaints" },
  { id: "messages",      label: "Messages" },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate  = useNavigate();
  const [tab, setTab] = useState("overview");

  // Guard: must be logged-in staff
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const isStaff = localStorage.getItem("is_staff");
    if (!token) { navigate("/login"); return; }
    if (isStaff !== "true") { navigate("/"); }
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", paddingTop: 70 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: "var(--primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <IShield size={18} color="white" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-h)" }}>Admin Dashboard</h1>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-s)", marginLeft: 46 }}>
            Manage users, verify karigars, and monitor platform activity.
          </p>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 4, borderBottom: "2px solid var(--border)", marginBottom: 24 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                padding: "9px 18px", border: "none", background: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 700, borderBottom: `2px solid ${tab === t.id ? "var(--primary)" : "transparent"}`,
                color: tab === t.id ? "var(--primary)" : "var(--text-s)",
                marginBottom: -2, transition: "all .15s",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview"      && <OverviewTab />}
        {tab === "applications"  && <ApplicationsTab />}
        {tab === "users"         && <UsersTab />}
        {tab === "karigars"      && <KarigarsTab />}
        {tab === "bookings"      && <BookingsTab />}
        {tab === "complaints"    && <ComplaintsTab />}
        {tab === "messages"      && <MessagesTab />}

      </div>
    </div>
  );
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// APPLICATIONS TAB
// ─────────────────────────────────────────────────────────────────────────────
function ApplicationsTab() {
  const [apps,       setApps]      = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [statusFilt, setStatusFilt]= useState("pending");
  const [search,     setSearch]    = useState("");
  const [page,       setPage]      = useState(1);
  const [meta,       setMeta]      = useState({ total:0, pages:1 });
  const [selected,   setSelected]  = useState(null);  // expanded app id
  const [rejectNote, setRejectNote]= useState("");
  const [acting,     setActing]    = useState(null);
  const [msg,        setMsg]       = useState("");

  const load = useCallback((p=1) => {
    setLoading(true);
    adminListApplications({ status:statusFilt, search, page:p })
      .then(r => {
        setApps(r.data.results);
        setMeta({ total:r.data.count, pages:r.data.pages });
        setPage(p);
      })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, [statusFilt, search]);

  useEffect(()=>{ load(1); }, [statusFilt]);

  const approve = async (appId) => {
    if (!confirm("Approve this karigar application? Their account will be activated.")) return;
    setActing(appId); setMsg("");
    try {
      await adminApproveApplication(appId, {});
      setMsg("Application approved. SMS sent to karigar.");
      load(page);
      setSelected(null);
    } catch(e) { alert(e.response?.data?.error || "Failed to approve."); }
    finally { setActing(null); }
  };

  const reject = async (appId) => {
    if (!rejectNote.trim()) { alert("Please enter a rejection reason."); return; }
    setActing(appId); setMsg("");
    try {
      await adminRejectApplication(appId, { reason: rejectNote });
      setMsg("Application rejected. SMS sent to karigar.");
      setRejectNote("");
      load(page);
      setSelected(null);
    } catch(e) { alert(e.response?.data?.error || "Failed to reject."); }
    finally { setActing(null); }
  };

  const STATUS_CLR = {
    pending:  { color:"#D97706", bg:"#FFFBEB", bd:"#FDE68A"  },
    approved: { color:"#16A34A", bg:"#F0FDF4", bd:"#BBF7D0"  },
    rejected: { color:"#DC2626", bg:"#FEF2F2", bd:"#FECACA"  },
  };

  const MEDIA_BASE = "http://127.0.0.1:8000";
  const imgUrl = r => !r ? null : r.startsWith("http") ? r : `${MEDIA_BASE}${r.startsWith("/") ? r : "/media/" + r}`;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <h2 style={{ fontSize:16, fontWeight:800, color:"var(--text-h)" }}>
          Karigar Applications
        </h2>
        <div style={{ display:"flex", gap:6 }}>
          {["pending","approved","rejected"].map(s=>(
            <button key={s} onClick={()=>{ setStatusFilt(s); setSelected(null); }}
              style={{ padding:"5px 14px", borderRadius:20, border:"1.5px solid",
                fontSize:12, fontWeight:700, cursor:"pointer",
                borderColor: statusFilt===s ? STATUS_CLR[s].color : "var(--border)",
                background:  statusFilt===s ? STATUS_CLR[s].bg    : "#fff",
                color:       statusFilt===s ? STATUS_CLR[s].color : "var(--text-s)" }}>
              {s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ position:"relative", marginBottom:14, maxWidth:340 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          onKeyDown={e=>e.key==="Enter" && load(1)}
          placeholder="Search name, citizenship, trade…"
          style={{ width:"100%", padding:"8px 12px 8px 34px", borderRadius:8,
            border:"1.5px solid var(--border)", fontSize:13, outline:"none",
            background:"#fff", boxSizing:"border-box" }}/>
        <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", display:"flex" }}><ISearch size={13} color="var(--text-p)"/></span>
      </div>

      {msg && <div style={{ padding:"10px 14px", background:"#F0FDF4", border:"1.5px solid #BBF7D0",
        borderRadius:9, marginBottom:12, fontSize:13, color:"#16A34A", fontWeight:600 }}>{msg}</div>}

      {loading ? (
        <div style={{ padding:"40px", textAlign:"center", color:"var(--text-p)", fontSize:13 }}>Loading applications…</div>
      ) : apps.length === 0 ? (
        <div style={{ padding:"48px", textAlign:"center" }}>
          <div style={{ marginBottom:10 }}><IClipboard size={40} color="var(--text-p)"/></div>
          <p style={{ fontSize:14, color:"var(--text-s)" }}>No {statusFilt} applications.</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {apps.map(app => {
            const s   = STATUS_CLR[app.status] || STATUS_CLR.pending;
            const exp = selected === app.id;
            return (
              <div key={app.id} className="card" style={{ overflow:"hidden" }}>

                {/* App header row */}
                <div style={{ padding:"14px 16px", display:"flex", gap:12,
                  alignItems:"center", cursor:"pointer", flexWrap:"wrap" }}
                  onClick={()=>setSelected(exp ? null : app.id)}>
                  <div style={{ width:42, height:42, borderRadius:"50%", background:"var(--primary-bg)",
                    border:"2px solid var(--primary-bd)", display:"flex", alignItems:"center",
                    justifyContent:"center", flexShrink:0, fontWeight:700, fontSize:17, color:"var(--primary)" }}>
                    {(app.full_name||"K")[0].toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:"var(--text-h)" }}>
                      {app.full_name}
                    </div>
                    <div style={{ fontSize:12, color:"var(--text-s)" }}>
                      <IPhone size={12} color="var(--text-s)"/> {app.phone_number} &nbsp;•&nbsp; <ITool size={12} color="var(--text-s)"/> {app.service_title || "—"} &nbsp;•&nbsp; <IPin size={12} color="var(--text-s)"/> {app.district}
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11,
                      fontWeight:700, border:`1.5px solid ${s.bd}`,
                      background:s.bg, color:s.color }}>
                      {app.status.charAt(0).toUpperCase()+app.status.slice(1)}
                    </span>
                    <span style={{ fontSize:11, color:"var(--text-p)" }}>{app.submitted_at}</span>
                    <span style={{ color:"var(--text-p)", fontSize:14 }}>{exp?"▲":"▼"}</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {exp && (
                  <div style={{ borderTop:"1px solid var(--border)", padding:"16px" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10, marginBottom:16 }}>
                      {[
                        ["Full Name",        app.full_name],
                        ["Username",         app.username],
                        ["Phone",            app.phone_number],
                        ["Email",            app.email],
                        ["Date of Birth",    app.date_of_birth],
                        ["Age",              app.age+" years"],
                        ["Address",          app.address],
                        ["District",         app.district],
                        ["Citizenship No.",  app.citizenship_number],
                        ["Category",         app.service_category||"—"],
                        ["Service Title",    app.service_title],
                        ["Experience",       app.experience_years+" yrs"],
                      ].map(([l,v])=>(
                        <div key={l} style={{ background:"var(--bg-subtle)", borderRadius:8,
                          padding:"8px 12px", border:"1px solid var(--border)" }}>
                          <div style={{ fontSize:10, fontWeight:700, color:"var(--text-p)",
                            textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:3 }}>{l}</div>
                          <div style={{ fontSize:13, color:"var(--text-h)", fontWeight:600,
                            wordBreak:"break-word" }}>{v||"—"}</div>
                        </div>
                      ))}
                    </div>

                    {app.about_yourself && (
                      <div style={{ background:"#F9FAFB", borderRadius:8, padding:"10px 14px",
                        marginBottom:14, border:"1px solid var(--border)" }}>
                        <p style={{ fontSize:11, fontWeight:700, color:"var(--text-p)",
                          textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:5 }}>About</p>
                        <p style={{ fontSize:13, color:"var(--text-b)", lineHeight:1.6 }}>{app.about_yourself}</p>
                      </div>
                    )}

                    {/* Document images */}
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
                      {[
                        ["Citizenship Front", app.citizenship_front],
                        ["Citizenship Back",  app.citizenship_back],
                        ["Certificate",       app.certificate],
                        ["Work Sample",       app.work_sample],
                      ].filter(([,url])=>url).map(([label, url])=>(
                        <div key={label} style={{ textAlign:"center" }}>
                          <p style={{ fontSize:11, fontWeight:700, color:"var(--text-p)",
                            marginBottom:5, textTransform:"uppercase" }}>{label}</p>
                          <a href={imgUrl(url)} target="_blank" rel="noopener noreferrer">
                            <img src={imgUrl(url)} alt={label}
                              style={{ width:120, height:90, objectFit:"cover",
                                borderRadius:8, border:"1.5px solid var(--border)",
                                cursor:"pointer" }}/>
                          </a>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons — only for pending */}
                    {app.status === "pending" && (
                      <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"flex-end" }}>
                        <button onClick={()=>approve(app.id)} disabled={acting===app.id}
                          style={{ padding:"9px 20px", borderRadius:8, border:"none",
                            background:"#16A34A", color:"white", fontWeight:700,
                            fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                          <IThumbsUp size={13} color="white"/> Approve & Activate
                        </button>
                        <div style={{ flex:1, minWidth:200 }}>
                          <input value={rejectNote} onChange={e=>setRejectNote(e.target.value)}
                            placeholder="Rejection reason (required to reject)…"
                            style={{ width:"100%", padding:"9px 11px", borderRadius:8,
                              border:"1.5px solid #FECACA", fontSize:13, outline:"none",
                              boxSizing:"border-box" }}/>
                        </div>
                        <button onClick={()=>reject(app.id)} disabled={acting===app.id||!rejectNote.trim()}
                          style={{ padding:"9px 18px", borderRadius:8, border:"none",
                            background:rejectNote.trim()?"#DC2626":"#FCA5A5",
                            color:"white", fontWeight:700, fontSize:13,
                            cursor:rejectNote.trim()?"pointer":"not-allowed" }}>
                          <IThumbsDown size={13} color="white"/> Reject
                        </button>
                      </div>
                    )}

                    {app.status !== "pending" && app.admin_note && (
                      <div style={{ padding:"10px 14px", borderRadius:8,
                        background: app.status==="approved"?"#F0FDF4":"#FEF2F2",
                        border:`1.5px solid ${app.status==="approved"?"#BBF7D0":"#FECACA"}`,
                        fontSize:13, color:app.status==="approved"?"#16A34A":"#DC2626" }}>
                        <strong>Admin note:</strong> {app.admin_note}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.pages > 1 && (
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:20 }}>
          {Array.from({length:meta.pages},(_,i)=>i+1).map(p=>(
            <button key={p} onClick={()=>load(p)}
              style={{ padding:"6px 12px", borderRadius:8, border:"1.5px solid",
                borderColor:p===page?"var(--primary)":"var(--border)",
                background:p===page?"var(--primary)":"#fff",
                color:p===page?"white":"var(--text-h)",
                cursor:"pointer", fontSize:13, fontWeight:600 }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    adminGetStats()
      .then(r => setStats(r.data))
      .catch(() => setErr("Failed to load statistics."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (err) return <div className="alert alert-err"><IAlertCirc size={14} /> {err}</div>;
  if (!stats) return null;

  const { users, karigars, bookings, categories, reviews } = stats;

  return (
    <div>
      {/* User stats */}
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-p)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
        Users
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 28 }}>
        <StatCard label="Total Users"    value={users.total}     sub={`+${users.new_this_week} this week`} color="var(--primary)" icon={<IUser size={20} color="var(--primary)" />} />
        <StatCard label="Customers"      value={users.customers}  color="#2563EB"  icon={<IUser size={20} color="#2563EB" />} />
        <StatCard label="Karigars"       value={users.karigars}   color="#7C3AED"  icon={<IWrench size={20} color="#7C3AED" />} />
        <StatCard label="Verified Karigars" value={karigars.verified} sub={`${karigars.unverified} awaiting`} color="#16A34A" icon={<ICheckCirc size={20} color="#16A34A" />} />
      </div>

      {/* Booking stats */}
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-p)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
        Bookings
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
        <StatCard label="Total Bookings" value={bookings.total}      sub={`+${bookings.new_this_week} this week`} color="var(--primary)" icon={<IClipboard size={20} color="var(--primary)"/>} />
        <StatCard label="Pending"        value={bookings.pending}     color="#D97706" icon={<IClipboard size={18} color="currentColor"/>} />
        <StatCard label="Bargaining"     value={bookings.bargaining}  color="#7C3AED" icon={<IMoney size={20} color="#16A34A"/>} />
        <StatCard label="Accepted"       value={bookings.accepted}    color="#16A34A" icon={<ICheckSquare size={20} color="#2563EB"/>} />
        <StatCard label="Completed"      value={bookings.completed}   color="#2563EB" icon={<IClipboard size={18} color="currentColor"/>} />
        <StatCard label="Cancelled"      value={bookings.cancelled}   color="#6B7280" icon={<IClipboard size={18} color="currentColor"/>} />
      </div>

      {/* Other */}
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-p)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
        Platform
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
        <StatCard label="Service Categories" value={categories} color="#0891B2" icon={<ITool size={20} color="#7C3AED"/>} />
        <StatCard label="Reviews"            value={reviews}    color="#D97706" icon={<IStar size={20} color="#D97706" fill="#D97706"/>} />
        <StatCard label="Available Karigars" value={karigars.available} color="#16A34A" icon={<IWrench size={20} color="#16A34A" />} />
      </div>
    </div>
  );
}

// ── Tab: Users ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [data,    setData]    = useState({ results: [], count: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [role,    setRole]    = useState("");
  const [page,    setPage]    = useState(1);
  const [toast,   setToast]   = useState("");

  const load = useCallback((p = page, s = search, r = role) => {
    setLoading(true);
    adminListUsers({ search: s, role: r, page: p })
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(1, search, role); }, []);

  const doSearch = () => { setPage(1); load(1, search, role); };
  const onPage   = (p) => { setPage(p); load(p, search, role); };
  const onRole   = (r) => { setRole(r); setPage(1); load(1, search, r); };

  const [banModal,    setBanModal]    = useState(null);  // { id, username }
  const [banReason,   setBanReason]   = useState("");
  const [banLoading,  setBanLoading]  = useState(false);

  const handleBanClick = (u) => {
    if (!u.is_active) {
      // Unban — no reason needed
      if (confirm(`Unban @${u.username}? Their account will be reactivated.`)) {
        doToggle(u.id, "");
      }
    } else {
      // Ban — show modal to enter reason
      setBanModal({ id: u.id, username: u.username });
      setBanReason("");
    }
  };

  const doToggle = async (id, reason) => {
    setBanLoading(true);
    try {
      const res = await adminToggleUser(id, reason ? { reason } : {});
      setData(d => ({ ...d, results: d.results.map(u =>
        u.id === id ? { ...u, is_active: res.data.is_active } : u
      )}));
      setToast(res.data.message);
      setTimeout(() => setToast(""), 4000);
      setBanModal(null); setBanReason("");
    } catch (e) {
      setToast(e.response?.data?.error || "Action failed.");
      setTimeout(() => setToast(""), 4000);
    } finally { setBanLoading(false); }
  };

  return (
    <div>
      {toast && (
        <div className="alert alert-ok" style={{ marginBottom: 14, fontSize: 13 }}>
          <ICheckCirc size={13} /> {toast}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flex: 1, minWidth: 220, border: "1.5px solid var(--border)", borderRadius: 8, background: "#fff", overflow: "hidden" }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doSearch()}
            placeholder="Search name, username, phone…"
            style={{ flex: 1, padding: "9px 12px", border: "none", outline: "none", fontSize: 13 }} />
          <button onClick={doSearch}
            style={{ padding: "0 14px", border: "none", background: "var(--primary)", color: "white", cursor: "pointer" }}>
            <ISearch size={15} color="white" />
          </button>
        </div>
        {["", "customer", "karigar"].map(r => (
          <button key={r} onClick={() => onRole(r)}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "1.5px solid",
              borderColor: role === r ? "var(--primary)" : "var(--border)",
              background: role === r ? "var(--primary)" : "#fff",
              color: role === r ? "white" : "var(--text-s)",
              fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>
            {r === "" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12, color: "var(--text-p)", marginBottom: 10 }}>
        {data.count} user{data.count !== 1 ? "s" : ""} found
      </div>

      {loading ? <Spinner /> : (
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--bg-subtle)", borderBottom: "1.5px solid var(--border)" }}>
                {["User", "Role", "Phone", "Joined", "Status", "Action"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "var(--text-p)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.results.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "var(--text-p)" }}>No users found</td></tr>
              ) : data.results.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "#fff" : "var(--bg-subtle)" }}>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <Avatar src={u.profile_image} name={u.full_name} size={32} />
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--text-h)" }}>{u.full_name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-p)" }}>@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <Badge
                      label={u.role}
                      color={u.role === "karigar" ? "#7C3AED" : "#2563EB"}
                      bg={u.role === "karigar" ? "#F5F3FF" : "#EFF6FF"}
                      bd={u.role === "karigar" ? "#DDD6FE" : "#BFDBFE"}
                    />
                  </td>
                  <td style={{ padding: "10px 14px", color: "var(--text-s)" }}>{u.phone_number || "—"}</td>
                  <td style={{ padding: "10px 14px", color: "var(--text-s)" }}>{u.date_joined}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <Badge
                      label={u.is_active ? "Active" : "Banned"}
                      color={u.is_active ? "#16A34A" : "#DC2626"}
                      bg={u.is_active ? "#F0FDF4" : "#FEF2F2"}
                      bd={u.is_active ? "#BBF7D0" : "#FECACA"}
                    />
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    {!u.is_staff && (
                      <button onClick={() => handleBanClick(u)}
                        style={{
                          padding: "5px 12px", borderRadius: 7, border: "1.5px solid",
                          borderColor: u.is_active ? "var(--danger)" : "#16A34A",
                          color: u.is_active ? "var(--danger)" : "#16A34A",
                          background: u.is_active ? "#FEF2F2" : "#F0FDF4",
                          cursor: "pointer", fontSize: 12, fontWeight: 700,
                        }}>
                        {u.is_active ? "Ban" : "Unban"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={data.page} pages={data.pages} onPage={onPage} />

      {/* ── Ban Reason Modal ─────────────────────────────────────────────── */}
      {banModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1000,
          display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:"white", borderRadius:14, padding:"28px 24px",
            maxWidth:460, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:"#FEF2F2",
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <IAlertTri size={18} color="#DC2626"/>
                </div>
                <h2 style={{ fontSize:17, fontWeight:800, color:"#111827" }}>Ban User</h2>
              </div>
              <button onClick={() => { setBanModal(null); setBanReason(""); }}
                style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
                <IClose size={18} color="var(--text-p)"/>
              </button>
            </div>
            {/* Body */}
            <div style={{ background:"#FFF7F7", border:"1px solid #FECACA", borderRadius:9,
              padding:"12px 14px", marginBottom:16 }}>
              <p style={{ fontSize:13, color:"#7F1D1D", lineHeight:1.6, margin:0 }}>
                You are about to ban <strong>@{banModal.username}</strong>.
                They will be <strong>unable to log in</strong> and will receive an
                SMS notification with the ban reason.
              </p>
            </div>
            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"var(--text-p)",
                display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                Reason for Ban <span style={{ color:"#DC2626" }}>*</span>
              </label>
              <textarea
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
                rows={3}
                placeholder="e.g. Fraudulent activity, spam messages, violation of platform terms…"
                style={{ width:"100%", padding:"10px 12px", borderRadius:8, fontSize:13,
                  border:`1.5px solid ${banReason.trim() ? "var(--border)" : "#FECACA"}`,
                  outline:"none", resize:"vertical", boxSizing:"border-box", fontFamily:"inherit" }}
                autoFocus
              />
              {!banReason.trim() && (
                <p style={{ fontSize:11, color:"#DC2626", marginTop:4, display:"flex", alignItems:"center", gap:4 }}>
                  <IAlertTri size={11} color="#DC2626"/> A reason is required — it will be shown to the user on login.
                </p>
              )}
            </div>
            {/* Actions */}
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => { setBanModal(null); setBanReason(""); }}
                style={{ flex:1, padding:"11px", borderRadius:9,
                  border:"1.5px solid var(--border)", background:"#fff",
                  fontWeight:700, fontSize:13, cursor:"pointer", color:"var(--text-s)" }}>
                Cancel
              </button>
              <button
                onClick={() => doToggle(banModal.id, banReason)}
                disabled={!banReason.trim() || banLoading}
                style={{ flex:1, padding:"11px", borderRadius:9, border:"none",
                  background: banReason.trim() ? "#DC2626" : "#FCA5A5",
                  color:"white", fontWeight:700, fontSize:13,
                  cursor: banReason.trim() ? "pointer" : "not-allowed",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                {banLoading ? "Banning…" : "Confirm Ban"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Karigar Verification ─────────────────────────────────────────────────
function KarigarsTab() {
  const [data,    setData]    = useState({ results: [], count: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("");   // "" | "true" | "false"
  const [page,    setPage]    = useState(1);
  const [toast,   setToast]   = useState({ msg: "", ok: true });

  const load = useCallback((p = 1, s = "", f = "") => {
    setLoading(true);
    adminListKarigars({ search: s, verified: f, page: p })
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, []);

  const doSearch = () => { setPage(1); load(1, search, filter); };
  const onPage   = (p) => { setPage(p); load(p, search, filter); };
  const onFilter = (f) => { setFilter(f); setPage(1); load(1, search, f); };

  const toggleVerify = async (kpId, currentVerified) => {
    try {
      const res = await adminVerifyKarigar(kpId);
      setData(d => ({
        ...d,
        results: d.results.map(k => k.karigar_profile_id === kpId ? { ...k, is_verified: res.data.is_verified } : k),
      }));
      setToast({ msg: res.data.message, ok: true });
      setTimeout(() => setToast({ msg: "", ok: true }), 3000);
    } catch (e) {
      setToast({ msg: e.response?.data?.error || "Failed.", ok: false });
      setTimeout(() => setToast({ msg: "", ok: true }), 3000);
    }
  };

  return (
    <div>
      {toast.msg && (
        <div className={`alert ${toast.ok ? "alert-ok" : "alert-err"}`} style={{ marginBottom: 14, fontSize: 13 }}>
          {toast.ok ? <ICheckCirc size={13} /> : <IAlertCirc size={13} />} {toast.msg}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flex: 1, minWidth: 220, border: "1.5px solid var(--border)", borderRadius: 8, background: "#fff", overflow: "hidden" }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doSearch()}
            placeholder="Search karigar name, category, district…"
            style={{ flex: 1, padding: "9px 12px", border: "none", outline: "none", fontSize: 13 }} />
          <button onClick={doSearch}
            style={{ padding: "0 14px", border: "none", background: "var(--primary)", color: "white", cursor: "pointer" }}>
            <ISearch size={15} color="white" />
          </button>
        </div>
        {[["", "All"], ["false", "Unverified"], ["true", "Verified"]].map(([v, l]) => (
          <button key={v} onClick={() => onFilter(v)}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "1.5px solid",
              borderColor: filter === v ? "var(--primary)" : "var(--border)",
              background: filter === v ? "var(--primary)" : "#fff",
              color: filter === v ? "white" : "var(--text-s)",
              fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>{l}</button>
        ))}
      </div>

      <div style={{ fontSize: 12, color: "var(--text-p)", marginBottom: 10 }}>
        {data.count} karigar{data.count !== 1 ? "s" : ""} found
      </div>

      {loading ? <Spinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.results.length === 0 ? (
            <div className="card" style={{ padding: "40px", textAlign: "center", color: "var(--text-p)" }}>No karigars found</div>
          ) : data.results.map(k => (
            <div key={k.karigar_profile_id} className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <Avatar src={k.profile_image} name={k.full_name} size={44} />
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-h)" }}>{k.full_name}</span>
                  <span style={{ fontSize: 12, color: "var(--text-p)" }}>@{k.username}</span>
                  {k.is_verified && <Badge label="Verified" color="#16A34A" bg="#F0FDF4" bd="#BBF7D0" />}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-s)", marginTop: 3 }}>
                  {k.category || "No category"}{k.district ? ` · ${k.district}` : ""}
                  {k.hourly_rate ? ` · NPR ${parseFloat(k.hourly_rate).toLocaleString()}/hr` : ""}
                  {` · ${k.experience_years} yrs exp`}
                  {` · ${k.total_jobs} jobs`}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ textAlign: "right", fontSize: 12, color: "var(--text-p)" }}>
                  Joined {k.date_joined}
                </div>
                <button
                  onClick={() => {
                    if (confirm(`${k.is_verified ? "Remove verification from" : "Verify"} @${k.username}?`))
                      toggleVerify(k.karigar_profile_id, k.is_verified);
                  }}
                  style={{
                    padding: "6px 14px", borderRadius: 8, border: "1.5px solid",
                    borderColor: k.is_verified ? "var(--danger)" : "#16A34A",
                    color: k.is_verified ? "var(--danger)" : "#16A34A",
                    background: k.is_verified ? "#FEF2F2" : "#F0FDF4",
                    fontWeight: 700, fontSize: 12, cursor: "pointer",
                  }}>
                  {k.is_verified ? "Unverify" : "Verify"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={data.page} pages={data.pages} onPage={onPage} />
    </div>
  );
}

// ── Tab: Bookings ─────────────────────────────────────────────────────────────
function BookingsTab() {
  const [data,    setData]    = useState({ results: [], count: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState("");
  const [page,    setPage]    = useState(1);

  const load = useCallback((p = 1, s = "", st = "") => {
    setLoading(true);
    adminListBookings({ search: s, status: st, page: p })
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, []);

  const doSearch = () => { setPage(1); load(1, search, status); };
  const onPage   = (p) => { setPage(p); load(p, search, status); };
  const onStatus = (st) => { setStatus(st); setPage(1); load(1, search, st); };

  const STATUS_OPTS = ["", "pending", "bargaining", "accepted", "completed", "rejected", "cancelled"];

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flex: 1, minWidth: 220, border: "1.5px solid var(--border)", borderRadius: 8, background: "#fff", overflow: "hidden" }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doSearch()}
            placeholder="Search customer, karigar, address…"
            style={{ flex: 1, padding: "9px 12px", border: "none", outline: "none", fontSize: 13 }} />
          <button onClick={doSearch}
            style={{ padding: "0 14px", border: "none", background: "var(--primary)", color: "white", cursor: "pointer" }}>
            <ISearch size={15} color="white" />
          </button>
        </div>
        <select value={status} onChange={e => onStatus(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid var(--border)", fontSize: 13, background: "#fff", cursor: "pointer", outline: "none" }}>
          {STATUS_OPTS.map(s => (
            <option key={s} value={s}>{s === "" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div style={{ fontSize: 12, color: "var(--text-p)", marginBottom: 10 }}>
        {data.count} booking{data.count !== 1 ? "s" : ""} found
      </div>

      {loading ? <Spinner /> : (
        <div className="card" style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 700 }}>
            <thead>
              <tr style={{ background: "var(--bg-subtle)", borderBottom: "1.5px solid var(--border)" }}>
                {["#", "Customer", "Karigar", "Service", "Date", "Status", "Rate"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "var(--text-p)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.results.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "var(--text-p)" }}>No bookings found</td></tr>
              ) : data.results.map((b, i) => {
                const st = BOOKING_STYLE[b.status] || BOOKING_STYLE.pending;
                const rate = b.final_rate || b.offered_rate || b.karigar_rate;
                return (
                  <tr key={b.id} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "#fff" : "var(--bg-subtle)" }}>
                    <td style={{ padding: "10px 14px", color: "var(--text-p)", fontWeight: 600 }}>#{b.id}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-h)" }}>{b.customer_name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-p)" }}>@{b.customer_username}</div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-h)" }}>{b.karigar_name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-p)" }}>@{b.karigar_username}</div>
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--text-s)" }}>{b.sub_service_name}</td>
                    <td style={{ padding: "10px 14px", color: "var(--text-s)", whiteSpace: "nowrap" }}>{b.date}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <Badge label={st.label} color={st.color} bg={st.bg} bd={st.bd} />
                      {b.bargain_status && b.bargain_status !== "none" && (
                        <div style={{ fontSize: 10, color: "#7C3AED", marginTop: 3 }}><IMoney size={11}/> {b.bargain_status.replace("_", " ")}</div>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text-h)", whiteSpace: "nowrap" }}>
                      {rate ? `NPR ${parseFloat(rate).toLocaleString()}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={data.page} pages={data.pages} onPage={onPage} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPLAINTS TAB
// ─────────────────────────────────────────────────────────────────────────────
function ComplaintsTab() {
  const [comps,      setComps]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [statusFilt, setStatusFilt] = useState("pending");
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [meta,       setMeta]       = useState({ total:0, pages:1, counts:{} });
  const [selected,   setSelected]   = useState(null);
  const [response,   setResponse]   = useState("");
  const [action,     setAction]     = useState("");
  const [newStatus,  setNewStatus]  = useState("resolved");
  const [acting,     setActing]     = useState(false);
  const [msg,        setMsg]        = useState("");

  const MEDIA_BASE = "http://127.0.0.1:8000";
  const imgUrl = r => !r ? null : r.startsWith("http") ? r : `${MEDIA_BASE}${r.startsWith("/") ? r : "/media/" + r}`;

  const STATUS_CLR = {
    pending:   { color:"#D97706", bg:"#FFFBEB", bd:"#FDE68A"  },
    reviewing: { color:"#2563EB", bg:"#EFF6FF", bd:"#BFDBFE"  },
    resolved:  { color:"#16A34A", bg:"#F0FDF4", bd:"#BBF7D0"  },
    dismissed: { color:"#6B7280", bg:"#F9FAFB", bd:"#E5E7EB"  },
  };

  const CAT_LABELS = {
    poor_work:"Poor Quality Work", misbehaviour:"Misbehaviour", fraud:"Fraud/Scam",
    no_show:"No Show", overcharging:"Overcharging", damage:"Property Damage",
    late_payment:"Late/No Payment", harassment:"Harassment", other:"Other",
  };

  const load = useCallback((p=1) => {
    setLoading(true);
    adminListComplaints({ status:statusFilt, search, page:p })
      .then(r => {
        setComps(r.data.results || []);
        setMeta({ total:r.data.count, pages:r.data.pages, counts:r.data.counts||{} });
        setPage(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilt, search]);

  useEffect(() => { load(1); }, [statusFilt]);

  const respond = async (compId) => {
    if (!response.trim()) { alert("Please enter a response message."); return; }
    setActing(true); setMsg("");
    try {
      await adminRespondComplaint(compId, {
        status:         newStatus,
        admin_response: response,
        action_taken:   action,
      });
      setMsg(`Response sent! SMS delivered to complainant.`);
      setSelected(null); setResponse(""); setAction(""); setNewStatus("resolved");
      load(page);
    } catch(e) {
      setMsg(e.response?.data?.error || "Failed to send response.");
    } finally { setActing(false); }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <h2 style={{ fontSize:16, fontWeight:800, color:"var(--text-h)" }}>
          User Complaints
        </h2>
        {/* Status counts */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["pending","reviewing","resolved","dismissed"].map(s => {
            const st = STATUS_CLR[s];
            const count = meta.counts[s] || 0;
            return (
              <button key={s} onClick={()=>{ setStatusFilt(s); setSelected(null); }}
                style={{ padding:"5px 12px", borderRadius:20, border:`1.5px solid`,
                  fontSize:12, fontWeight:700, cursor:"pointer",
                  borderColor: statusFilt===s ? st.color : "var(--border)",
                  background:  statusFilt===s ? st.bg    : "#fff",
                  color:       statusFilt===s ? st.color : "var(--text-s)" }}>
                {s.charAt(0).toUpperCase()+s.slice(1)} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div style={{ position:"relative", marginBottom:14, maxWidth:340 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          onKeyDown={e=>e.key==="Enter" && load(1)}
          placeholder="Search username or complaint…"
          style={{ width:"100%", padding:"8px 12px 8px 34px", borderRadius:8,
            border:"1.5px solid var(--border)", fontSize:13, outline:"none",
            background:"#fff", boxSizing:"border-box" }}/>
        <span style={{ position:"absolute", left:10, top:"50%",
          transform:"translateY(-50%)", display:"flex" }}>
          <ISearch size={13} color="var(--text-p)"/>
        </span>
      </div>

      {msg && (
        <div style={{ padding:"10px 14px", background:"#F0FDF4", border:"1.5px solid #BBF7D0",
          borderRadius:9, marginBottom:12, fontSize:13, color:"#16A34A", fontWeight:600 }}>
          {msg}
        </div>
      )}

      {loading ? (
        <div style={{ padding:"48px", textAlign:"center", color:"var(--text-p)", fontSize:13 }}>
          Loading complaints…
        </div>
      ) : comps.length === 0 ? (
        <div style={{ padding:"56px", textAlign:"center" }}>
          <IAlertTri size={40} color="var(--text-p)"/>
          <p style={{ fontSize:14, color:"var(--text-s)", marginTop:10 }}>
            No {statusFilt} complaints.
          </p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {comps.map(comp => {
            const s   = STATUS_CLR[comp.status] || STATUS_CLR.pending;
            const exp = selected === comp.id;
            return (
              <div key={comp.id} className="card" style={{ overflow:"hidden" }}>

                {/* Complaint header */}
                <div style={{ padding:"14px 16px", cursor:"pointer", display:"flex",
                  gap:12, alignItems:"flex-start", flexWrap:"wrap" }}
                  onClick={() => setSelected(exp ? null : comp.id)}>
                  {/* Complainant → Accused */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4, flexWrap:"wrap" }}>
                      <span style={{ fontSize:13, fontWeight:700, color:"var(--text-h)" }}>
                        @{comp.complainant_username}
                      </span>
                      <span style={{ fontSize:11, color:"var(--text-p)",
                        background:"var(--bg-subtle)", padding:"1px 6px", borderRadius:20 }}>
                        {comp.complainant_role}
                      </span>
                      <span style={{ fontSize:12, color:"var(--text-p)" }}>complained about</span>
                      <span style={{ fontSize:13, fontWeight:700, color:"#DC2626" }}>
                        @{comp.accused_username}
                      </span>
                      <span style={{ fontSize:11, color:"var(--text-p)",
                        background:"var(--bg-subtle)", padding:"1px 6px", borderRadius:20 }}>
                        {comp.accused_role}
                      </span>
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, color:"var(--text-b)", marginBottom:4 }}>
                      {comp.title}
                    </div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                      <span style={{ padding:"2px 8px", borderRadius:20, fontSize:11,
                        fontWeight:700, background:"#FEF2F2", color:"#DC2626", border:"1px solid #FECACA" }}>
                        {CAT_LABELS[comp.category] || comp.category}
                      </span>
                      <span style={{ padding:"2px 8px", borderRadius:20, fontSize:11,
                        fontWeight:700, background:s.bg, color:s.color, border:`1px solid ${s.bd}` }}>
                        {comp.status.charAt(0).toUpperCase()+comp.status.slice(1)}
                      </span>
                      <span style={{ fontSize:11, color:"var(--text-p)" }}>{comp.created_at}</span>
                      {comp.booking_id && (
                        <span style={{ fontSize:11, color:"var(--text-p)" }}>
                          Booking #{comp.booking_id}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ color:"var(--text-p)", fontSize:14, flexShrink:0 }}>{exp?"▲":"▼"}</span>
                </div>

                {/* Expanded detail */}
                {exp && (
                  <div style={{ borderTop:"1px solid var(--border)", padding:"16px" }}>

                    {/* Description */}
                    <div style={{ background:"var(--bg-subtle)", borderRadius:9,
                      padding:"12px 14px", marginBottom:14, border:"1px solid var(--border)" }}>
                      <p style={{ fontSize:11, fontWeight:700, color:"var(--text-p)",
                        textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>
                        Description
                      </p>
                      <p style={{ fontSize:13, color:"var(--text-b)", lineHeight:1.7, margin:0 }}>
                        {comp.description}
                      </p>
                    </div>

                    {/* Evidence photo */}
                    {comp.evidence && (
                      <div style={{ marginBottom:14 }}>
                        <p style={{ fontSize:11, fontWeight:700, color:"var(--text-p)",
                          textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>
                          Evidence
                        </p>
                        <a href={imgUrl(comp.evidence)} target="_blank" rel="noopener noreferrer">
                          <img src={imgUrl(comp.evidence)} alt="Evidence"
                            style={{ maxWidth:240, maxHeight:160, borderRadius:8, objectFit:"cover",
                              border:"1.5px solid var(--border)", cursor:"pointer" }}/>
                        </a>
                      </div>
                    )}

                    {/* Previous admin response */}
                    {comp.admin_response && (
                      <div style={{ background:"#F0FDF4", border:"1.5px solid #BBF7D0",
                        borderRadius:9, padding:"12px 14px", marginBottom:14 }}>
                        <p style={{ fontSize:11, fontWeight:700, color:"#16A34A",
                          textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>
                          Previous Response by {comp.reviewed_by || "Admin"}
                        </p>
                        <p style={{ fontSize:13, color:"#065F46", lineHeight:1.6, margin:0 }}>
                          {comp.admin_response}
                        </p>
                        {comp.action_taken && (
                          <p style={{ fontSize:12, fontWeight:700, color:"#065F46", marginTop:6 }}>
                            Action Taken: {comp.action_taken}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Admin response form */}
                    {comp.status !== "resolved" && comp.status !== "dismissed" && (
                      <div style={{ background:"#FFFBEB", border:"1.5px solid #FDE68A",
                        borderRadius:10, padding:"16px" }}>
                        <p style={{ fontSize:13, fontWeight:700, color:"#92400E", marginBottom:14,
                          display:"flex", alignItems:"center", gap:6 }}>
                          <IMessage size={14} color="#92400E"/> Respond to Complaint
                        </p>

                        {/* New status */}
                        <div style={{ marginBottom:12 }}>
                          <label style={{ fontSize:11, fontWeight:700, color:"#92400E",
                            display:"block", marginBottom:5, textTransform:"uppercase" }}>
                            Update Status
                          </label>
                          <select value={newStatus} onChange={e=>setNewStatus(e.target.value)}
                            style={{ width:"100%", padding:"9px 11px", borderRadius:8,
                              border:"1.5px solid #FDE68A", fontSize:13, background:"#fff",
                              outline:"none", cursor:"pointer" }}>
                            <option value="reviewing">Under Review</option>
                            <option value="resolved">Resolved</option>
                            <option value="dismissed">Dismissed</option>
                          </select>
                        </div>

                        {/* Response message */}
                        <div style={{ marginBottom:12 }}>
                          <label style={{ fontSize:11, fontWeight:700, color:"#92400E",
                            display:"block", marginBottom:5, textTransform:"uppercase" }}>
                            Response Message * <span style={{ fontWeight:400, fontSize:10 }}>
                              (sent via SMS to complainant)
                            </span>
                          </label>
                          <textarea
                            value={response}
                            onChange={e=>setResponse(e.target.value)}
                            rows={3}
                            placeholder="Explain what action was taken or why the complaint was dismissed…"
                            style={{ width:"100%", padding:"9px 11px", borderRadius:8,
                              border:"1.5px solid #FDE68A", fontSize:13, outline:"none",
                              resize:"vertical", boxSizing:"border-box", fontFamily:"inherit" }}
                          />
                        </div>

                        {/* Action taken */}
                        <div style={{ marginBottom:14 }}>
                          <label style={{ fontSize:11, fontWeight:700, color:"#92400E",
                            display:"block", marginBottom:5, textTransform:"uppercase" }}>
                            Action Taken Against Accused
                          </label>
                          <select value={action} onChange={e=>setAction(e.target.value)}
                            style={{ width:"100%", padding:"9px 11px", borderRadius:8,
                              border:"1.5px solid #FDE68A", fontSize:13, background:"#fff",
                              outline:"none", cursor:"pointer" }}>
                            <option value="">No action taken</option>
                            <option value="Warning issued">Warning Issued</option>
                            <option value="Account temporarily suspended">Temporarily Suspended</option>
                            <option value="Account permanently banned">Permanently Banned</option>
                            <option value="Refund issued">Refund Issued</option>
                            <option value="Mediation conducted">Mediation Conducted</option>
                            <option value="Dismissed - insufficient evidence">Dismissed (Insufficient Evidence)</option>
                            <option value="Dismissed - false complaint">Dismissed (False Complaint)</option>
                          </select>
                        </div>

                        <button onClick={() => respond(comp.id)} disabled={acting||!response.trim()}
                          style={{ width:"100%", padding:"10px", borderRadius:9, border:"none",
                            background: response.trim() ? "#D97706" : "#FDE68A",
                            color: response.trim() ? "white" : "#92400E",
                            fontWeight:700, fontSize:13,
                            cursor: response.trim() ? "pointer" : "not-allowed",
                            display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                          <ISend size={13} color={response.trim()?"white":"#92400E"}/>
                          {acting ? "Sending…" : "Send Response & Notify User via SMS"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.pages > 1 && (
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:20 }}>
          {Array.from({length:meta.pages},(_,i)=>i+1).map(p=>(
            <button key={p} onClick={()=>load(p)}
              style={{ padding:"6px 12px", borderRadius:8, border:"1.5px solid",
                borderColor:p===page?"var(--primary)":"var(--border)",
                background:p===page?"var(--primary)":"#fff",
                color:p===page?"white":"var(--text-h)",
                cursor:"pointer", fontSize:13, fontWeight:600 }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGES TAB — Contact form submissions from About Us page
// ─────────────────────────────────────────────────────────────────────────────
function MessagesTab() {
  const [msgs,       setMsgs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [unread,     setUnread]     = useState(0);
  const [page,       setPage]       = useState(1);
  const [pages,      setPages]      = useState(1);
  const [total,      setTotal]      = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [search,     setSearch]     = useState("");
  const [expanded,   setExpanded]   = useState(null);
  const [toast,      setToast]      = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const load = useCallback((p = 1) => {
    setLoading(true);
    adminListContactMessages({ page: p, unread_only: unreadOnly ? "true" : "", search })
      .then(r => {
        setMsgs(r.data.results || []);
        setUnread(r.data.unread_count || 0);
        setTotal(r.data.count || 0);
        setPages(r.data.pages || 1);
        setPage(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [unreadOnly, search]);

  useEffect(() => { load(1); }, [unreadOnly]);

  const markRead = async (id, replied = false) => {
    try {
      await adminMarkContactRead(id, { replied });
      setMsgs(ms => ms.map(m => m.id === id ? { ...m, is_read: true, replied } : m));
      setUnread(u => Math.max(0, u - 1));
      showToast(replied ? "Marked as replied." : "Marked as read.");
    } catch { showToast("Action failed."); }
  };

  const deleteMsg = async (id) => {
    if (!confirm("Delete this message?")) return;
    try {
      await adminDeleteContactMessage(id);
      setMsgs(ms => ms.filter(m => m.id !== id));
      setTotal(t => t - 1);
      showToast("Message deleted.");
      if (expanded === id) setExpanded(null);
    } catch { showToast("Delete failed."); }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <h2 style={{ fontSize:16, fontWeight:800, color:"var(--text-h)" }}>
            Contact Messages
          </h2>
          {unread > 0 && (
            <span style={{ padding:"2px 10px", borderRadius:20, fontSize:12,
              fontWeight:700, background:"#DC2626", color:"white" }}>
              {unread} unread
            </span>
          )}
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button onClick={() => setUnreadOnly(u => !u)}
            style={{ padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:700,
              cursor:"pointer", border:"1.5px solid",
              borderColor: unreadOnly ? "#2563EB" : "var(--border)",
              background:  unreadOnly ? "#EFF6FF"  : "#fff",
              color:       unreadOnly ? "#2563EB"  : "var(--text-s)" }}>
            {unreadOnly ? "Showing Unread" : "Show All"}
          </button>
          <span style={{ fontSize:12, color:"var(--text-p)" }}>{total} total</span>
        </div>
      </div>

      {/* Search */}
      <div style={{ position:"relative", marginBottom:14, maxWidth:340 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load(1)}
          placeholder="Search name, email, subject…"
          style={{ width:"100%", padding:"8px 12px 8px 34px", borderRadius:8,
            border:"1.5px solid var(--border)", fontSize:13, outline:"none",
            boxSizing:"border-box" }}/>
        <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", display:"flex" }}>
          <ISearch size={13} color="var(--text-p)"/>
        </span>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ padding:"10px 14px", background:"#F0FDF4", border:"1.5px solid #BBF7D0",
          borderRadius:9, marginBottom:12, fontSize:13, color:"#16A34A", fontWeight:600 }}>
          {toast}
        </div>
      )}

      {/* Messages list */}
      {loading ? (
        <div style={{ padding:"48px", textAlign:"center", color:"var(--text-p)", fontSize:13 }}>
          Loading messages…
        </div>
      ) : msgs.length === 0 ? (
        <div style={{ padding:"56px", textAlign:"center" }}>
          <IMail size={40} color="var(--text-p)"/>
          <p style={{ fontSize:14, color:"var(--text-s)", marginTop:10 }}>
            {unreadOnly ? "No unread messages." : "No contact messages yet."}
          </p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {msgs.map(msg => {
            const exp = expanded === msg.id;
            return (
              <div key={msg.id} className="card"
                style={{ overflow:"hidden", opacity: msg.is_read ? 0.85 : 1,
                  borderLeft: msg.is_read ? "3px solid var(--border)" : "3px solid #2563EB" }}>

                {/* Header row */}
                <div style={{ padding:"14px 16px", display:"flex", gap:12,
                  alignItems:"flex-start", cursor:"pointer" }}
                  onClick={() => {
                    setExpanded(exp ? null : msg.id);
                    if (!msg.is_read) markRead(msg.id);
                  }}>

                  {/* Avatar initial */}
                  <div style={{ width:38, height:38, borderRadius:"50%", flexShrink:0,
                    background: msg.is_read ? "var(--bg-subtle)" : "var(--primary-bg)",
                    border:`2px solid ${msg.is_read ? "var(--border)" : "var(--primary-bd)"}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:15, fontWeight:800,
                    color: msg.is_read ? "var(--text-p)" : "var(--primary)" }}>
                    {msg.name[0]?.toUpperCase() || "?"}
                  </div>

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8,
                      marginBottom:3, flexWrap:"wrap" }}>
                      <span style={{ fontSize:14, fontWeight: msg.is_read ? 600 : 800,
                        color:"var(--text-h)" }}>
                        {msg.name}
                      </span>
                      <span style={{ fontSize:12, color:"var(--text-s)" }}>
                        {msg.email}
                      </span>
                      {!msg.is_read && (
                        <span style={{ padding:"1px 8px", borderRadius:20, fontSize:11,
                          fontWeight:700, background:"#2563EB", color:"white" }}>
                          New
                        </span>
                      )}
                      {msg.replied && (
                        <span style={{ padding:"1px 8px", borderRadius:20, fontSize:11,
                          fontWeight:700, background:"#F0FDF4", color:"#16A34A",
                          border:"1px solid #BBF7D0" }}>
                          Replied
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, color:"var(--text-b)",
                      marginBottom:2, whiteSpace:"nowrap", overflow:"hidden",
                      textOverflow:"ellipsis", maxWidth:400 }}>
                      {msg.subject}
                    </div>
                    <div style={{ fontSize:12, color:"var(--text-s)",
                      whiteSpace:"nowrap", overflow:"hidden",
                      textOverflow:"ellipsis", maxWidth:400 }}>
                      {msg.message.slice(0, 80)}{msg.message.length > 80 ? "…" : ""}
                    </div>
                  </div>

                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:11, color:"var(--text-p)", marginBottom:4 }}>
                      {msg.created_at}
                    </div>
                    <span style={{ color:"var(--text-p)", fontSize:14 }}>{exp ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Expanded */}
                {exp && (
                  <div style={{ borderTop:"1px solid var(--border)", padding:"16px" }}>

                    {/* Full message */}
                    <div style={{ background:"var(--bg-subtle)", borderRadius:9,
                      padding:"14px 16px", marginBottom:16,
                      border:"1px solid var(--border)" }}>
                      <p style={{ fontSize:11, fontWeight:700, color:"var(--text-p)",
                        textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>
                        Full Message
                      </p>
                      <p style={{ fontSize:14, color:"var(--text-b)", lineHeight:1.8,
                        margin:0, whiteSpace:"pre-wrap" }}>
                        {msg.message}
                      </p>
                    </div>

                    {/* Reply instructions */}
                    <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE",
                      borderRadius:9, padding:"12px 14px", marginBottom:14,
                      fontSize:13, color:"#1D4ED8", lineHeight:1.6 }}>
                      <strong>To reply:</strong> Send an email to{" "}
                      <a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                        style={{ color:"#1D4ED8", fontWeight:700 }}>
                        {msg.email}
                      </a>
                      {" "}— click the link to open in your email client.
                    </div>

                    {/* Actions */}
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      <a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                        style={{ padding:"8px 16px", borderRadius:8, border:"none",
                          background:"var(--primary)", color:"white",
                          fontWeight:700, fontSize:13, textDecoration:"none",
                          display:"flex", alignItems:"center", gap:6 }}
                        onClick={() => markRead(msg.id, true)}>
                        <IMail size={13} color="white"/> Reply via Email
                      </a>
                      {!msg.replied && (
                        <button onClick={() => markRead(msg.id, true)}
                          style={{ padding:"8px 16px", borderRadius:8,
                            border:"1.5px solid #BBF7D0", background:"#F0FDF4",
                            color:"#16A34A", fontWeight:700, fontSize:13, cursor:"pointer",
                            display:"flex", alignItems:"center", gap:6 }}>
                          <ICheckCirc size={13} color="#16A34A"/> Mark as Replied
                        </button>
                      )}
                      {!msg.is_read && (
                        <button onClick={() => markRead(msg.id, false)}
                          style={{ padding:"8px 16px", borderRadius:8,
                            border:"1.5px solid var(--border)", background:"#fff",
                            color:"var(--text-s)", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                          Mark as Read
                        </button>
                      )}
                      <button onClick={() => deleteMsg(msg.id)}
                        style={{ padding:"8px 14px", borderRadius:8,
                          border:"1.5px solid #FECACA", background:"#FEF2F2",
                          color:"#DC2626", fontWeight:600, fontSize:13, cursor:"pointer",
                          display:"flex", alignItems:"center", gap:6, marginLeft:"auto" }}>
                        <IClose size={13} color="#DC2626"/> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:20 }}>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => load(p)}
              style={{ padding:"6px 12px", borderRadius:8, border:"1.5px solid",
                borderColor: p === page ? "var(--primary)" : "var(--border)",
                background:  p === page ? "var(--primary)" : "#fff",
                color:       p === page ? "white" : "var(--text-h)",
                cursor:"pointer", fontSize:13, fontWeight:600 }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}