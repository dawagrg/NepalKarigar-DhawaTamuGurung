import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getKarigarPublicProfile,
  listKarigarReviews, submitReview, editReview, deleteReview,
} from "../services/api";
import { ICheckCirc, IAlertCirc, IUser, IArrow } from "../components/Icons";
import { ProfileHeroSkeleton, KarigarCardSkeleton } from "../components/Skeleton";
import { formatNPR } from "../utils";

const MEDIA_BASE = "http://127.0.0.1:8000";
const imgUrl = r => !r ? null : r.startsWith("http") ? r : `${MEDIA_BASE}${r.startsWith("/") ? r : "/media/" + r}`;

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

function Avatar({ src, name, size = 36 }) {
  const av = imgUrl(src);
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", overflow:"hidden", flexShrink:0,
      background:"var(--primary-bg)", border:"2px solid var(--primary-bd)",
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      {av
        ? <img src={av} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        : <span style={{ fontSize:size*0.38, fontWeight:700, color:"var(--primary)" }}>
            {(name||"?")[0].toUpperCase()}</span>}
    </div>
  );
}

function RatingDistribution({ distribution, total }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      {[5,4,3,2,1].map(star => {
        const count = distribution?.[star] || 0;
        const pct   = total > 0 ? Math.round((count/total)*100) : 0;
        return (
          <div key={star} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:12, color:"var(--text-s)", width:12, textAlign:"right", fontWeight:600 }}>{star}</span>
            <svg width={11} height={11} viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <div style={{ flex:1, height:8, borderRadius:4, background:"var(--border)", overflow:"hidden" }}>
              <div style={{ width:`${pct}%`, height:"100%", background:"#F59E0B", borderRadius:4 }}/>
            </div>
            <span style={{ fontSize:11, color:"var(--text-p)", width:28, textAlign:"right" }}>{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function ReviewForm({ bookingId, existingReview, karigarName, onSuccess, onCancel }) {
  const [rating,  setRating]  = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState("");

  const submit = async () => {
    setErr("");
    if (!rating)         { setErr("Please select a star rating."); return; }
    if (!comment.trim()) { setErr("Please write a comment."); return; }
    setSaving(true);
    try {
      const res = existingReview
        ? await editReview(existingReview.id, { rating, comment })
        : await submitReview(bookingId, { rating, comment });
      onSuccess(res.data);
    } catch(e) {
      setErr(e.response?.data?.error || "Failed to submit review.");
    } finally { setSaving(false); }
  };

  return (
    <div style={{ background:"#FFFBEB", border:"1.5px solid #FDE68A", borderRadius:12, padding:"18px 20px" }}>
      <h3 style={{ fontSize:14, fontWeight:700, color:"#92400E", marginBottom:14 }}>
        {existingReview ? "Edit Your Review" : `Review ${karigarName}`}
      </h3>
      {err && <div className="alert alert-err" style={{ marginBottom:12, fontSize:13 }}><IAlertCirc size={13}/> {err}</div>}
      <div style={{ marginBottom:14 }}>
        <label style={{ fontSize:11, fontWeight:700, color:"var(--text-p)", display:"block", marginBottom:7, textTransform:"uppercase", letterSpacing:"0.05em" }}>Your Rating *</label>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Stars rating={rating} size={28} interactive onRate={setRating}/>
          {rating > 0 && <span style={{ fontSize:13, fontWeight:600, color:"#92400E" }}>{["","Poor","Fair","Good","Very Good","Excellent"][rating]}</span>}
        </div>
      </div>
      <div style={{ marginBottom:14 }}>
        <label style={{ fontSize:11, fontWeight:700, color:"var(--text-p)", display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>Your Review *</label>
        <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
          placeholder="Share your experience with this karigar…"
          style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1.5px solid #FDE68A", fontSize:13,
            outline:"none", resize:"vertical", boxSizing:"border-box", fontFamily:"inherit", background:"#fff" }}
          onFocus={e => e.target.style.borderColor="#F59E0B"}
          onBlur={e  => e.target.style.borderColor="#FDE68A"}/>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={submit} disabled={saving}
          style={{ padding:"9px 20px", borderRadius:8, border:"none", background:"#F59E0B", color:"white",
            fontWeight:700, fontSize:13, cursor:saving?"not-allowed":"pointer", opacity:saving?0.7:1 }}>
          {saving ? "Submitting…" : existingReview ? "Update Review" : "Submit Review"}
        </button>
        <button onClick={onCancel}
          style={{ padding:"9px 16px", borderRadius:8, border:"1.5px solid var(--border)", background:"#fff",
            fontWeight:600, fontSize:13, cursor:"pointer", color:"var(--text-s)" }}>Cancel</button>
      </div>
    </div>
  );
}

function ReviewsSection({ karigarProfileId, karigarName }) {
  const isLoggedIn  = !!localStorage.getItem("access_token");
  const role        = localStorage.getItem("role");
  const currentUser = localStorage.getItem("username");

  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [showForm,   setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [pendingBookingId, setPendingBookingId] = useState(null);
  const [toast,      setToast]      = useState({ msg:"", ok:true });

  const flash = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast({msg:"",ok:true}),3500); };

  const loadReviews = useCallback((p=1) => {
    setLoading(true);
    listKarigarReviews(karigarProfileId, { page:p })
      .then(r => { setData(r.data); setPage(p); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, [karigarProfileId]);

  useEffect(() => { loadReviews(1); }, [karigarProfileId]);

  const handleReviewSuccess = () => {
    setShowForm(false); setEditTarget(null);
    loadReviews(1);
    flash(editTarget ? "Review updated!" : "Review submitted! Thank you.");
  };

  const handleDelete = async (reviewId) => {
    if (!confirm("Delete this review?")) return;
    try {
      await deleteReview(reviewId);
      loadReviews(page);
      flash("Review deleted.");
    } catch(e) { flash(e.response?.data?.error||"Failed to delete.",false); }
  };

  const handleWriteReview = async () => {
    try {
      const { listBookings } = await import("../services/api");
      const res = await listBookings();
      const completed = (res.data||[]).find(b =>
        b.status === "completed" && b.karigar_profile_id === karigarProfileId && !b.has_review
      );
      if (completed) {
        setPendingBookingId(completed.id);
        setShowForm(true);
      } else {
        flash("You need a completed booking with this karigar to write a review.", false);
      }
    } catch { flash("Could not verify your booking. Please try again.", false); }
  };

  const avgRating = parseFloat(data?.avg_rating||0);
  const total     = data?.count || 0;

  return (
    <div className="card" style={{ padding:"20px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <h2 style={{ fontSize:15, fontWeight:700, color:"var(--text-h)" }}>
          Reviews {total > 0 && <span style={{ color:"var(--text-p)", fontWeight:500 }}>({total})</span>}
        </h2>
        {isLoggedIn && role==="customer" && !showForm && !editTarget && (
          <button onClick={handleWriteReview}
            style={{ padding:"7px 16px", borderRadius:8, border:"1.5px solid #F59E0B", background:"#FFFBEB",
              color:"#92400E", fontWeight:700, fontSize:13, cursor:"pointer" }}>
            ✏️ Write a Review
          </button>
        )}
      </div>

      {toast.msg && (
        <div className={`alert ${toast.ok?"alert-ok":"alert-err"}`} style={{ marginBottom:14, fontSize:13 }}>
          {toast.ok ? <ICheckCirc size={13}/> : <IAlertCirc size={13}/>} {toast.msg}
        </div>
      )}

      {total > 0 && data && (
        <div style={{ display:"flex", gap:24, marginBottom:20, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:42, fontWeight:800, color:"var(--text-h)", lineHeight:1 }}>{avgRating.toFixed(1)}</div>
            <Stars rating={avgRating} size={16}/>
            <div style={{ fontSize:12, color:"var(--text-p)", marginTop:4 }}>{total} review{total!==1?"s":""}</div>
          </div>
          <div style={{ flex:1, minWidth:180 }}>
            <RatingDistribution distribution={data.distribution} total={total}/>
          </div>
        </div>
      )}

      {(showForm || editTarget) && (
        <div style={{ marginBottom:20 }}>
          <ReviewForm
            bookingId={pendingBookingId || editTarget?.booking_id}
            existingReview={editTarget}
            karigarName={karigarName}
            onSuccess={handleReviewSuccess}
            onCancel={() => { setShowForm(false); setEditTarget(null); }}/>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:"center", padding:"24px 0" }}>
          <div style={{ width:24, height:24, border:"3px solid var(--border)", borderTopColor:"var(--primary)",
            borderRadius:"50%", animation:"spin .7s linear infinite", display:"inline-block" }}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : total === 0 ? (
        <p style={{ fontSize:13, color:"var(--text-p)", textAlign:"center", padding:"24px 0" }}>
          No reviews yet. Be the first to review this karigar!
        </p>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {(data?.results||[]).map((rv,i) => (
            <div key={rv.id} style={{ paddingBottom:16, borderBottom:i<data.results.length-1?"1px solid var(--border)":"none" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                <Avatar src={rv.avatar} name={rv.reviewer} size={36}/>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:3 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:"var(--text-h)" }}>{rv.reviewer}</span>
                    <Stars rating={rv.rating} size={12}/>
                    <span style={{ fontSize:11, color:"var(--text-p)" }}>{rv.date}</span>
                  </div>
                  <p style={{ fontSize:13, color:"var(--text-b)", lineHeight:1.6, margin:0 }}>{rv.comment}</p>
                </div>
                {isLoggedIn && rv.reviewer_username === currentUser && (
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    <button onClick={() => { setEditTarget(rv); setShowForm(false); }}
                      style={{ padding:"4px 10px", borderRadius:6, border:"1.5px solid var(--border)", background:"#fff", fontSize:12, fontWeight:600, cursor:"pointer", color:"var(--text-s)" }}>Edit</button>
                    <button onClick={() => handleDelete(rv.id)}
                      style={{ padding:"4px 10px", borderRadius:6, border:"1.5px solid var(--danger)", background:"#FEF2F2", fontSize:12, fontWeight:600, cursor:"pointer", color:"var(--danger)" }}>Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.pages > 1 && (
        <div style={{ display:"flex", gap:6, justifyContent:"center", marginTop:18 }}>
          <button onClick={() => loadReviews(page-1)} disabled={page<=1}
            style={{ padding:"5px 12px", borderRadius:7, border:"1.5px solid var(--border)", background:"#fff", cursor:page<=1?"not-allowed":"pointer", opacity:page<=1?0.4:1, fontSize:13 }}>‹</button>
          {Array.from({length:data.pages},(_,i)=>i+1).map(p => (
            <button key={p} onClick={() => loadReviews(p)}
              style={{ padding:"5px 11px", borderRadius:7, border:"1.5px solid", fontSize:13, cursor:"pointer",
                borderColor:page===p?"var(--primary)":"var(--border)",
                background:page===p?"var(--primary)":"#fff",
                color:page===p?"white":"var(--text-s)", fontWeight:page===p?700:500 }}>{p}</button>
          ))}
          <button onClick={() => loadReviews(page+1)} disabled={page>=data.pages}
            style={{ padding:"5px 12px", borderRadius:7, border:"1.5px solid var(--border)", background:"#fff", cursor:page>=data.pages?"not-allowed":"pointer", opacity:page>=data.pages?0.4:1, fontSize:13 }}>›</button>
        </div>
      )}
    </div>
  );
}

export default function KarigarProfile() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [kp,      setKp]      = useState(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState("");
  const [imgIdx,  setImgIdx]  = useState(null);

  useEffect(() => {
    getKarigarPublicProfile(id)
      .then(r => setKp(r.data))
      .catch(() => setErr("Karigar not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"var(--bg-page)", paddingTop:70 }}>
      <div style={{ maxWidth:860, margin:"0 auto", padding:"28px 20px" }}>
        <ProfileHeroSkeleton/>
        <style>{`@keyframes skPulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14, marginTop:16 }}>
          <KarigarCardSkeleton/><KarigarCardSkeleton/>
        </div>
      </div>
    </div>
  );

  if (err) return (
    <div style={{ minHeight:"100vh", background:"var(--bg-page)", paddingTop:70, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div className="card" style={{ padding:"48px", textAlign:"center" }}>
        <div style={{ fontSize:36, marginBottom:10 }}>😕</div>
        <p style={{ fontSize:16, fontWeight:600, color:"var(--text-h)", marginBottom:8 }}>{err}</p>
        <button className="btn btn-primary btn-sm" onClick={() => navigate("/search")}>Back to Search</button>
      </div>
    </div>
  );

  const avatar  = imgUrl(kp.profile_image);
  const name    = kp.full_name || kp.username;
  const gallery = kp.gallery || [];

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-page)", paddingTop:70 }}>
      <div style={{ maxWidth:860, margin:"0 auto", padding:"28px 20px" }}>

        <button onClick={() => navigate(-1)}
          style={{ display:"inline-flex", alignItems:"center", gap:6, marginBottom:20, padding:"6px 12px",
            borderRadius:8, border:"1.5px solid var(--border)", background:"#fff", cursor:"pointer", fontSize:13, fontWeight:600, color:"var(--text-s)" }}>
          <IArrow size={13} style={{ transform:"rotate(180deg)" }}/> Back
        </button>

        <div className="card" style={{ padding:"24px", marginBottom:16 }}>
          <div style={{ display:"flex", gap:20, alignItems:"flex-start", flexWrap:"wrap" }}>
            <div style={{ width:88, height:88, borderRadius:"50%", overflow:"hidden", flexShrink:0,
              background:"var(--primary-bg)", border:"3px solid var(--primary-bd)",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              {avatar
                ? <img src={avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                : <span style={{ fontWeight:800, fontSize:32, color:"var(--primary)" }}>{name[0].toUpperCase()}</span>}
            </div>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                <h1 style={{ fontSize:22, fontWeight:800, color:"var(--text-h)" }}>{name}</h1>
                {kp.is_verified && (
                  <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:12, fontWeight:600,
                    color:"#16A34A", background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:20, padding:"2px 9px" }}>
                    <ICheckCirc size={11}/> Verified
                  </span>
                )}
              </div>
              <div style={{ fontSize:13, color:"var(--text-s)", marginBottom:8 }}>@{kp.username}</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                {kp.category_name && <span className="badge badge-blue">{kp.category_name}</span>}
                <span style={{ fontSize:12, fontWeight:600,
                  color:kp.available?"#16A34A":"var(--text-p)",
                  background:kp.available?"#F0FDF4":"var(--bg-subtle)",
                  border:`1px solid ${kp.available?"#BBF7D0":"var(--border)"}`,
                  borderRadius:20, padding:"2px 9px" }}>
                  {kp.available?"● Available":"○ Busy"}
                </span>
              </div>
              <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <Stars rating={kp.avg_rating} size={13}/>
                    <span style={{ fontSize:15, fontWeight:700, color:"var(--text-h)" }}>{parseFloat(kp.avg_rating||0).toFixed(1)}</span>
                  </div>
                  <div style={{ fontSize:11, color:"var(--text-p)" }}>Rating</div>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"var(--text-h)" }}>{kp.total_jobs}</div>
                  <div style={{ fontSize:11, color:"var(--text-p)" }}>Jobs Done</div>
                </div>
                {kp.experience_years>0 && (
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:15, fontWeight:700, color:"var(--text-h)" }}>{kp.experience_years}</div>
                    <div style={{ fontSize:11, color:"var(--text-p)" }}>Yrs Exp</div>
                  </div>
                )}
                {kp.hourly_rate && (
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:15, fontWeight:700, color:"var(--primary)" }}>{formatNPR(kp.hourly_rate)}</div>
                    <div style={{ fontSize:11, color:"var(--text-p)" }}>Per Hour</div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ flexShrink:0 }}>
              {localStorage.getItem("access_token") && localStorage.getItem("role")==="customer" ? (
                <button className="btn btn-primary"
                  onClick={() => navigate(`/booking/new?karigar=${kp.user_id}&profile=${kp.karigar_profile_id}`)}>
                  Book Now
                </button>
              ) : !localStorage.getItem("access_token") ? (
                <button className="btn btn-primary" onClick={() => navigate("/login")}>Login to Book</button>
              ) : null}
            </div>
          </div>
          {kp.bio && (
            <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid var(--border)" }}>
              <p style={{ fontSize:14, color:"var(--text-b)", lineHeight:1.7 }}>{kp.bio}</p>
            </div>
          )}
          {(kp.location||kp.district) && (
            <div style={{ marginTop:12, display:"flex", gap:6, alignItems:"center" }}>
              <span style={{ fontSize:14 }}>📍</span>
              <span style={{ fontSize:13, color:"var(--text-s)" }}>{[kp.location,kp.district].filter(Boolean).join(", ")}</span>
            </div>
          )}
        </div>

        {kp.sub_services?.length>0 && (
          <div className="card" style={{ padding:"20px", marginBottom:16 }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:"var(--text-h)", marginBottom:12 }}>Services Offered</h2>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {kp.sub_services.map(s => (
                <div key={s.id} style={{ padding:"8px 14px", borderRadius:8, background:"var(--primary-bg)", border:"1.5px solid var(--primary-bd)" }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--primary)" }}>{s.name}</div>
                  {s.base_price && <div style={{ fontSize:11, color:"var(--text-s)", marginTop:2 }}>from NPR {parseFloat(s.base_price).toLocaleString()}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {gallery.length>0 && (
          <div className="card" style={{ padding:"20px", marginBottom:16 }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:"var(--text-h)", marginBottom:12 }}>Work Gallery</h2>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:8 }}>
              {gallery.map((img,i) => (
                <div key={img.id} style={{ borderRadius:9, overflow:"hidden", cursor:"pointer",
                  border:"1px solid var(--border)", aspectRatio:"1", background:"var(--bg-subtle)" }}
                  onClick={() => setImgIdx(i)}>
                  <img src={imgUrl(img.image)} alt={img.caption||""}
                    style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform .2s" }}
                    onMouseEnter={e=>e.target.style.transform="scale(1.05)"}
                    onMouseLeave={e=>e.target.style.transform="scale(1)"}/>
                </div>
              ))}
            </div>
          </div>
        )}

        <ReviewsSection karigarProfileId={kp.karigar_profile_id} karigarName={name}/>

      </div>

      {imgIdx !== null && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:1000,
          display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={() => setImgIdx(null)}>
          <img src={imgUrl(gallery[imgIdx].image)} alt=""
            style={{ maxWidth:"90vw", maxHeight:"90vh", borderRadius:10, objectFit:"contain" }}
            onClick={e=>e.stopPropagation()}/>
          {gallery[imgIdx].caption && (
            <div style={{ position:"absolute", bottom:24, left:"50%", transform:"translateX(-50%)",
              background:"rgba(0,0,0,.6)", color:"white", padding:"6px 16px", borderRadius:20, fontSize:13 }}>
              {gallery[imgIdx].caption}
            </div>
          )}
          {gallery.length>1 && (
            <>
              <button onClick={e=>{e.stopPropagation();setImgIdx(i=>(i-1+gallery.length)%gallery.length);}}
                style={{ position:"absolute", left:16, background:"rgba(255,255,255,.15)", border:"none",
                  color:"white", fontSize:22, width:44, height:44, borderRadius:"50%", cursor:"pointer" }}>‹</button>
              <button onClick={e=>{e.stopPropagation();setImgIdx(i=>(i+1)%gallery.length);}}
                style={{ position:"absolute", right:16, background:"rgba(255,255,255,.15)", border:"none",
                  color:"white", fontSize:22, width:44, height:44, borderRadius:"50%", cursor:"pointer" }}>›</button>
            </>
          )}
          <button onClick={()=>setImgIdx(null)}
            style={{ position:"absolute", top:16, right:20, background:"none", border:"none",
              color:"white", fontSize:28, cursor:"pointer", lineHeight:1 }}>✕</button>
        </div>
      )}
    </div>
  );
}