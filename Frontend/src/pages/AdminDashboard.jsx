import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  adminGetStats, adminListUsers, adminToggleUser,
  adminListKarigars, adminVerifyKarigar, adminListBookings,
} from "../services/api";
import { IUser, IWrench, ICheckCirc, IAlertCirc, ISearch, IShield } from "../components/Icons";

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
  { id: "overview",  label: "Overview" },
  { id: "users",     label: "Users" },
  { id: "karigars",  label: "Karigar Verification" },
  { id: "bookings",  label: "Bookings" },
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

        {tab === "overview"  && <OverviewTab />}
        {tab === "users"     && <UsersTab />}
        {tab === "karigars"  && <KarigarsTab />}
        {tab === "bookings"  && <BookingsTab />}

      </div>
    </div>
  );
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────
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
        <StatCard label="Total Bookings" value={bookings.total}      sub={`+${bookings.new_this_week} this week`} color="var(--primary)" icon={<span style={{ fontSize: 18 }}>📋</span>} />
        <StatCard label="Pending"        value={bookings.pending}     color="#D97706" icon={<span style={{ fontSize: 18 }}>⏳</span>} />
        <StatCard label="Bargaining"     value={bookings.bargaining}  color="#7C3AED" icon={<span style={{ fontSize: 18 }}>💰</span>} />
        <StatCard label="Accepted"       value={bookings.accepted}    color="#16A34A" icon={<span style={{ fontSize: 18 }}>✅</span>} />
        <StatCard label="Completed"      value={bookings.completed}   color="#2563EB" icon={<span style={{ fontSize: 18 }}>🏁</span>} />
        <StatCard label="Cancelled"      value={bookings.cancelled}   color="#6B7280" icon={<span style={{ fontSize: 18 }}>❌</span>} />
      </div>

      {/* Other */}
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-p)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
        Platform
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
        <StatCard label="Service Categories" value={categories} color="#0891B2" icon={<span style={{ fontSize: 18 }}>🔧</span>} />
        <StatCard label="Reviews"            value={reviews}    color="#D97706" icon={<span style={{ fontSize: 18 }}>⭐</span>} />
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

  const toggleUser = async (id) => {
    try {
      const res = await adminToggleUser(id);
      setData(d => ({ ...d, results: d.results.map(u => u.id === id ? { ...u, is_active: res.data.is_active } : u) }));
      setToast(res.data.message);
      setTimeout(() => setToast(""), 3000);
    } catch (e) {
      setToast(e.response?.data?.error || "Action failed.");
      setTimeout(() => setToast(""), 3000);
    }
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
                      <button onClick={() => {
                        if (confirm(`${u.is_active ? "Ban" : "Unban"} @${u.username}?`)) toggleUser(u.id);
                      }}
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
                  {k.is_verified && <Badge label="✓ Verified" color="#16A34A" bg="#F0FDF4" bd="#BBF7D0" />}
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
                  {k.is_verified ? "Unverify" : "✓ Verify"}
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
                        <div style={{ fontSize: 10, color: "#7C3AED", marginTop: 3 }}>💰 {b.bargain_status.replace("_", " ")}</div>
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