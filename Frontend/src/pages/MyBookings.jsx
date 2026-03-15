import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  listBookings, getBooking, cancelBooking, respondBooking,
  bargainOffer, bargainCounter, bargainAcceptCounter,
  submitReview, markBookingComplete,
} from "../services/api";
import { ICheckCirc, IAlertCirc, IUser } from "../components/Icons";
import { BookingCardSkeleton, EmptyState } from "../components/Skeleton";
import { formatNPR } from "../utils";

function Stars({ rating, size = 14, interactive = false, onRate }) {
  const [hover, setHover] = useState(0);
  const r = parseFloat(rating) || 0;
  const display = interactive ? (hover || r) : r;
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= Math.round(display) ? "#F59E0B" : "none"}
          stroke={i <= Math.round(display) ? "#F59E0B" : "#D1D5DB"} strokeWidth="2"
          style={{ cursor: interactive ? "pointer" : "default" }}
          onClick={() => interactive && onRate && onRate(i)}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  );
}

function InlineReviewForm({ booking, onDone, onCancel }) {
  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState("");

  const submit = async () => {
    setErr("");
    if (!rating) { setErr("Please select a star rating."); return; }
    setSaving(true);
    try {
      const res = await submitReview(booking.id, { rating, comment: comment.trim() });
      onDone(res.data);
    } catch(e) {
      console.error("Review submit error:", e.response?.status, e.response?.data);
      const d      = e.response?.data;
      const status = e.response?.status;
      if (!e.response) { setErr("Cannot reach server. Is the backend running?"); return; }
      if (status === 401) { setErr("Session expired — please log out and log in again, then retry."); return; }
      if (status === 403) { setErr(d?.error || "Permission denied. Only customers can review."); return; }
      if (status === 404) { setErr("Booking not found for your account."); return; }
      if (status === 400) { setErr(d?.error || "Bad request: " + JSON.stringify(d)); return; }
      setErr(`Error ${status}: ` + (d?.error || d?.detail || JSON.stringify(d) || "Unknown error"));
    }
    finally { setSaving(false); }
  };

  return (
    <div style={{ background:"#FFFBEB", border:"1.5px solid #FDE68A", borderRadius:10, padding:"14px 16px", marginTop:12 }}>
      <p style={{ fontSize:13, fontWeight:700, color:"#92400E", marginBottom:10 }}>
        ⭐ Rate your experience with {booking.karigar_name}
      </p>
      {err && <div className="alert alert-err" style={{ marginBottom:8, fontSize:12 }}><IAlertCirc size={12}/> {err}</div>}
      <div style={{ marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Stars rating={rating} size={24} interactive onRate={setRating}/>
          {rating > 0 && <span style={{ fontSize:12, fontWeight:600, color:"#92400E" }}>{["","Poor","Fair","Good","Very Good","Excellent"][rating]}</span>}
        </div>
      </div>
      <textarea value={comment} onChange={e=>setComment(e.target.value)} rows={2}
        placeholder="Share your experience…"
        style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:"1.5px solid #FDE68A", fontSize:13,
          outline:"none", resize:"vertical", boxSizing:"border-box", fontFamily:"inherit", background:"#fff", marginBottom:8 }}
        onFocus={e=>e.target.style.borderColor="#F59E0B"}
        onBlur={e=>e.target.style.borderColor="#FDE68A"}/>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={submit} disabled={saving}
          style={{ padding:"7px 16px", borderRadius:7, border:"none", background:"#F59E0B", color:"white",
            fontWeight:700, fontSize:12, cursor:saving?"not-allowed":"pointer", opacity:saving?0.7:1 }}>
          {saving ? "Submitting…" : "Submit Review"}
        </button>
        <button onClick={onCancel}
          style={{ padding:"7px 12px", borderRadius:7, border:"1.5px solid var(--border)", background:"#fff",
            fontWeight:600, fontSize:12, cursor:"pointer", color:"var(--text-s)" }}>Cancel</button>
      </div>
    </div>
  );
}

const MEDIA_BASE = "http://127.0.0.1:8000";
const imgUrl = r => !r ? null : r.startsWith("http") ? r : `${MEDIA_BASE}${r.startsWith("/") ? r : "/media/" + r}`;

