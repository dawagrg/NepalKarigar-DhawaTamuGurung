import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listMyComplaints } from "../services/api";
import { IAlertTri, ICheckCirc, IAlertCirc, IClipboard, IRefresh } from "../components/Icons";

const STATUS_STYLE = {
  pending:   { color:"#D97706", bg:"#FFFBEB", bd:"#FDE68A",  label:"Pending Review"  },
  reviewing: { color:"#2563EB", bg:"#EFF6FF", bd:"#BFDBFE",  label:"Under Review"    },
  resolved:  { color:"#16A34A", bg:"#F0FDF4", bd:"#BBF7D0",  label:"Resolved"        },
  dismissed: { color:"#6B7280", bg:"#F9FAFB", bd:"#E5E7EB",  label:"Dismissed"       },
};

const CAT_LABELS = {
  poor_work:"Poor Quality Work", misbehaviour:"Misbehaviour / Rude",
  fraud:"Fraud / Scam", no_show:"Did Not Show Up", overcharging:"Overcharging",
  damage:"Property Damage", late_payment:"Late / No Payment",
  harassment:"Harassment", other:"Other",
};

const MEDIA_BASE = "http://127.0.0.1:8000";
const imgUrl = r => !r ? null : r.startsWith("http") ? r : `${MEDIA_BASE}${r.startsWith("/") ? r : "/media/" + r}`;

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <span style={{ padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700,
      color:s.color, background:s.bg, border:`1px solid ${s.bd}` }}>
      {s.label}
    </span>
  );
}

