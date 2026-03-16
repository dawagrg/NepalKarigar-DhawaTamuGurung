import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories } from "../services/api";
import { ISearch } from "../components/Icons";
import { EmptyState } from "../components/Skeleton";
import { formatNPR } from "../utils";

// Returns an SVG icon element for each service category
function CatIcon({ name, size = 24, color = "#2563EB" }) {
  const s = { size, color };
  const n = (name||"").toLowerCase();
  if (n.includes("electric")) return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>;
  if (n.includes("plumb"))    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
  if (n.includes("carp"))     return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>;
  if (n.includes("paint"))    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 13.5V20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-7.5"/><path d="M2 13.5 12 2l10 11.5"/><path d="M12 2v20"/></svg>;
  if (n.includes("clean"))    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h.01M7 3h.01M11 3h.01M15 3h.01M19 3h.01M3 7h.01M7 7h.01M11 7h.01M15 7h.01M19 7h.01M3 11h.01M7 11h.01M11 11h.01"/><rect x="14" y="11" width="8" height="8" rx="1"/><path d="M14 15h8"/></svg>;
  if (n.includes("mason"))    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
  if (n.includes("land") || n.includes("garden")) return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12M12 12C12 7 17 4 17 4s1 4-1 8M12 12C12 7 7 4 7 4S6 8 8 12"/><path d="M5 22h14"/></svg>;
  if (n.includes("auto") || n.includes("car"))    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4l2-3h4l2 3h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/></svg>;
  if (n.includes("it") || n.includes("tech") || n.includes("comp")) return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>;
  if (n.includes("tailor") || n.includes("cloth")) return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a5 5 0 0 1 5 5v1a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>;
  // default
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
}

export default function Services() {
  const navigate = useNavigate();
  const [cats,    setCats]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [open,    setOpen]    = useState(null);

  useEffect(() => {
    getCategories()
      .then(r => setCats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = cats.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase()) ||
    c.sub_services?.some(s => s.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-page)", paddingTop:70 }}>
      <div style={{ maxWidth:1000, margin:"0 auto", padding:"32px 20px" }}>

        {/* Header */}
        <div style={{ marginBottom:26 }}>
          <h1 style={{ fontSize:23, fontWeight:800, color:"var(--text-h)", marginBottom:5 }}>Service Categories</h1>
          <p style={{ fontSize:14, color:"var(--text-s)" }}>Browse all services. Click a category to find available Karigars.</p>
        </div>

        {/* Search bar */}
        <div style={{ position:"relative", marginBottom:24, maxWidth:400 }}>
          <ISearch size={15} color="var(--text-p)"
            style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories or services…"
            style={{ width:"100%", padding:"10px 12px 10px 34px", borderRadius:9, border:"1.5px solid var(--border)",
              fontSize:13, background:"#fff", color:"var(--text-h)", outline:"none", boxSizing:"border-box" }}
            onFocus={e => e.target.style.borderColor="var(--primary)"}
            onBlur={e  => e.target.style.borderColor="var(--border)"} />
        </div>

        {loading ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="card" style={{ padding:18 }}>
                <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                  <div style={{ width:44, height:44, borderRadius:11, background:"#E5E7EB", flexShrink:0, animation:"skPulse 1.5s ease-in-out infinite" }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ height:15, width:"55%", background:"#E5E7EB", borderRadius:6, marginBottom:8, animation:"skPulse 1.5s ease-in-out infinite" }}/>
                    <div style={{ height:11, width:"80%", background:"#E5E7EB", borderRadius:6, animation:"skPulse 1.5s ease-in-out infinite" }}/>
                  </div>
                </div>
                <style>{`@keyframes skPulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ overflow:"hidden" }}>
            <EmptyState icon={<ISearch size={34} color="var(--text-p)"/>} title="No categories found" message="No categories match your search." action={search ? "Clear Search" : null} onAction={() => setSearch("")}/>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
            {filtered.map(cat => {
              const isOpen = open === cat.id;
              return (
                <div key={cat.id} className="card" style={{ overflow:"hidden", transition:"box-shadow .2s" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow="0 4px 20px rgba(37,99,235,.10)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow=""}>

                  {/* Card top */}
                  <div style={{ padding:"18px 18px 12px", cursor:"pointer" }}
                    onClick={() => setOpen(isOpen ? null : cat.id)}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                      <div style={{ width:44, height:44, borderRadius:11, background:"var(--primary-bg)",
                        border:"1.5px solid var(--primary-bd)", display:"flex", alignItems:"center",
                        justifyContent:"center", fontSize:21, flexShrink:0 }}>
                        <CatIcon name={cat.name} size={22} color="var(--primary)"/>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontWeight:700, fontSize:15, color:"var(--text-h)" }}>{cat.name}</span>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-p)"
                            strokeWidth="2.5" style={{ transform:isOpen?"rotate(180deg)":"none", transition:"transform .2s", flexShrink:0 }}>
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </div>
                        {cat.description && (
                          <p style={{ fontSize:12, color:"var(--text-s)", marginTop:3, lineHeight:1.5 }}>{cat.description}</p>
                        )}
                        <div style={{ display:"flex", gap:6, marginTop:7, flexWrap:"wrap" }}>
                          <span className="badge badge-blue">{cat.karigar_count} Karigar{cat.karigar_count!==1?"s":""}</span>
                          <span className="badge badge-gray">{cat.sub_services?.length||0} service{cat.sub_services?.length!==1?"s":""}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sub-services */}
                  {isOpen && cat.sub_services?.length > 0 && (
                    <div style={{ borderTop:"1px solid var(--border)", padding:"10px 18px 14px" }}>
                      <p style={{ fontSize:11, fontWeight:700, color:"var(--text-p)", textTransform:"uppercase",
                        letterSpacing:"0.06em", marginBottom:7 }}>Sub-services</p>
                      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                        {cat.sub_services.map(s => (
                          <div key={s.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                            padding:"6px 10px", borderRadius:7, background:"var(--bg-subtle)", border:"1px solid var(--border)" }}>
                            <span style={{ fontSize:13, color:"var(--text-b)" }}>{s.name}</span>
                            {s.base_price && (
                              <span style={{ fontSize:12, fontWeight:600, color:"var(--primary)" }}>
                                {formatNPR(s.base_price)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <div style={{ padding:"0 18px 16px", marginTop: isOpen ? 10 : 2 }}>
                    <button onClick={() => navigate(`/search?category=${cat.id}`)}
                      className="btn btn-primary btn-sm btn-full">
                      Find Karigars
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}