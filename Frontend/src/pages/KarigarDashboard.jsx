import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyKarigarProfile, createKarigarProfile, updateKarigarProfile,
  uploadGalleryImage, deleteGalleryImage, getCategories
} from "../services/api";
import { IEdit, ICamera, ICheckCirc, IAlertCirc, ICheck, IClose, IImage } from "../components/Icons";

const MEDIA_BASE = "http://127.0.0.1:8000";
const imgUrl = r => !r ? null : r.startsWith("http") ? r : `${MEDIA_BASE}${r.startsWith("/")?r:"/media/"+r}`;

const DISTRICTS = [
  "Achham","Arghakhanchi","Baglung","Baitadi","Bajhang","Bajura","Banke","Bara","Bardiya",
  "Bhaktapur","Bhojpur","Chitwan","Dailekh","Dang","Darchula","Dhading","Dhankuta","Dhanusa",
  "Dolakha","Dolpa","Doti","Eastern Rukum","Gorkha","Gulmi","Humla","Ilam","Jajarkot","Jhapa",
  "Jumla","Kailali","Kalikot","Kanchanpur","Kapilvastu","Kaski","Kathmandu","Kavrepalanchok",
  "Khotang","Lalitpur","Lamjung","Mahottari","Makwanpur","Manang","Morang","Mugu","Mustang",
  "Myagdi","Nawalparasi","Nuwakot","Okhaldhunga","Palpa","Panchthar","Parbat","Parsa","Pyuthan",
  "Ramechhap","Rasuwa","Rautahat","Rolpa","Rupandehi","Salyan","Sankhuwasabha","Saptari",
  "Sarlahi","Sindhuli","Sindhupalchok","Siraha","Solukhumbu","Sunsari","Surkhet","Syangja",
  "Tanahun","Taplejung","Terhathum","Udayapur","Western Rukum",
];

