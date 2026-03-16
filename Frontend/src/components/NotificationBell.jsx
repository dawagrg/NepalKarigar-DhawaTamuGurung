import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications } from "../services/api";
import { IBell } from "./Icons";
import { timeAgo } from "../utils";

const TYPE_STYLE = {
  success: { color: "#16A34A", bg: "#F0FDF4", dot: "#16A34A" },
  error:   { color: "#DC2626", bg: "#FEF2F2", dot: "#DC2626" },
  info:    { color: "#2563EB", bg: "#EFF6FF", dot: "#2563EB" },
  bargain: { color: "#7C3AED", bg: "#F5F3FF", dot: "#7C3AED" },
};

export default function NotificationBell() {
  const navigate    = useNavigate();
  const [notifs,    setNotifs]  = useState([]);
  const [open,      setOpen]    = useState(false);
  const [unread,    setUnread]  = useState(0);
  const [loading,   setLoading] = useState(false);
  const dropRef = useRef();
  const seenRef = useRef(new Set(JSON.parse(localStorage.getItem("seen_notifs") || "[]")));

  const load = async () => {
    if (!localStorage.getItem("access_token")) return;
    try {
      const res = await getNotifications();
      const items = res.data.results || [];
      setNotifs(items);
      const newCount = items.filter(n => !seenRef.current.has(n.id)).length;
      setUnread(newCount);
    } catch { /* silent */ }
  };

  // Poll every 30 seconds
  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const fn = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) {
      // Mark all as seen
      const allIds = notifs.map(n => n.id);
      allIds.forEach(id => seenRef.current.add(id));
      localStorage.setItem("seen_notifs", JSON.stringify([...seenRef.current].slice(-100)));
      setUnread(0);
    }
  };

  const handleClick = (n) => {
    setOpen(false);
    if (n.booking_id) navigate("/my-bookings");
  };

  if (!localStorage.getItem("access_token")) return null;

  return (
    <div ref={dropRef} style={{ position: "relative" }}>
      {/* Bell button */}
      <button onClick={handleOpen}
        style={{ position: "relative", width: 36, height: 36, borderRadius: 9, border: "1.5px solid var(--border)", background: open ? "var(--primary-bg)" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: open ? "var(--primary)" : "var(--text-s)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span style={{ position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, background: "#DC2626", color: "white", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", border: "2px solid white" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 320, background: "white", border: "1.5px solid var(--border)", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 200, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-h)" }}>Notifications</span>
            <span style={{ fontSize: 11, color: "var(--text-p)", fontWeight: 600 }}>Last 3 days</span>
          </div>

          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {notifs.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-p)", fontSize: 13 }}>
                <div style={{ marginBottom: 8 }}><IBell size={28} color="var(--text-p)"/></div>
                No notifications yet.
              </div>
            ) : notifs.map(n => {
              const s = TYPE_STYLE[n.type] || TYPE_STYLE.info;
              const isNew = !seenRef.current.has(n.id) || unread > 0;
              return (
                <div key={n.id} onClick={() => handleClick(n)}
                  style={{ padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #F9FAFB", background: isNew ? "#FAFEFF" : "white", display: "flex", gap: 10, alignItems: "flex-start" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                  onMouseLeave={e => e.currentTarget.style.background = isNew ? "#FAFEFF" : "white"}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot, flexShrink: 0, marginTop: 5 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, color: "var(--text-b)", lineHeight: 1.5, margin: 0, marginBottom: 3 }}>{n.msg}</p>
                    <span style={{ fontSize: 11, color: "var(--text-p)" }}>{timeAgo(n.ts)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: "10px 16px", borderTop: "1px solid #F3F4F6", textAlign: "center" }}>
            <button onClick={() => { navigate("/my-bookings"); setOpen(false); }}
              style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", background: "none", border: "none", cursor: "pointer" }}>
              View All Bookings →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}