const STATUS_STYLE = {
  pending:    { color:"#D97706", bg:"#FFFBEB", bd:"#FDE68A",  label:"Pending"    },
  bargaining: { color:"#7C3AED", bg:"#F5F3FF", bd:"#DDD6FE",  label:"Bargaining" },
  accepted:   { color:"#16A34A", bg:"#F0FDF4", bd:"#BBF7D0",  label:"Accepted"   },
  rejected:   { color:"#DC2626", bg:"#FEF2F2", bd:"#FECACA",  label:"Rejected"   },
  cancelled:  { color:"#6B7280", bg:"#F3F4F6", bd:"#D1D5DB",  label:"Cancelled"  },
  completed:  { color:"#2563EB", bg:"#EFF6FF", bd:"#BFDBFE",  label:"Completed"  },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <span style={{ fontSize:12,fontWeight:700,color:s.color,background:s.bg,
      border:`1px solid ${s.bd}`,borderRadius:20,padding:"2px 10px" }}>{s.label}</span>
  );
}

function Avatar({ src, name, size=38 }) {
  const av = imgUrl(src);
  return (
    <div style={{ width:size,height:size,borderRadius:"50%",overflow:"hidden",flexShrink:0,
      background:"var(--primary-bg)",border:"2px solid var(--primary-bd)",
      display:"flex",alignItems:"center",justifyContent:"center" }}>
      {av ? <img src={av} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
           : <span style={{ fontWeight:700,fontSize:size*0.38,color:"var(--primary)" }}>{(name||"?")[0].toUpperCase()}</span>}
    </div>
  );
}

