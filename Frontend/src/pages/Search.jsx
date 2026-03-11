import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { searchKarigars, getCategories } from "../services/api";
import { ISearch, ICheckCirc } from "../components/Icons";

const MEDIA_BASE = "http://127.0.0.1:8000";
const imgUrl = r => !r ? null : r.startsWith("http") ? r : `${MEDIA_BASE}${r.startsWith("/")?r:"/media/"+r}`;

function Stars({ rating }) {
  const r = parseFloat(rating) || 0;
  return (
    <span style={{ display:"inline-flex", gap:1 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24"
          fill={i<=Math.round(r)?"#F59E0B":"none"}
          stroke={i<=Math.round(r)?"#F59E0B":"#D1D5DB"} strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  );
}

function KarigarCard({ k }) {
  const navigate = useNavigate();
  const av  = imgUrl(k.profile_image);
  const name = k.full_name || k.username;
  return (
    <div className="card" style={{ padding:"18px", cursor:"pointer", transition:"box-shadow .2s" }}
      onClick={() => navigate(`/karigar/${k.id}`)}
      onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 20px rgba(37,99,235,.12)"}
      onMouseLeave={e=>e.currentTarget.style.boxShadow=""}>
      <div style={{ display:"flex", gap:12, marginBottom:11 }}>
        <div style={{ width:48,height:48,borderRadius:"50%",overflow:"hidden",flexShrink:0,
          background:"var(--primary-bg)",border:"2px solid var(--primary-bd)",
          display:"flex",alignItems:"center",justifyContent:"center" }}>
          {av ? <img src={av} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
               : <span style={{ fontWeight:700,fontSize:17,color:"var(--primary)" }}>{(name?.[0]||"K").toUpperCase()}</span>}
        </div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
            <span style={{ fontWeight:700,fontSize:15,color:"var(--text-h)" }}>{name}</span>
            {k.is_verified && (
              <span style={{ display:"inline-flex",alignItems:"center",gap:3,fontSize:11,fontWeight:600,
                color:"#16A34A",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:20,padding:"1px 7px" }}>
                <ICheckCirc size={9}/> Verified
              </span>
            )}
          </div>
          <div style={{ fontSize:12,color:"var(--text-s)",marginTop:1 }}>@{k.username}</div>
          {k.category && <span className="badge badge-blue" style={{ marginTop:4,fontSize:11 }}>{k.category}</span>}
        </div>
        <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2,flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:3 }}>
            <Stars rating={k.avg_rating}/>
            <span style={{ fontSize:12,fontWeight:600,color:"var(--text-h)" }}>{parseFloat(k.avg_rating||0).toFixed(1)}</span>
          </div>
          <span style={{ fontSize:11,color:"var(--text-p)" }}>{k.total_jobs} job{k.total_jobs!==1?"s":""}</span>
        </div>
      </div>
      <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:10 }}>
        {k.district && <span style={{ fontSize:12,color:"var(--text-s)" }}>📍 {k.district}</span>}
        {k.experience_years>0 && <span style={{ fontSize:12,color:"var(--text-s)" }}>🗓️ {k.experience_years} yr{k.experience_years!==1?"s":""}</span>}
        {k.hourly_rate && <span style={{ fontSize:12,color:"var(--primary)",fontWeight:600 }}>NPR {parseFloat(k.hourly_rate).toLocaleString()}/hr</span>}
        <span style={{ fontSize:11,fontWeight:600,marginLeft:"auto",
          color:k.available?"#16A34A":"var(--text-p)",background:k.available?"#F0FDF4":"var(--bg-subtle)",
          border:`1px solid ${k.available?"#BBF7D0":"var(--border)"}`,borderRadius:20,padding:"1px 8px" }}>
          {k.available?"Available":"Busy"}
        </span>
      </div>
      {k.sub_services?.length>0 && (
        <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
          {k.sub_services.slice(0,4).map(s=>(
            <span key={s.id} className="badge badge-gray" style={{ fontSize:11 }}>{s.name}</span>
          ))}
          {k.sub_services.length>4 && <span className="badge badge-gray" style={{ fontSize:11 }}>+{k.sub_services.length-4}</span>}
        </div>
      )}
    </div>
  );
}