export default function MyComplaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [expanded,   setExpanded]   = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("access_token")) { navigate("/login"); return; }
    load();
  }, []);

  const load = () => {
    setLoading(true);
    listMyComplaints()
      .then(r => setComplaints(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"var(--bg-page)", paddingTop:70 }}>
      <div style={{ maxWidth:780, margin:"0 auto", padding:"32px 20px" }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ height:80, borderRadius:12, background:"#E5E7EB",
            marginBottom:12, animation:"skPulse 1.4s ease-in-out infinite" }}/>
        ))}
        <style>{`@keyframes skPulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-page)", paddingTop:70 }}>
      <div style={{ maxWidth:780, margin:"0 auto", padding:"28px 20px" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
          gap:12, marginBottom:22, flexWrap:"wrap" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:"#FEF2F2",
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                <IAlertTri size={18} color="#DC2626"/>
              </div>
              <h1 style={{ fontSize:22, fontWeight:800, color:"var(--text-h)" }}>
                My Complaints
              </h1>
            </div>
            <p style={{ fontSize:13, color:"var(--text-s)", marginLeft:46 }}>
              Complaints you have filed. You will receive an SMS once admin responds.
            </p>
          </div>
          <button onClick={load}
            style={{ padding:"7px 14px", borderRadius:8, border:"1.5px solid var(--border)",
              background:"#fff", cursor:"pointer", fontSize:12, fontWeight:600,
              color:"var(--text-s)", display:"flex", alignItems:"center", gap:5 }}>
            <IRefresh size={12}/> Refresh
          </button>
        </div>

        {/* Info Banner */}
        <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:10,
          padding:"12px 16px", marginBottom:20, fontSize:13, color:"#1D4ED8", lineHeight:1.6 }}>
          <strong>How it works:</strong> Your complaint is reviewed by our admin team within
          1–2 business days. You will receive an <strong>SMS notification</strong> on your
          registered number once action is taken.
        </div>

        {complaints.length === 0 ? (
          <div style={{ textAlign:"center", padding:"64px 20px" }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:"var(--bg-subtle)",
              display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
              <IClipboard size={28} color="var(--text-p)"/>
            </div>
            <h2 style={{ fontSize:17, fontWeight:700, color:"var(--text-h)", marginBottom:8 }}>
              No complaints filed
            </h2>
            <p style={{ fontSize:13, color:"var(--text-s)", marginBottom:20 }}>
              You haven't filed any complaints yet. You can file one from the My Bookings page.
            </p>
            <button onClick={() => navigate("/my-bookings")}
              className="btn btn-primary btn-sm">
              Go to My Bookings
            </button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {complaints.map(comp => {
              const s   = STATUS_STYLE[comp.status] || STATUS_STYLE.pending;
              const exp = expanded === comp.id;

              return (
                <div key={comp.id} className="card" style={{ overflow:"hidden" }}>

                  {/* Card header */}
                  <div style={{ padding:"14px 18px", cursor:"pointer", display:"flex",
                    gap:12, alignItems:"flex-start" }}
                    onClick={() => setExpanded(exp ? null : comp.id)}>

                    {/* Status indicator */}
                    <div style={{ width:10, height:10, borderRadius:"50%", flexShrink:0,
                      background:s.color, marginTop:4 }}/>

                    <div style={{ flex:1, minWidth:0 }}>
                      {/* Title row */}
                      <div style={{ display:"flex", alignItems:"center", gap:8,
                        marginBottom:4, flexWrap:"wrap" }}>
                        <span style={{ fontSize:14, fontWeight:700, color:"var(--text-h)" }}>
                          {comp.title}
                        </span>
                        <StatusBadge status={comp.status}/>
                      </div>

                      {/* Accused + Category */}
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap",
                        alignItems:"center", marginBottom:3 }}>
                        <span style={{ fontSize:12, color:"var(--text-s)" }}>Against:</span>
                        <span style={{ fontSize:12, fontWeight:700, color:"#DC2626" }}>
                          @{comp.accused_username}
                        </span>
                        <span style={{ fontSize:11, color:"var(--text-p)",
                          background:"var(--bg-subtle)", padding:"1px 6px", borderRadius:20 }}>
                          {comp.accused_role}
                        </span>
                        <span style={{ fontSize:11,
                          background:"#FEF2F2", padding:"1px 7px", borderRadius:20,
                          border:"1px solid #FECACA", color:"#DC2626", fontWeight:600 }}>
                          {CAT_LABELS[comp.category] || comp.category}
                        </span>
                      </div>

                      <span style={{ fontSize:11, color:"var(--text-p)" }}>
                        Filed: {comp.created_at}
                        {comp.booking_id && ` · Booking #${comp.booking_id}`}
                      </span>
                    </div>

                    <span style={{ color:"var(--text-p)", fontSize:14, flexShrink:0 }}>
                      {exp ? "▲" : "▼"}
                    </span>
                  </div>

                  {/* Expanded detail */}
                  {exp && (
                    <div style={{ borderTop:"1px solid var(--border)", padding:"16px 18px" }}>

                      {/* Description */}
                      <div style={{ background:"var(--bg-subtle)", borderRadius:9,
                        padding:"12px 14px", marginBottom:14,
                        border:"1px solid var(--border)" }}>
                        <p style={{ fontSize:11, fontWeight:700, color:"var(--text-p)",
                          textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>
                          Your Description
                        </p>
                        <p style={{ fontSize:13, color:"var(--text-b)", lineHeight:1.7, margin:0 }}>
                          {comp.description}
                        </p>
                      </div>

                      {/* Evidence */}
                      {comp.evidence && (
                        <div style={{ marginBottom:14 }}>
                          <p style={{ fontSize:11, fontWeight:700, color:"var(--text-p)",
                            textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>
                            Evidence Submitted
                          </p>
                          <a href={imgUrl(comp.evidence)} target="_blank" rel="noopener noreferrer">
                            <img src={imgUrl(comp.evidence)} alt="Evidence"
                              style={{ maxWidth:200, maxHeight:140, borderRadius:8,
                                objectFit:"cover", border:"1.5px solid var(--border)" }}/>
                          </a>
                        </div>
                      )}

                      {/* Admin Response */}
                      {comp.admin_response ? (
                        <div style={{ background: comp.status === "resolved" ? "#F0FDF4" : comp.status === "dismissed" ? "#F9FAFB" : "#EFF6FF",
                          border:`1.5px solid ${comp.status === "resolved" ? "#BBF7D0" : comp.status === "dismissed" ? "#E5E7EB" : "#BFDBFE"}`,
                          borderRadius:10, padding:"14px 16px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                            {comp.status === "resolved"
                              ? <ICheckCirc size={16} color="#16A34A"/>
                              : <IAlertCirc size={16} color={comp.status === "dismissed" ? "#6B7280" : "#2563EB"}/>
                            }
                            <span style={{ fontSize:13, fontWeight:700,
                              color: comp.status === "resolved" ? "#065F46" : comp.status === "dismissed" ? "#374151" : "#1D4ED8" }}>
                              Admin Response
                              {comp.reviewed_by && ` — by ${comp.reviewed_by}`}
                            </span>
                          </div>
                          <p style={{ fontSize:13, color:"var(--text-b)", lineHeight:1.7, margin:0 }}>
                            {comp.admin_response}
                          </p>
                          {comp.action_taken && (
                            <div style={{ marginTop:10, display:"inline-flex", alignItems:"center",
                              gap:6, background:"white", borderRadius:8, padding:"6px 12px",
                              fontSize:12, fontWeight:700, color:"var(--text-h)",
                              border:"1px solid var(--border)" }}>
                              <IAlertTri size={12} color="#D97706"/>
                              Action Taken: {comp.action_taken}
                            </div>
                          )}
                          {comp.resolved_at && (
                            <p style={{ fontSize:11, color:"var(--text-p)", marginTop:8 }}>
                              Resolved on: {comp.resolved_at}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div style={{ background:"#FFFBEB", border:"1.5px solid #FDE68A",
                          borderRadius:10, padding:"14px 16px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <IAlertCirc size={16} color="#D97706"/>
                            <div>
                              <p style={{ fontSize:13, fontWeight:600, color:"#92400E", margin:0 }}>
                                Awaiting Admin Review
                              </p>
                              <p style={{ fontSize:12, color:"#92400E", margin:0, marginTop:2 }}>
                                You will receive an SMS once the admin responds.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}