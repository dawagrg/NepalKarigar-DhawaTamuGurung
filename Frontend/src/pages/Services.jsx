import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories } from "../services/api";
import { ISearch } from "../components/Icons";

const EMOJI = {
  "Electrical":"⚡","Plumbing":"🔧","Carpentry":"🪚","Painting":"🎨",
  "Cleaning":"🧹","Masonry":"🧱","HVAC":"❄️","Landscaping":"🌿",
  "Auto Repair":"🚗","Tailoring":"🧵","Welding":"🔩","IT/Tech":"💻",
};
const catEmoji = (name, icon) => icon || EMOJI[name] || "🛠️";

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
          <div style={{ display:"flex", justifyContent:"center", padding:"60px 0" }}>
            <div style={{ width:30, height:30, border:"3px solid var(--border)", borderTopColor:"var(--primary)",
              borderRadius:"50%", animation:"spin .7s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding:"48px", textAlign:"center" }}>
            <div style={{ fontSize:34, marginBottom:10 }}>🔍</div>
            <p style={{ fontSize:15, color:"var(--text-s)" }}>No categories match your search.</p>
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
                        {catEmoji(cat.name, cat.icon)}
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
                                NPR {parseFloat(s.base_price).toLocaleString()}
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