export default function MyBookings() {
  const navigate = useNavigate();
  const role     = localStorage.getItem("role");
  const isKarigar = role === "karigar";

  const [bookings,  setBookings]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("all");
  const [active,    setActive]    = useState(null);  // expanded booking id
  const [actionErr, setActionErr] = useState({});    // {bookingId: "error"}
  const [actionMsg, setActionMsg] = useState({});

  // Bargain input state per booking
  const [bargainInputs, setBargainInputs] = useState({}); // {id: {rate, msg}}
  // Review form state per booking
  const [reviewOpen, setReviewOpen] = useState({}); // {id: bool}

  useEffect(() => {
    if (!localStorage.getItem("access_token")) { navigate("/login"); return; }
    load();
  }, []);

  const load = () => {
    setLoading(true);
    listBookings()
      .then(r => setBookings(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const setMsg = (id, msg) => setActionMsg(p => ({ ...p, [id]: msg }));
  const setErr = (id, err) => setActionErr(p => ({ ...p, [id]: err }));
  const clearFeedback = id => { setMsg(id,""); setErr(id,""); };

  const doAction = async (id, fn, successMsg) => {
    clearFeedback(id);
    try {
      const res = await fn();
      setBookings(bs => bs.map(b => b.id === id ? res.data : b));
      setMsg(id, successMsg);
    } catch(e) {
      const errMsg = e.response?.data?.error || "Action failed.";
      // If the error includes fresh booking data (status mismatch), sync UI immediately
      if (e.response?.status === 400 && e.response?.data?.booking) {
        setBookings(bs => bs.map(b => b.id === id ? e.response.data.booking : b));
        setErr(id, errMsg + " — Refreshed.");
      // Fallback: fetch fresh booking from server
      } else if (e.response?.status === 400 && errMsg.toLowerCase().includes("current status")) {
        try {
          const fresh = await getBooking(id);
          setBookings(bs => bs.map(b => b.id === id ? fresh.data : b));
          setErr(id, "Page refreshed — current status shown.");
        } catch {
          setErr(id, errMsg);
        }
      } else {
        setErr(id, errMsg);
      }
    }
  };

  const handleReviewDone = (bookingId, reviewData) => {
    setBookings(bs => bs.map(b => b.id === bookingId ? { ...b, has_review: true } : b));
    setReviewOpen(p => ({ ...p, [bookingId]: false }));
    setMsg(bookingId, "Review submitted! Thank you.");
  };

  const filtered = filter === "all" ? bookings
    : bookings.filter(b => b.status === filter);

  const FILTERS = [
    { val:"all",       label:"All" },
    { val:"pending",   label:"Pending" },
    { val:"bargaining",label:"Bargaining" },
    { val:"accepted",  label:"Accepted" },
    { val:"rejected",  label:"Rejected" },
    { val:"cancelled", label:"Cancelled" },
    { val:"completed", label:"Completed" },
  ];

  if (loading) return (
    <div style={{ minHeight:"100vh",background:"var(--bg-page)",paddingTop:70 }}>
      <div style={{ maxWidth:860,margin:"0 auto",padding:"28px 20px" }}>
        <div style={{ height:32,width:200,borderRadius:8,background:"#E5E7EB",marginBottom:22,animation:"skPulse 1.5s ease-in-out infinite" }}/>
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {[1,2,3].map(i=><BookingCardSkeleton key={i}/>)}
        </div>
        <style>{`@keyframes skPulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:"var(--bg-page)",paddingTop:70 }}>
      <div style={{ maxWidth:860,margin:"0 auto",padding:"28px 20px" }}>

        {/* Header */}
        <div style={{ marginBottom:22, display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div>
            <h1 style={{ fontSize:22,fontWeight:800,color:"var(--text-h)",marginBottom:4 }}>
              {isKarigar ? "Incoming Bookings" : "My Bookings"}
            </h1>
            <p style={{ fontSize:13,color:"var(--text-s)" }}>
              {isKarigar ? "Manage booking requests from customers." : "Track and manage your service bookings."}
            </p>
          </div>
          <button onClick={load}
            style={{ padding:"7px 14px", borderRadius:8, border:"1.5px solid var(--border)",
              background:"#fff", cursor:"pointer", fontSize:12, fontWeight:600,
              color:"var(--text-s)", display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
            🔄 Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:20 }}>
          {FILTERS.map(f => {
            const count = f.val === "all" ? bookings.length : bookings.filter(b=>b.status===f.val).length;
            if (f.val !== "all" && count === 0) return null;
            return (
              <button key={f.val} onClick={() => setFilter(f.val)}
                style={{ padding:"6px 14px",borderRadius:20,border:"1.5px solid",fontSize:12,fontWeight:600,cursor:"pointer",
                  borderColor: filter===f.val ? "var(--primary)" : "var(--border)",
                  background:  filter===f.val ? "var(--primary)" : "#fff",
                  color:       filter===f.val ? "white" : "var(--text-s)" }}>
                {f.label} {count > 0 && <span style={{ opacity:.7 }}>({count})</span>}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="card" style={{ overflow:"hidden" }}>
            <EmptyState
              emoji="📋"
              title="No bookings found"
              message={filter !== "all" ? `No ${filter} bookings.` : isKarigar ? "No booking requests yet. Make sure your profile is complete and available." : "You haven't made any bookings yet. Find a karigar to get started."}
              action={!isKarigar ? "Find a Karigar" : null}
              onAction={() => navigate("/search")}
            />
          </div>
        ) : (
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            {filtered.map(b => {
              const isOpen = active === b.id;
              const otherName  = isKarigar ? b.customer_name  : b.karigar_name;
              const otherImage = isKarigar ? b.customer_image : b.karigar_image;
              const otherPhone = isKarigar ? b.customer_phone : b.karigar_phone;
              const bi = bargainInputs[b.id] || { rate:"", msg:"" };
              const setBi = (field, val) => setBargainInputs(p => ({ ...p, [b.id]: { ...p[b.id], [field]: val } }));

              return (
                <div key={b.id} className="card" style={{ overflow:"hidden" }}>

                  {/* Card header — always visible */}
                  <div style={{ padding:"16px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:12 }}
                    onClick={() => setActive(isOpen ? null : b.id)}>
                    <Avatar src={otherImage} name={otherName} size={42}/>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                        <span style={{ fontWeight:700,fontSize:15,color:"var(--text-h)" }}>{otherName}</span>
                        <StatusBadge status={b.status}/>
                        {b.bargain_status !== "none" && b.bargain_status !== "agreed" && (
                          <span style={{ fontSize:11,fontWeight:600,color:"#7C3AED",background:"#F5F3FF",
                            border:"1px solid #DDD6FE",borderRadius:20,padding:"1px 8px" }}>
                            💰 Negotiating
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize:12,color:"var(--text-s)",marginTop:2 }}>
                        {b.sub_service_name || "General Service"} • {b.date}
                      </div>
                    </div>
                    {/* Rate summary */}
                    <div style={{ textAlign:"right",flexShrink:0 }}>
                      {b.final_rate ? (
                        <div style={{ fontSize:14,fontWeight:700,color:"#16A34A" }}>
                          {formatNPR(b.final_rate,"/hr")}
                        </div>
                      ) : b.offered_rate ? (
                        <div style={{ fontSize:13,fontWeight:600,color:"#7C3AED" }}>
                          Offer: {formatNPR(b.offered_rate,"/hr")}
                        </div>
                      ) : b.karigar_rate ? (
                        <div style={{ fontSize:13,fontWeight:600,color:"var(--primary)" }}>
                          {formatNPR(b.karigar_rate,"/hr")}
                        </div>
                      ) : null}
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-p)" strokeWidth="2.5"
                      style={{ transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s",flexShrink:0 }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div style={{ borderTop:"1px solid var(--border)",padding:"16px 18px" }}>

                      {/* Feedback */}
                      {actionMsg[b.id] && <div className="alert alert-ok" style={{ marginBottom:12,fontSize:13 }}><ICheckCirc size={13}/> {actionMsg[b.id]}</div>}
                      {actionErr[b.id] && <div className="alert alert-err" style={{ marginBottom:12,fontSize:13 }}><IAlertCirc size={13}/> {actionErr[b.id]}</div>}

                      {/* Detail rows */}
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14 }}>
                        {[
                          ["Date",    b.date],
                          ["Address", b.address],
                          ["Phone",   otherPhone],
                          ...(b.note ? [["Note", b.note]] : []),
                          ...(b.karigar_rate ? [["Listed Rate", `NPR ${parseFloat(b.karigar_rate).toLocaleString()}/hr`]] : []),
                          ...(b.offered_rate ? [["Customer Offer", `NPR ${parseFloat(b.offered_rate).toLocaleString()}/hr`]] : []),
                          ...(b.counter_rate ? [["Karigar Counter", `NPR ${parseFloat(b.counter_rate).toLocaleString()}/hr`]] : []),
                          ...(b.final_rate   ? [["✓ Agreed Rate", `NPR ${parseFloat(b.final_rate).toLocaleString()}/hr`]] : []),
                          ...(b.bargain_message ? [["Bargain Note", b.bargain_message]] : []),
                        ].map(([l,v]) => (
                          <div key={l} style={{ padding:"8px 10px",background:"var(--bg-subtle)",borderRadius:7,border:"1px solid var(--border)" }}>
                            <div style={{ fontSize:11,color:"var(--text-p)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:2 }}>{l}</div>
                            <div style={{ fontSize:13,color:"var(--text-h)",fontWeight:500 }}>{v}</div>
                          </div>
                        ))}
                      </div>

                      {/* ── CUSTOMER ACTIONS ── */}
                      {!isKarigar && (
                        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>

                          {/* Cancel button */}
                          {["pending","bargaining"].includes(b.status) && (
                            <button className="btn btn-sm"
                              style={{ alignSelf:"flex-start",border:"1.5px solid var(--danger)",color:"var(--danger)",background:"#fff",cursor:"pointer",borderRadius:8,padding:"7px 16px",fontWeight:600,fontSize:13 }}
                              onClick={() => { if(confirm("Cancel this booking?")) doAction(b.id, ()=>cancelBooking(b.id), "Booking cancelled."); }}>
                              Cancel Booking
                            </button>
                          )}

                          {/* Send / update bargain offer */}
                          {["pending","bargaining"].includes(b.status) && b.bargain_status !== "agreed" && (
                            <div style={{ background:"#F5F3FF",border:"1px solid #DDD6FE",borderRadius:10,padding:"14px" }}>
                              <p style={{ fontSize:13,fontWeight:700,color:"#7C3AED",marginBottom:10 }}>
                                💰 {b.bargain_status === "karigar_countered" ? "Karigar countered — accept or re-offer" : "Negotiate Rate"}
                              </p>

                              {/* Accept counter */}
                              {b.bargain_status === "karigar_countered" && b.counter_rate && (
                                <button className="btn btn-sm"
                                  style={{ marginBottom:10,border:"1.5px solid #16A34A",color:"#16A34A",background:"#F0FDF4",cursor:"pointer",borderRadius:8,padding:"7px 16px",fontWeight:600,fontSize:13 }}
                                  onClick={() => doAction(b.id, ()=>bargainAcceptCounter(b.id), `Accepted NPR ${parseFloat(b.counter_rate).toLocaleString()}/hr!`)}>
                                  ✓ Accept NPR {parseFloat(b.counter_rate).toLocaleString()}/hr
                                </button>
                              )}

                              <div style={{ display:"flex",gap:8,alignItems:"flex-end",flexWrap:"wrap" }}>
                                <div style={{ flex:1,minWidth:120 }}>
                                  <label style={{ fontSize:11,fontWeight:700,color:"#7C3AED",display:"block",marginBottom:4,textTransform:"uppercase" }}>
                                    {b.bargain_status === "karigar_countered" ? "Re-offer Rate" : "Offer Rate"} (NPR/hr)
                                  </label>
                                  <input type="number" min="1" value={bi.rate}
                                    onChange={e => setBi("rate", e.target.value)}
                                    placeholder={b.karigar_rate ? String(parseFloat(b.karigar_rate)) : "Enter rate"}
                                    style={{ width:"100%",padding:"8px 10px",borderRadius:7,border:"1.5px solid #DDD6FE",
                                      fontSize:13,fontWeight:600,outline:"none",boxSizing:"border-box" }}/>
                                </div>
                                <div style={{ flex:2,minWidth:160 }}>
                                  <label style={{ fontSize:11,fontWeight:700,color:"#7C3AED",display:"block",marginBottom:4,textTransform:"uppercase" }}>Message (optional)</label>
                                  <input type="text" value={bi.msg}
                                    onChange={e => setBi("msg", e.target.value)}
                                    placeholder="e.g. Long-term work, can you offer discount?"
                                    style={{ width:"100%",padding:"8px 10px",borderRadius:7,border:"1.5px solid #DDD6FE",
                                      fontSize:13,outline:"none",boxSizing:"border-box" }}/>
                                </div>
                                <button
                                  style={{ padding:"8px 16px",borderRadius:8,border:"none",background:"#7C3AED",
                                    color:"white",fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap" }}
                                  onClick={() => {
                                    if (!bi.rate || parseFloat(bi.rate)<=0) { setErr(b.id,"Enter a valid rate."); return; }
                                    doAction(b.id, ()=>bargainOffer(b.id,{offered_rate:bi.rate,message:bi.msg}), "Offer sent!");
                                    setBi("rate",""); setBi("msg","");
                                  }}>
                                  Send Offer
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── REVIEW (Customer, completed bookings) ── */}
                      {!isKarigar && b.status === "completed" && (
                        <div style={{ marginTop:4 }}>
                          {b.has_review ? (
                            <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 14px",
                              borderRadius:8, background:"#F0FDF4", border:"1px solid #BBF7D0", fontSize:13, fontWeight:600, color:"#16A34A" }}>
                              <ICheckCirc size={13}/> Review Submitted
                            </div>
                          ) : reviewOpen[b.id] ? (
                            <InlineReviewForm
                              booking={b}
                              onDone={(rv) => handleReviewDone(b.id, rv)}
                              onCancel={() => setReviewOpen(p => ({...p, [b.id]: false}))}/>
                          ) : (
                            <button
                              style={{ padding:"7px 16px", borderRadius:8, border:"1.5px solid #F59E0B",
                                background:"#FFFBEB", color:"#92400E", fontWeight:700, fontSize:13, cursor:"pointer" }}
                              onClick={() => setReviewOpen(p => ({...p, [b.id]: true}))}>
                              ⭐ Leave a Review
                            </button>
                          )}
                        </div>
                      )}

                      {/* View Karigar Profile link */}
                      {!isKarigar && b.karigar_profile_id && (
                        <div style={{ marginTop:8 }}>
                          <button onClick={() => navigate(`/karigar/${b.karigar_profile_id}`)}
                            style={{ padding:"6px 14px", borderRadius:8, border:"1.5px solid var(--border)",
                              background:"#fff", color:"var(--primary)", fontWeight:600, fontSize:12, cursor:"pointer" }}>
                            View Karigar Profile
                          </button>
                        </div>
                      )}

                      {/* ── KARIGAR ACTIONS ── */}
                      {isKarigar && (
                        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>

                          {/* Accept / Reject */}
                          {["pending","bargaining"].includes(b.status) && (
                            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                              <button className="btn btn-sm"
                                style={{ border:"1.5px solid #16A34A",color:"#16A34A",background:"#F0FDF4",cursor:"pointer",borderRadius:8,padding:"8px 18px",fontWeight:700,fontSize:13 }}
                                onClick={() => doAction(b.id, ()=>respondBooking(b.id,{action:"accept"}), "Booking accepted!")}>
                                ✓ Accept
                              </button>
                              <button className="btn btn-sm"
                                style={{ border:"1.5px solid var(--danger)",color:"var(--danger)",background:"#FEF2F2",cursor:"pointer",borderRadius:8,padding:"8px 18px",fontWeight:700,fontSize:13 }}
                                onClick={() => { if(confirm("Reject this booking?")) doAction(b.id, ()=>respondBooking(b.id,{action:"reject"}), "Booking rejected."); }}>
                                ✗ Reject
                              </button>
                            </div>
                          )}

                          {/* Mark as Complete */}
                          {b.status === "accepted" && (
                            <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
                              <button
                                style={{ padding:"8px 18px",borderRadius:8,border:"1.5px solid #2563EB",
                                  color:"#2563EB",background:"#EFF6FF",cursor:"pointer",fontWeight:700,fontSize:13 }}
                                onClick={() => {
                                  if(confirm("Mark this booking as completed? The customer will be able to leave a review."))
                                    doAction(b.id, ()=>markBookingComplete(b.id), "Booking marked as completed! Customer can now leave a review.");
                                }}>
                                ✓ Mark as Completed
                              </button>
                              <span style={{ fontSize:12,color:"var(--text-p)" }}>Completed the work?</span>
                            </div>
                          )}

                          {/* Counter offer */}
                          {["pending","bargaining"].includes(b.status) && b.bargain_status === "customer_offered" && (
                            <div style={{ background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:10,padding:"14px" }}>
                              <p style={{ fontSize:13,fontWeight:700,color:"#D97706",marginBottom:10 }}>
                                💬 Customer offered NPR {b.offered_rate ? parseFloat(b.offered_rate).toLocaleString() : "—"}/hr — send a counter offer
                              </p>
                              <div style={{ display:"flex",gap:8,alignItems:"flex-end",flexWrap:"wrap" }}>
                                <div style={{ flex:1,minWidth:120 }}>
                                  <label style={{ fontSize:11,fontWeight:700,color:"#D97706",display:"block",marginBottom:4,textTransform:"uppercase" }}>Counter Rate (NPR/hr)</label>
                                  <input type="number" min="1" value={bi.rate}
                                    onChange={e => setBi("rate", e.target.value)}
                                    placeholder={b.karigar_rate ? String(parseFloat(b.karigar_rate)) : ""}
                                    style={{ width:"100%",padding:"8px 10px",borderRadius:7,border:"1.5px solid #FDE68A",
                                      fontSize:13,fontWeight:600,outline:"none",boxSizing:"border-box" }}/>
                                </div>
                                <div style={{ flex:2,minWidth:160 }}>
                                  <label style={{ fontSize:11,fontWeight:700,color:"#D97706",display:"block",marginBottom:4,textTransform:"uppercase" }}>Message</label>
                                  <input type="text" value={bi.msg}
                                    onChange={e => setBi("msg", e.target.value)}
                                    placeholder="e.g. My minimum is NPR 800/hr for this work"
                                    style={{ width:"100%",padding:"8px 10px",borderRadius:7,border:"1.5px solid #FDE68A",
                                      fontSize:13,outline:"none",boxSizing:"border-box" }}/>
                                </div>
                                <button
                                  style={{ padding:"8px 16px",borderRadius:8,border:"none",background:"#D97706",
                                    color:"white",fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap" }}
                                  onClick={() => {
                                    if (!bi.rate || parseFloat(bi.rate)<=0) { setErr(b.id,"Enter a valid rate."); return; }
                                    doAction(b.id, ()=>bargainCounter(b.id,{counter_rate:bi.rate,message:bi.msg}), "Counter sent!");
                                    setBi("rate",""); setBi("msg","");
                                  }}>
                                  Send Counter
                                </button>
                              </div>
                            </div>
                          )}
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