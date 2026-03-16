import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { adminGetNotifications, adminMarkNotificationsRead, adminClearNotifications } from "../services/api";
import { IBell, IClose, ICheckCirc, IRefresh, IUser, IClipboard, IWrench, IStar, ICheckSquare } from "../components/Icons";

const TYPE_CONFIG = {
  new_application:  { color:"#7C3AED", bg:"#F5F3FF", label:"Application" },
  new_booking:      { color:"#2563EB", bg:"#EFF6FF", label:"Booking"     },
  new_user:         { color:"#16A34A", bg:"#F0FDF4", label:"New User"    },
  review_posted:    { color:"#D97706", bg:"#FFFBEB", label:"Review"      },
  booking_complete: { color:"#0891B2", bg:"#F0F9FF", label:"Completed"   },
  report:           { color:"#DC2626", bg:"#FEF2F2", label:"Report"      },
};

const TYPE_ICON = {
  new_application:  <IWrench size={13}/>,
  new_booking:      <IClipboard size={13}/>,
  new_user:         <IUser size={13}/>,
  review_posted:    <IStar size={13}/>,
  booking_complete: <ICheckSquare size={13}/>,
};

function timeAgo(iso) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)     return "just now";
  if (diff < 3600)   return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

export default function AdminNotificationBell() {
  const navigate    = useNavigate();
  const [open,      setOpen]    = useState(false);
  const [notifs,    setNotifs]  = useState([]);
  const [unread,    setUnread]  = useState(0);
  const [loading,   setLoading] = useState(false);
  const dropRef = useRef();

  const load = async () => {
    if (!localStorage.getItem("is_staff") === "true") return;
    try {
      const res = await adminGetNotifications({ page: 1 });
      setNotifs(res.data.results || []);
      setUnread(res.data.unread_count || 0);
    } catch { /* silent */ }
  };

  // Poll every 20 seconds
  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const fn = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const handleOpen = async () => {
    const nowOpen = !open;
    setOpen(nowOpen);
    if (nowOpen && unread > 0) {
      // Mark all as read when dropdown opens
      try {
        await adminMarkNotificationsRead({});
        setUnread(0);
        setNotifs(ns => ns.map(n => ({ ...n, is_read: true })));
      } catch { /* silent */ }
    }
  };

  const handleClear = async (e) => {
    e.stopPropagation();
    try {
      await adminClearNotifications();
      setNotifs([]);
      setUnread(0);
    } catch { /* silent */ }
  };

  const cfg = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.new_user;

  return (
    <div ref={dropRef} style={{ position:"relative" }}>
      {/* Bell button */}
      <button onClick={handleOpen}
        style={{ position:"relative", width:38, height:38, borderRadius:9,
          border:`1.5px solid ${open?"var(--primary)":"var(--border)"}`,
          background: open ? "var(--primary-bg)" : "#fff",
          cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
          color: open ? "var(--primary)" : "var(--text-s)" }}>
        <IBell size={16}/>
        {unread > 0 && (
          <span style={{ position:"absolute", top:-5, right:-5,
            minWidth:18, height:18, borderRadius:9, background:"#DC2626",
            color:"white", fontSize:10, fontWeight:700,
            display:"flex", alignItems:"center", justifyContent:"center",
            padding:"0 4px", border:"2px solid white" }}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, width:360,
          background:"white", border:"1.5px solid var(--border)", borderRadius:12,
          boxShadow:"0 8px 32px rgba(0,0,0,0.14)", zIndex:300, overflow:"hidden" }}>

          {/* Header */}
          <div style={{ padding:"12px 16px", borderBottom:"1px solid #F3F4F6",
            display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <IBell size={14} color="var(--primary)"/>
              <span style={{ fontSize:14, fontWeight:700, color:"var(--text-h)" }}>
                Admin Notifications
              </span>
              {unread > 0 && (
                <span style={{ padding:"1px 7px", borderRadius:20, background:"#DC2626",
                  color:"white", fontSize:10, fontWeight:700 }}>{unread}</span>
              )}
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={() => { load(); }} title="Refresh"
                style={{ background:"none", border:"none", cursor:"pointer", padding:4,
                  color:"var(--text-p)", display:"flex" }}>
                <IRefresh size={13}/>
              </button>
              {notifs.some(n=>n.is_read) && (
                <button onClick={handleClear} title="Clear read"
                  style={{ background:"none", border:"none", cursor:"pointer",
                    padding:"2px 8px", borderRadius:5, fontSize:11, fontWeight:600,
                    color:"var(--text-p)", border:"1px solid var(--border)" }}>
                  Clear read
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight:400, overflowY:"auto" }}>
            {notifs.length === 0 ? (
              <div style={{ padding:"40px 16px", textAlign:"center", color:"var(--text-p)" }}>
                <IBell size={32} color="var(--border)"/>
                <p style={{ fontSize:13, marginTop:10 }}>No notifications yet.</p>
              </div>
            ) : notifs.map(n => {
              const s = cfg(n.type);
              return (
                <div key={n.id}
                  style={{ padding:"12px 16px", borderBottom:"1px solid #F9FAFB",
                    background: n.is_read ? "white" : "#FAFEFF",
                    cursor:"pointer", display:"flex", gap:10, alignItems:"flex-start" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#F9FAFB"}
                  onMouseLeave={e=>e.currentTarget.style.background=n.is_read?"white":"#FAFEFF"}
                  onClick={() => { setOpen(false); navigate("/admin-dashboard"); }}>
                  {/* Type badge */}
                  <div style={{ width:28, height:28, borderRadius:8, background:s.bg,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    flexShrink:0, color:s.color }}>
                    {TYPE_ICON[n.type] || <IBell size={13}/>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:s.color,
                        background:s.bg, padding:"1px 6px", borderRadius:20 }}>
                        {s.label}
                      </span>
                      {!n.is_read && (
                        <span style={{ width:6, height:6, borderRadius:"50%",
                          background:"#2563EB", flexShrink:0 }}/>
                      )}
                    </div>
                    <p style={{ fontSize:13, color:"var(--text-b)", lineHeight:1.5,
                      margin:0, marginBottom:3 }}>{n.message}</p>
                    <span style={{ fontSize:11, color:"var(--text-p)" }}>
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ padding:"10px 16px", borderTop:"1px solid #F3F4F6",
            display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:11, color:"var(--text-p)" }}>
              {notifs.length} notification{notifs.length !== 1 ? "s" : ""}
            </span>
            <button onClick={() => { setOpen(false); navigate("/admin-dashboard"); }}
              style={{ fontSize:12, fontWeight:700, color:"var(--primary)",
                background:"none", border:"none", cursor:"pointer" }}>
              Open Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}