export default function Search() {
  const [sp, setSp] = useSearchParams();
  const [results,  setResults]  = useState([]);
  const [cats,     setCats]     = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [meta,     setMeta]     = useState({ total:0,page:1,pages:1 });
  const [showFilt, setShowFilt] = useState(false);

  const [q,        setQ]        = useState(sp.get("q")||"");
  const [category, setCat]      = useState(sp.get("category")||"");
  const [district, setDistrict] = useState(sp.get("district")||"");
  const [avail,    setAvail]    = useState(sp.get("available")||"");
  const [minRate,  setMinRate]  = useState(sp.get("min_rate")||"");
  const [maxRate,  setMaxRate]  = useState(sp.get("max_rate")||"");
  const [minRat,   setMinRat]   = useState(sp.get("min_rating")||"");
  const [minExp,   setMinExp]   = useState(sp.get("min_exp")||"");
  const [order,    setOrder]    = useState(sp.get("ordering")||"rating");
  const [page,     setPage]     = useState(parseInt(sp.get("page")||"1"));

  useEffect(() => { getCategories().then(r=>setCats(r.data)).catch(()=>{}); }, []);

  const run = useCallback((pg=1) => {
    setLoading(true);
    const p = {};
    if(q)       p.q          = q;
    if(category)p.category   = category;
    if(district)p.district   = district;
    if(avail)   p.available  = avail;
    if(minRate) p.min_rate   = minRate;
    if(maxRate) p.max_rate   = maxRate;
    if(minRat)  p.min_rating = minRat;
    if(minExp)  p.min_exp    = minExp;
    p.ordering = order; p.page = pg;
    setSp(Object.fromEntries(Object.entries(p).map(([k,v])=>[k,String(v)])));
    searchKarigars(p)
      .then(r=>{ setResults(r.data.results); setMeta({total:r.data.total,page:r.data.page,pages:r.data.pages}); })
      .catch(()=>setResults([]))
      .finally(()=>setLoading(false));
  }, [q,category,district,avail,minRate,maxRate,minRat,minExp,order]);

  useEffect(()=>{ run(page); }, []); // eslint-disable-line

  const handleSubmit = e => { e?.preventDefault(); setPage(1); run(1); };

  const clearAll = () => {
    setQ(""); setCat(""); setDistrict(""); setAvail("");
    setMinRate(""); setMaxRate(""); setMinRat(""); setMinExp(""); setOrder("rating"); setPage(1);
    searchKarigars({ordering:"rating",page:1})
      .then(r=>{setResults(r.data.results);setMeta({total:r.data.total,page:r.data.page,pages:r.data.pages});})
      .catch(()=>{});
  };

  const activeFilt = [category,district,avail,minRate,maxRate,minRat,minExp].filter(Boolean).length;
  const inp = { width:"100%",padding:"9px 11px",borderRadius:8,border:"1.5px solid var(--border)",
    fontSize:13,background:"#fff",color:"var(--text-h)",outline:"none",boxSizing:"border-box" };

  return (
    <div style={{ minHeight:"100vh",background:"var(--bg-page)",paddingTop:70 }}>
      <div style={{ maxWidth:1060,margin:"0 auto",padding:"28px 20px" }}>

        <div style={{ marginBottom:20 }}>
          <h1 style={{ fontSize:23,fontWeight:800,color:"var(--text-h)",marginBottom:4 }}>Find a Karigar</h1>
          <p style={{ fontSize:14,color:"var(--text-s)" }}>Search skilled workers by service, location, rating and more.</p>
        </div>

        {/* Search row */}
        <form onSubmit={handleSubmit} style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap" }}>
          <div style={{ position:"relative",flex:1,minWidth:180 }}>
            <ISearch size={14} color="var(--text-p)"
              style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }}/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Name, skill, location…"
              style={{ ...inp, paddingLeft:33 }}
              onFocus={e=>e.target.style.borderColor="var(--primary)"}
              onBlur={e=>e.target.style.borderColor="var(--border)"}/>
          </div>
          <select value={category} onChange={e=>setCat(e.target.value)}
            style={{ ...inp,width:"auto",minWidth:140,cursor:"pointer" }}>
            <option value="">All Categories</option>
            {cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="submit" className="btn btn-primary" style={{ padding:"9px 20px",fontWeight:700 }}>Search</button>
          <button type="button" onClick={()=>setShowFilt(f=>!f)}
            style={{ padding:"9px 13px",borderRadius:8,border:`1.5px solid ${showFilt?"var(--primary)":"var(--border)"}`,
              background:showFilt?"var(--primary-bg)":"#fff",cursor:"pointer",fontSize:13,fontWeight:600,
              color:showFilt?"var(--primary)":"var(--text-s)",display:"flex",alignItems:"center",gap:5 }}>
            ⚙️ Filters {activeFilt>0&&(
              <span style={{ width:17,height:17,borderRadius:"50%",background:"var(--primary)",color:"white",
                fontSize:11,fontWeight:700,display:"inline-flex",alignItems:"center",justifyContent:"center" }}>
                {activeFilt}
              </span>)}
          </button>
          {activeFilt>0&&(
            <button type="button" onClick={clearAll}
              style={{ padding:"9px 12px",borderRadius:8,border:"1.5px solid var(--border)",
                background:"#fff",cursor:"pointer",fontSize:12,color:"var(--danger)",fontWeight:600 }}>
              Clear
            </button>)}
        </form>

        {/* Filter panel */}
        {showFilt&&(
          <div className="card" style={{ padding:"16px",marginBottom:16,display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10 }}>
            {[
              {lb:"District",val:district,set:setDistrict,ph:"e.g. Kathmandu",tp:"text"},
              {lb:"Min Rate (NPR/hr)",val:minRate,set:setMinRate,ph:"e.g. 500",tp:"number"},
              {lb:"Max Rate (NPR/hr)",val:maxRate,set:setMaxRate,ph:"e.g. 2000",tp:"number"},
              {lb:"Min Rating",val:minRat,set:setMinRat,ph:"0–5",tp:"number"},
              {lb:"Min Experience (yrs)",val:minExp,set:setMinExp,ph:"e.g. 2",tp:"number"},
            ].map(({lb,val,set,ph,tp})=>(
              <div key={lb}>
                <label style={{ fontSize:11,fontWeight:700,color:"var(--text-p)",display:"block",marginBottom:4,
                  textTransform:"uppercase",letterSpacing:"0.05em" }}>{lb}</label>
                <input type={tp} value={val} onChange={e=>set(e.target.value)} placeholder={ph}
                  style={inp}
                  onFocus={e=>e.target.style.borderColor="var(--primary)"}
                  onBlur={e=>e.target.style.borderColor="var(--border)"}/>
              </div>
            ))}
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:"var(--text-p)",display:"block",marginBottom:4,
                textTransform:"uppercase",letterSpacing:"0.05em" }}>Availability</label>
              <select value={avail} onChange={e=>setAvail(e.target.value)} style={{ ...inp,cursor:"pointer" }}>
                <option value="">Any</option>
                <option value="true">Available</option>
                <option value="false">Not available</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:"var(--text-p)",display:"block",marginBottom:4,
                textTransform:"uppercase",letterSpacing:"0.05em" }}>Sort By</label>
              <select value={order} onChange={e=>setOrder(e.target.value)} style={{ ...inp,cursor:"pointer" }}>
                <option value="rating">Top Rated</option>
                <option value="jobs">Most Jobs</option>
                <option value="rate_asc">Rate ↑</option>
                <option value="rate_desc">Rate ↓</option>
                <option value="newest">Newest</option>
              </select>
            </div>
            <div style={{ display:"flex",alignItems:"flex-end" }}>
              <button type="button" onClick={()=>{ setPage(1); run(1); }}
                className="btn btn-primary btn-sm btn-full">Apply Filters</button>
            </div>
          </div>
        )}

        {/* Results count + sort */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
          <p style={{ fontSize:13,color:"var(--text-s)" }}>
            {loading?"Searching…":`${meta.total} karigar${meta.total!==1?"s":""} found`}
          </p>
          {!showFilt&&(
            <select value={order} onChange={e=>{setOrder(e.target.value);setTimeout(()=>run(1),0);}}
              style={{ padding:"6px 10px",borderRadius:7,border:"1.5px solid var(--border)",
                fontSize:12,background:"#fff",cursor:"pointer",outline:"none" }}>
              <option value="rating">Top Rated</option>
              <option value="jobs">Most Jobs</option>
              <option value="rate_asc">Rate ↑</option>
              <option value="rate_desc">Rate ↓</option>
              <option value="newest">Newest</option>
            </select>
          )}
        </div>

        {/* Grid */}
        {loading?(
          <div style={{ display:"flex",justifyContent:"center",padding:"60px 0" }}>
            <div style={{ width:30,height:30,border:"3px solid var(--border)",borderTopColor:"var(--primary)",
              borderRadius:"50%",animation:"spin .7s linear infinite" }}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ):results.length===0?(
          <div className="card" style={{ padding:"56px",textAlign:"center" }}>
            <div style={{ fontSize:36,marginBottom:10 }}>🔍</div>
            <p style={{ fontSize:15,fontWeight:600,color:"var(--text-h)",marginBottom:4 }}>No karigars found</p>
            <p style={{ fontSize:13,color:"var(--text-s)" }}>Try different keywords or clear filters.</p>
          </div>
        ):(
          <>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14 }}>
              {results.map(k=><KarigarCard key={k.id} k={k}/>)}
            </div>
            {meta.pages>1&&(
              <div style={{ display:"flex",justifyContent:"center",gap:6,marginTop:26 }}>
                <button disabled={meta.page===1}
                  onClick={()=>{const p=meta.page-1;setPage(p);run(p);}}
                  style={{ padding:"7px 14px",borderRadius:8,border:"1.5px solid var(--border)",
                    background:"#fff",cursor:meta.page===1?"not-allowed":"pointer",
                    fontSize:13,fontWeight:600,opacity:meta.page===1?.5:1 }}>← Prev</button>
                {Array.from({length:meta.pages},(_,i)=>i+1)
                  .filter(p=>Math.abs(p-meta.page)<=2||p===1||p===meta.pages)
                  .reduce((a,p,i,arr)=>{if(i>0&&arr[i-1]!==p-1)a.push("…");a.push(p);return a;},[])
                  .map((p,i)=>typeof p==="string"?(
                    <span key={`e${i}`} style={{ padding:"7px 5px",color:"var(--text-p)",fontSize:13 }}>…</span>
                  ):(
                    <button key={p} onClick={()=>{setPage(p);run(p);}}
                      style={{ padding:"7px 12px",borderRadius:8,border:"1.5px solid",
                        borderColor:p===meta.page?"var(--primary)":"var(--border)",
                        background:p===meta.page?"var(--primary)":"#fff",
                        color:p===meta.page?"white":"var(--text-h)",
                        cursor:"pointer",fontSize:13,fontWeight:600 }}>
                      {p}
                    </button>
                  ))}
                <button disabled={meta.page===meta.pages}
                  onClick={()=>{const p=meta.page+1;setPage(p);run(p);}}
                  style={{ padding:"7px 14px",borderRadius:8,border:"1.5px solid var(--border)",
                    background:"#fff",cursor:meta.page===meta.pages?"not-allowed":"pointer",
                    fontSize:13,fontWeight:600,opacity:meta.page===meta.pages?.5:1 }}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}