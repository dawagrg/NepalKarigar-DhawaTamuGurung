import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getKarigarPublicProfile } from "../services/api";
import { ICheckCirc, IUser, IArrow } from "../components/Icons";

const MEDIA_BASE = "http://127.0.0.1:8000";
const imgUrl = r => !r ? null : r.startsWith("http") ? r : `${MEDIA_BASE}${r.startsWith("/")?r:"/media/"+r}`;

function Stars({ rating, size=14 }) {
  const r = parseFloat(rating) || 0;
  return (
    <span style={{ display:"inline-flex", gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i<=Math.round(r)?"#F59E0B":"none"}
          stroke={i<=Math.round(r)?"#F59E0B":"#D1D5DB"} strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  );
}

export default function KarigarProfile() {
  const { id }  = useParams();
  const navigate = useNavigate();
  const [kp,      setKp]      = useState(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState("");
  const [imgIdx,  setImgIdx]  = useState(null); // lightbox index

  useEffect(() => {
    getKarigarPublicProfile(id)
      .then(r => setKp(r.data))
      .catch(() => setErr("Karigar not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ minHeight:"100vh",background:"var(--bg-page)",paddingTop:70,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ width:32,height:32,border:"3px solid var(--border)",borderTopColor:"var(--primary)",
        borderRadius:"50%",animation:"spin .7s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (err) return (
    <div style={{ minHeight:"100vh",background:"var(--bg-page)",paddingTop:70,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div className="card" style={{ padding:"48px",textAlign:"center" }}>
        <div style={{ fontSize:36,marginBottom:10 }}>😕</div>
        <p style={{ fontSize:16,fontWeight:600,color:"var(--text-h)",marginBottom:8 }}>{err}</p>
        <button className="btn btn-primary btn-sm" onClick={() => navigate("/search")}>Back to Search</button>
      </div>
    </div>
  );

  const avatar  = imgUrl(kp.profile_image);
  const name    = kp.full_name || kp.username;
  const initials = (name?.[0]||"K").toUpperCase();
  const gallery = kp.gallery || [];
  const reviews = kp.reviews || [];

  return (
    <div style={{ minHeight:"100vh",background:"var(--bg-page)",paddingTop:70 }}>
      <div style={{ maxWidth:860,margin:"0 auto",padding:"28px 20px" }}>

        {/* Back */}
        <button onClick={() => navigate(-1)}
          style={{ display:"inline-flex",alignItems:"center",gap:6,marginBottom:20,padding:"6px 12px",
            borderRadius:8,border:"1.5px solid var(--border)",background:"#fff",cursor:"pointer",
            fontSize:13,fontWeight:600,color:"var(--text-s)" }}>
          <IArrow size={13} style={{ transform:"rotate(180deg)" }}/> Back
        </button>

        {/* Hero card */}
        <div className="card" style={{ padding:"24px",marginBottom:16 }}>
          <div style={{ display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap" }}>
            {/* Avatar */}
            <div style={{ width:88,height:88,borderRadius:"50%",overflow:"hidden",flexShrink:0,
              background:"var(--primary-bg)",border:"3px solid var(--primary-bd)",
              display:"flex",alignItems:"center",justifyContent:"center" }}>
              {avatar
                ? <img src={avatar} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                : <span style={{ fontWeight:800,fontSize:32,color:"var(--primary)" }}>{initials}</span>}
            </div>

            {/* Info */}
            <div style={{ flex:1,minWidth:200 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4 }}>
                <h1 style={{ fontSize:22,fontWeight:800,color:"var(--text-h)" }}>{name}</h1>
                {kp.is_verified && (
                  <span style={{ display:"inline-flex",alignItems:"center",gap:4,fontSize:12,fontWeight:600,
                    color:"#16A34A",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:20,padding:"2px 9px" }}>
                    <ICheckCirc size={11}/> Verified
                  </span>
                )}
              </div>
              <div style={{ fontSize:13,color:"var(--text-s)",marginBottom:8 }}>@{kp.username}</div>

              <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:10 }}>
                {kp.category && <span className="badge badge-blue">{kp.category}</span>}
                <span style={{ fontSize:12,fontWeight:600,
                  color:kp.available?"#16A34A":"var(--text-p)",
                  background:kp.available?"#F0FDF4":"var(--bg-subtle)",
                  border:`1px solid ${kp.available?"#BBF7D0":"var(--border)"}`,
                  borderRadius:20,padding:"2px 9px" }}>
                  {kp.available?"● Available":"○ Busy"}
                </span>
              </div>

              {/* Stats row */}
              <div style={{ display:"flex",gap:20,flexWrap:"wrap" }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:4 }}>
                    <Stars rating={kp.avg_rating} size={13}/>
                    <span style={{ fontSize:15,fontWeight:700,color:"var(--text-h)" }}>{parseFloat(kp.avg_rating||0).toFixed(1)}</span>
                  </div>
                  <div style={{ fontSize:11,color:"var(--text-p)" }}>Rating</div>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:15,fontWeight:700,color:"var(--text-h)" }}>{kp.total_jobs}</div>
                  <div style={{ fontSize:11,color:"var(--text-p)" }}>Jobs Done</div>
                </div>
                {kp.experience_years>0&&(
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:15,fontWeight:700,color:"var(--text-h)" }}>{kp.experience_years}</div>
                    <div style={{ fontSize:11,color:"var(--text-p)" }}>Yrs Exp</div>
                  </div>
                )}
                {kp.hourly_rate&&(
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:15,fontWeight:700,color:"var(--primary)" }}>NPR {parseFloat(kp.hourly_rate).toLocaleString()}</div>
                    <div style={{ fontSize:11,color:"var(--text-p)" }}>Per Hour</div>
                  </div>
                )}
              </div>
            </div>

            {/* CTA */}
            <div style={{ flexShrink:0 }}>
              {localStorage.getItem("access_token") && localStorage.getItem("role") === "customer" ? (
                <button className="btn btn-primary"
                  onClick={() => navigate(`/booking/new?karigar=${kp.id}`)}>
                  Book Now
                </button>
              ) : localStorage.getItem("access_token") ? null : (
                <button className="btn btn-primary"
                  onClick={() => navigate("/login")}>
                  Login to Book
                </button>
              )}
            </div>
          </div>

          {/* Bio */}
          {kp.bio && (
            <div style={{ marginTop:16,paddingTop:16,borderTop:"1px solid var(--border)" }}>
              <p style={{ fontSize:14,color:"var(--text-b)",lineHeight:1.7 }}>{kp.bio}</p>
            </div>
          )}

          {/* Location */}
          {(kp.location||kp.district) && (
            <div style={{ marginTop:12,display:"flex",gap:6,alignItems:"center" }}>
              <span style={{ fontSize:14 }}>📍</span>
              <span style={{ fontSize:13,color:"var(--text-s)" }}>
                {[kp.location,kp.district].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* Sub-services */}
        {kp.sub_services?.length>0 && (
          <div className="card" style={{ padding:"20px",marginBottom:16 }}>
            <h2 style={{ fontSize:15,fontWeight:700,color:"var(--text-h)",marginBottom:12 }}>Services Offered</h2>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {kp.sub_services.map(s => (
                <div key={s.id} style={{ padding:"8px 14px",borderRadius:8,background:"var(--primary-bg)",
                  border:"1.5px solid var(--primary-bd)" }}>
                  <div style={{ fontSize:13,fontWeight:600,color:"var(--primary)" }}>{s.name}</div>
                  {s.base_price && <div style={{ fontSize:11,color:"var(--text-s)",marginTop:2 }}>from NPR {parseFloat(s.base_price).toLocaleString()}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery */}
        {gallery.length>0 && (
          <div className="card" style={{ padding:"20px",marginBottom:16 }}>
            <h2 style={{ fontSize:15,fontWeight:700,color:"var(--text-h)",marginBottom:12 }}>Work Gallery</h2>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8 }}>
              {gallery.map((img,i) => (
                <div key={img.id} style={{ borderRadius:9,overflow:"hidden",cursor:"pointer",
                  border:"1px solid var(--border)",aspectRatio:"1",background:"var(--bg-subtle)" }}
                  onClick={() => setImgIdx(i)}>
                  <img src={imgUrl(img.image)} alt={img.caption||""}
                    style={{ width:"100%",height:"100%",objectFit:"cover",transition:"transform .2s" }}
                    onMouseEnter={e=>e.target.style.transform="scale(1.05)"}
                    onMouseLeave={e=>e.target.style.transform="scale(1)"}/>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="card" style={{ padding:"20px" }}>
          <h2 style={{ fontSize:15,fontWeight:700,color:"var(--text-h)",marginBottom:14 }}>
            Reviews ({reviews.length})
          </h2>
          {reviews.length===0 ? (
            <p style={{ fontSize:13,color:"var(--text-p)",textAlign:"center",padding:"20px 0" }}>No reviews yet.</p>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              {reviews.map((rv,i) => (
                <div key={i} style={{ paddingBottom:14,borderBottom:i<reviews.length-1?"1px solid #F3F4F6":"none" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:6 }}>
                    <div style={{ width:34,height:34,borderRadius:"50%",overflow:"hidden",flexShrink:0,
                      background:"var(--primary-bg)",border:"1px solid var(--primary-bd)",
                      display:"flex",alignItems:"center",justifyContent:"center" }}>
                      {rv.avatar
                        ? <img src={rv.avatar} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                        : <span style={{ fontSize:14,fontWeight:700,color:"var(--primary)" }}>{(rv.reviewer?.[0]||"?").toUpperCase()}</span>}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                        <span style={{ fontSize:13,fontWeight:600,color:"var(--text-h)" }}>{rv.reviewer}</span>
                        <Stars rating={rv.rating} size={12}/>
                      </div>
                      <div style={{ fontSize:11,color:"var(--text-p)" }}>{rv.date}</div>
                    </div>
                  </div>
                  <p style={{ fontSize:13,color:"var(--text-b)",lineHeight:1.6,marginLeft:44 }}>{rv.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Lightbox */}
      {imgIdx !== null && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:1000,
          display:"flex",alignItems:"center",justifyContent:"center" }}
          onClick={() => setImgIdx(null)}>
          <img src={imgUrl(gallery[imgIdx].image)} alt=""
            style={{ maxWidth:"90vw",maxHeight:"90vh",borderRadius:10,objectFit:"contain" }}
            onClick={e=>e.stopPropagation()}/>
          {gallery[imgIdx].caption && (
            <div style={{ position:"absolute",bottom:24,left:"50%",transform:"translateX(-50%)",
              background:"rgba(0,0,0,.6)",color:"white",padding:"6px 16px",borderRadius:20,fontSize:13 }}>
              {gallery[imgIdx].caption}
            </div>
          )}
          {gallery.length>1 && (
            <>
              <button onClick={e=>{e.stopPropagation();setImgIdx(i=>(i-1+gallery.length)%gallery.length);}}
                style={{ position:"absolute",left:16,background:"rgba(255,255,255,.15)",border:"none",
                  color:"white",fontSize:22,width:44,height:44,borderRadius:"50%",cursor:"pointer" }}>‹</button>
              <button onClick={e=>{e.stopPropagation();setImgIdx(i=>(i+1)%gallery.length);}}
                style={{ position:"absolute",right:16,background:"rgba(255,255,255,.15)",border:"none",
                  color:"white",fontSize:22,width:44,height:44,borderRadius:"50%",cursor:"pointer" }}>›</button>
            </>
          )}
          <button onClick={()=>setImgIdx(null)}
            style={{ position:"absolute",top:16,right:20,background:"none",border:"none",
              color:"white",fontSize:28,cursor:"pointer",lineHeight:1 }}>✕</button>
        </div>
      )}
    </div>
  );
}