export default function KarigarDashboard() {
  const navigate = useNavigate();
  const fileRef  = useRef();
  const role     = localStorage.getItem("role");

  const [tab,       setTab]       = useState("profile");
  const [kp,        setKp]        = useState(null);
  const [cats,      setCats]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState("");
  const [err,       setErr]       = useState("");
  const [exists,    setExists]    = useState(false);

  // Form fields
  const [catId,     setCatId]     = useState("");
  const [subIds,    setSubIds]    = useState([]);
  const [expYears,  setExpYears]  = useState("0");
  const [rate,      setRate]      = useState("");
  const [location,  setLocation]  = useState("");
  const [district,  setDistrict]  = useState("");
  const [available, setAvail]     = useState(true);

  // Gallery
  const [gallery,   setGallery]   = useState([]);
  const [caption,   setCaption]   = useState("");
  const [galFile,   setGalFile]   = useState(null);
  const [galPrev,   setGalPrev]   = useState(null);
  const [galSaving, setGalSaving] = useState(false);

  useEffect(() => {
    if (role !== "karigar") { navigate("/profile"); return; }
    getCategories().then(r => setCats(r.data)).catch(() => {});
    getMyKarigarProfile()
      .then(r => {
        const d = r.data;
        setKp(d); setExists(true);
        setCatId(d.category_id || "");
        setSubIds((d.sub_services||[]).map(s=>s.id));
        setExpYears(String(d.experience_years||0));
        setRate(d.hourly_rate||"");
        setLocation(d.location||"");
        setDistrict(d.district||"");
        setAvail(d.available !== false);
        setGallery(d.gallery||[]);
      })
      .catch(e => { setErr("Failed to load profile. Make sure the backend is running."); })
      .finally(() => setLoading(false));
  }, []);

  const subServicesForCat = cats.find(c=>String(c.id)===String(catId))?.sub_services || [];

  const toggleSub = id => setSubIds(prev =>
    prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]
  );

  const buildPayload = () => ({
    category_id:      catId ? parseInt(catId) : undefined,
    sub_service_ids:  JSON.stringify(subIds),
    experience_years: parseInt(expYears)||0,
    hourly_rate:      rate || undefined,
    location:         location.trim(),
    district:         district.trim(),
    available:        available ? "true" : "false",
  });

  const save = async () => {
    setSaving(true); setErr(""); setMsg("");
    try {
      const payload = buildPayload();
      // Backend auto-creates KarigarProfile on registration — always PATCH to update
      const res = await updateKarigarProfile(payload);
      setKp(res.data); setExists(true);
      setMsg("Profile saved successfully!");
    } catch(e) {
      const errData = e.response?.data;
      const msg = errData?.error || errData?.detail
        || (typeof errData === "object" ? Object.values(errData)[0] : null)
        || "Failed to save profile. Please try again.";
      setErr(Array.isArray(msg) ? msg[0] : msg);
    }
    finally { setSaving(false); }
  };

  // Gallery
  const onGalFileChange = e => {
    const f = e.target.files[0];
    if (!f) return;
    setGalFile(f);
    setGalPrev(URL.createObjectURL(f));
  };

  const uploadGal = async () => {
    if (!galFile) { setErr("Select an image first."); return; }
    setGalSaving(true); setErr(""); setMsg("");
    try {
      const fd = new FormData();
      fd.append("image", galFile);
      fd.append("caption", caption);
      const res = await uploadGalleryImage(fd);
      setGallery(g => [...g, res.data]);
      setGalFile(null); setGalPrev(null); setCaption("");
      setMsg("Image uploaded.");
    } catch(e) { setErr(e.response?.data?.error || "Upload failed."); }
    finally { setGalSaving(false); }
  };

  const deleteGal = async id => {
    if (!confirm("Remove this gallery image?")) return;
    try {
      await deleteGalleryImage(id);
      setGallery(g => g.filter(x=>x.id!==id));
    } catch { setErr("Failed to delete image."); }
  };

  if (loading) return (
    <div style={{ minHeight:"100vh",background:"var(--bg-page)",paddingTop:70,
      display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ width:30,height:30,border:"3px solid var(--border)",borderTopColor:"var(--primary)",
        borderRadius:"50%",animation:"spin .7s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const TABS = [
    { id:"profile", label:"My Service Profile" },
    { id:"gallery", label:"Work Gallery"       },
  ];

  const LBL = ({ children }) => (
    <label style={{ fontSize:11,fontWeight:700,color:"var(--text-p)",display:"block",
      marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em" }}>{children}</label>
  );
  const INP = { width:"100%",padding:"9px 11px",borderRadius:8,border:"1.5px solid var(--border)",
    fontSize:13,background:"#fff",color:"var(--text-h)",outline:"none",boxSizing:"border-box" };

  return (
    <div style={{ minHeight:"100vh",background:"var(--bg-page)",paddingTop:70 }}>
      <div style={{ maxWidth:760,margin:"0 auto",padding:"28px 20px" }}>

        {/* Header */}
        <div style={{ marginBottom:22 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
            <span className="badge badge-blue">Karigar</span>
            {exists && kp?.is_verified && (
              <span style={{ display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,
                color:"#16A34A",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:20,padding:"2px 9px" }}>
                <ICheckCirc size={10}/> Verified
              </span>
            )}
          </div>
          <h1 style={{ fontSize:22,fontWeight:800,color:"var(--text-h)",marginBottom:4 }}>Service Provider Dashboard</h1>
          <p style={{ fontSize:13,color:"var(--text-s)" }}>
            {exists ? "Manage your service profile and work gallery." : "Set up your service profile to start receiving bookings."}
          </p>
        </div>

        {!exists && (
          <div className="alert alert-info" style={{ marginBottom:18 }}>
            You haven't created a karigar profile yet. Fill in the form below to get started.
          </div>
        )}

        {msg && <div className="alert alert-ok"  style={{ marginBottom:14 }}><ICheckCirc size={14}/> {msg}</div>}
        {err && <div className="alert alert-err" style={{ marginBottom:14 }}><IAlertCirc size={14}/> {err}</div>}

        {/* Tabs */}
        <div className="tab-bar" style={{ marginBottom:20 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setMsg(""); setErr(""); }}
              className={`tab-btn${tab===t.id?" on":""}`}>{t.label}</button>
          ))}
        </div>

        {/* ── PROFILE TAB ── */}
        {tab==="profile" && (
          <div className="card" style={{ padding:"24px" }}>

            {/* Stats strip (only if profile exists) */}
            {exists && kp && (
              <div style={{ display:"flex",gap:24,marginBottom:22,paddingBottom:18,
                borderBottom:"1px solid var(--border)",flexWrap:"wrap" }}>
                {[
                  {label:"Avg Rating", val:parseFloat(kp.avg_rating||0).toFixed(1)+" / 5"},
                  {label:"Total Jobs",  val:kp.total_jobs||0},
                  {label:"Gallery",     val:(kp.gallery?.length||0)+" photos"},
                ].map(({label,val}) => (
                  <div key={label}>
                    <div style={{ fontSize:16,fontWeight:700,color:"var(--primary)" }}>{val}</div>
                    <div style={{ fontSize:11,color:"var(--text-p)" }}>{label}</div>
                  </div>
                ))}
                <div style={{ marginLeft:"auto" }}>
                  <button className="btn btn-outline btn-sm"
                    onClick={() => navigate(`/karigar/${kp.karigar_profile_id}`)}>
                    View Public Profile
                  </button>
                </div>
              </div>
            )}

            <div className="form-stack">

              {/* Category */}
              <div>
                <LBL>Primary Service Category *</LBL>
                <select value={catId} onChange={e => { setCatId(e.target.value); setSubIds([]); }}
                  style={{ ...INP, cursor:"pointer" }}>
                  <option value="">— Select a category —</option>
                  {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Sub-services */}
              {catId && subServicesForCat.length > 0 && (
                <div>
                  <LBL>Sub-services You Offer</LBL>
                  <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                    {subServicesForCat.map(s => {
                      const on = subIds.includes(s.id);
                      return (
                        <button key={s.id} type="button" onClick={() => toggleSub(s.id)}
                          style={{ padding:"6px 12px",borderRadius:7,border:"1.5px solid",fontSize:13,fontWeight:500,
                            cursor:"pointer",transition:"all .15s",
                            borderColor: on?"var(--primary)":"var(--border)",
                            background:  on?"var(--primary-bg)":"#fff",
                            color:       on?"var(--primary)":"var(--text-b)" }}>
                          {on && <><ICheck size={11} color="var(--primary)"/> </>}{s.name}
                          {s.base_price ? ` (NPR ${parseFloat(s.base_price).toLocaleString()})` : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Two col row */}
              <div className="form-row">
                <div>
                  <LBL>Experience (years)</LBL>
                  <input type="number" min="0" max="50" value={expYears} onChange={e=>setExpYears(e.target.value)}
                    style={INP}
                    onFocus={e=>e.target.style.borderColor="var(--primary)"}
                    onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
                <div>
                  <LBL>Hourly Rate (NPR)</LBL>
                  <input type="number" min="0" value={rate} onChange={e=>setRate(e.target.value)} placeholder="e.g. 800"
                    style={INP}
                    onFocus={e=>e.target.style.borderColor="var(--primary)"}
                    onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
              </div>

              <div className="form-row">
                <div>
                  <LBL>Location / Area</LBL>
                  <input type="text" value={location} onChange={e=>setLocation(e.target.value)}
                    placeholder="e.g. Thamel, Kathmandu"
                    style={INP}
                    onFocus={e=>e.target.style.borderColor="var(--primary)"}
                    onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
                <div>
                  <LBL>District</LBL>
                  <select value={district} onChange={e=>setDistrict(e.target.value)}
                    style={{ ...INP,cursor:"pointer" }}>
                    <option value="">— Select district —</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Availability toggle */}
              <div>
                <LBL>Availability</LBL>
                <div style={{ display:"flex",gap:8 }}>
                  {[{val:true,label:"Available for work"},{val:false,label:"Not currently available"}].map(o=>(
                    <button key={String(o.val)} type="button" onClick={()=>setAvail(o.val)}
                      style={{ flex:1,padding:"9px 12px",borderRadius:8,border:"1.5px solid",fontSize:13,fontWeight:600,
                        cursor:"pointer",transition:"all .15s",
                        borderColor: available===o.val?(o.val?"#16A34A":"#DC2626"):"var(--border)",
                        background:  available===o.val?(o.val?"#F0FDF4":"#FEF2F2"):"#fff",
                        color:       available===o.val?(o.val?"#16A34A":"#DC2626"):"var(--text-s)" }}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={save} disabled={saving} className="btn btn-primary btn-full" style={{ marginTop:4 }}>
                {saving ? "Saving…" : exists ? "Update Profile" : "Create Profile"}
              </button>
            </div>
          </div>
        )}

        {/* ── GALLERY TAB ── */}
        {tab==="gallery" && (
          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>

            {/* Upload */}
            <div className="card" style={{ padding:"22px" }}>
              <h2 style={{ fontSize:15,fontWeight:700,color:"var(--text-h)",marginBottom:14 }}>Upload Work Photo</h2>
              {!exists && (
                <div className="alert alert-info" style={{ marginBottom:12 }}>
                  Create your service profile first before uploading gallery photos.
                </div>
              )}
              <input type="file" accept="image/*" ref={fileRef} style={{ display:"none" }} onChange={onGalFileChange}/>
              <div style={{ display:"flex",gap:12,alignItems:"flex-start",flexWrap:"wrap" }}>
                <div style={{ width:100,height:100,borderRadius:10,overflow:"hidden",flexShrink:0,cursor:"pointer",
                  border:"2px dashed var(--border)",background:"var(--bg-subtle)",
                  display:"flex",alignItems:"center",justifyContent:"center" }}
                  onClick={() => exists && fileRef.current?.click()}>
                  {galPrev
                    ? <img src={galPrev} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                    : <div style={{ textAlign:"center",color:"var(--text-p)" }}>
                        <ICamera size={24} color="var(--text-p)"/><div style={{ fontSize:11,marginTop:4 }}>Click to select</div>
                      </div>}
                </div>
                <div style={{ flex:1,minWidth:180 }}>
                  <label style={{ fontSize:11,fontWeight:700,color:"var(--text-p)",display:"block",
                    marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em" }}>Caption (optional)</label>
                  <input type="text" value={caption} onChange={e=>setCaption(e.target.value)}
                    placeholder="Describe the work…"
                    style={{ width:"100%",padding:"9px 11px",borderRadius:8,border:"1.5px solid var(--border)",
                      fontSize:13,background:"#fff",color:"var(--text-h)",outline:"none",boxSizing:"border-box" }}
                    onFocus={e=>e.target.style.borderColor="var(--primary)"}
                    onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                  <button disabled={!galFile||galSaving||!exists} onClick={uploadGal}
                    className="btn btn-primary btn-sm" style={{ marginTop:10 }}>
                    {galSaving ? "Uploading…" : "Upload Photo"}
                  </button>
                </div>
              </div>
            </div>

            {/* Gallery grid */}
            <div className="card" style={{ padding:"22px" }}>
              <h2 style={{ fontSize:15,fontWeight:700,color:"var(--text-h)",marginBottom:14 }}>
                Gallery ({gallery.length} photo{gallery.length!==1?"s":""})
              </h2>
              {gallery.length === 0 ? (
                <div style={{ textAlign:"center",padding:"32px 0",color:"var(--text-p)" }}>
                  <div style={{ marginBottom:8 }}><IImage size={32} color="var(--text-p)"/></div>
                  <p style={{ fontSize:13 }}>No photos yet. Upload your work to attract more customers.</p>
                </div>
              ) : (
                <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8 }}>
                  {gallery.map(img => (
                    <div key={img.id} style={{ position:"relative",borderRadius:9,overflow:"hidden",
                      aspectRatio:"1",background:"var(--bg-subtle)",border:"1px solid var(--border)" }}>
                      <img src={imgUrl(img.image)} alt={img.caption||""}
                        style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                      {img.caption && (
                        <div style={{ position:"absolute",bottom:0,left:0,right:0,
                          background:"rgba(0,0,0,.55)",color:"white",fontSize:10,padding:"4px 6px",
                          whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>
                          {img.caption}
                        </div>
                      )}
                      <button onClick={() => deleteGal(img.id)}
                        style={{ position:"absolute",top:4,right:4,width:22,height:22,borderRadius:"50%",
                          background:"rgba(220,38,38,.85)",border:"none",color:"white",cursor:"pointer",
                          fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",
                          display:"flex",alignItems:"center",justifyContent:"center" }}><IClose size={12} color="white"/></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}