import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  IUser, IPhone, IMail, IMapPin, IFileText, ILock, IEye, IEyeOff,
  ICamera, ISave, IRefresh, ICheckCirc, IAlertCirc,
  IHome, IWrench, IShield, ICalendar, IEdit
} from "./Icons";
import { getProfile, updateProfile, changePassword } from "../services/api";

export default function Profile() {
  const navigate = useNavigate();
  const fileRef  = useRef();
  const [tab,     setTab]     = useState("info");
  const [profile, setProfile] = useState(null);
  const [loading, setLoad]    = useState(true);
  const [saving,  setSave]    = useState(false);
  const [error,   setErr]     = useState("");
  const [msg,     setMsg]     = useState("");
  const [preview, setPreview] = useState(null);
  const [file,    setFile]    = useState(null);
  const [showPw,  setShowPw]  = useState({ old: false, nw: false });
  const [edit,    setEdit]    = useState({ first_name:"", last_name:"", email:"", phone_number:"", bio:"", address:"" });
  const [pw,      setPw]      = useState({ old_password:"", new_password:"", confirm_password:"" });

  useEffect(() => {
    if (!localStorage.getItem("access_token")) { navigate("/login"); return; }
    load();
  }, []);

  const load = async () => {
    try {
      const res = await getProfile();
      const d = res.data;
      setProfile(d);
      setEdit({ first_name:d.first_name||"", last_name:d.last_name||"", email:d.email||"", phone_number:d.phone_number||"", bio:d.bio||"", address:d.address||"" });
      if (d.role) localStorage.setItem("role", d.role);
    } catch { navigate("/login"); }
    finally { setLoad(false); }
  };

  const isK       = (profile?.role||"customer") === "karigar";
  const roleLabel = isK ? "Worker" : "Customer";

  const saveProfile = async () => {
    setSave(true); setErr(""); setMsg("");
    try {
      const fd = new FormData();
      Object.entries(edit).forEach(([k,v]) => fd.append(k, v));
      if (file) fd.append("profile_image", file);
      const res = await updateProfile(fd);
      setProfile(res.data);
      localStorage.setItem("username", res.data.username);
      setMsg("Profile saved successfully.");
      setFile(null); setPreview(null);
    } catch (e) { setErr(e.response?.data?.error || "Failed to update profile."); }
    finally { setSave(false); }
  };

  const savePw = async () => {
    if (!pw.old_password||!pw.new_password||!pw.confirm_password) { setErr("All fields are required."); return; }
    if (pw.new_password !== pw.confirm_password) { setErr("New passwords do not match."); return; }
    if (pw.new_password.length < 8) { setErr("Password must be at least 8 characters."); return; }
    setSave(true); setErr(""); setMsg("");
    try {
      const res = await changePassword(pw);
      if (res.data.access) { localStorage.setItem("access_token", res.data.access); localStorage.setItem("refresh_token", res.data.refresh); }
      setMsg("Password changed successfully.");
      setPw({ old_password:"", new_password:"", confirm_password:"" });
    } catch (e) { setErr(e.response?.data?.error || "Failed to change password."); }
    finally { setSave(false); }
  };

  const len    = pw.new_password.length;
  const str    = len===0?0:len<6?1:len<10?2:len<14?3:4;
  const strClr = ["","#DC2626","#D97706","#16A34A","#2563EB"][str];
  const strTxt = ["","Weak","Fair","Good","Strong"][str];

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"var(--bg-page)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:30, height:30, border:"3px solid var(--border)", borderTopColor:"var(--primary)", borderRadius:"50%", animation:"spin .7s linear infinite", margin:"0 auto 10px" }}/>
        <p style={{ color:"var(--text-p)", fontSize:13 }}>Loading…</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const avatarUrl = preview || profile?.profile_image;
  const initials  = (profile?.first_name?.[0] || profile?.username?.[0] || "U").toUpperCase();

  const TABS = [
    { id:"info",     Icon:IUser, label:"My Info"         },
    { id:"edit",     Icon:IEdit, label:"Edit Profile"    },
    { id:"password", Icon:ILock, label:"Change Password" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-page)", paddingTop:70 }}>
      <div style={{ maxWidth:820, margin:"0 auto", padding:"24px 20px" }}>

        {/* Header */}
        <div className="card" style={{ padding:"20px 22px", marginBottom:14, display:"flex", alignItems:"center", gap:18, flexWrap:"wrap" }}>
          {/* Avatar */}
          <div style={{ position:"relative", flexShrink:0 }}>
            <div style={{ width:66, height:66, borderRadius:"50%", background:avatarUrl?"transparent":"var(--primary)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", border:"2px solid var(--primary-bd)" }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                : <span style={{ fontWeight:700, fontSize:22, color:"white" }}>{initials}</span>
              }
            </div>
            {tab==="edit" && (
              <>
                <button onClick={()=>fileRef.current.click()} style={{ position:"absolute", bottom:0, right:0, width:22, height:22, borderRadius:"50%", background:"var(--primary)", border:"2px solid white", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                  <ICamera size={10} color="white"/>
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }}
                  onChange={e=>{const f=e.target.files[0];if(f){setFile(f);setPreview(URL.createObjectURL(f));}}}/>
              </>
            )}
          </div>

          {/* Name + badges */}
          <div style={{ flex:1, minWidth:140 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap", marginBottom:2 }}>
              <span style={{ fontSize:17, fontWeight:700, color:"var(--text-h)" }}>
                {(profile.first_name||profile.last_name) ? `${profile.first_name} ${profile.last_name}`.trim() : profile.username}
              </span>
              <span className={`badge badge-${isK?"red":"blue"}`}>{isK?<IWrench size={10}/>:<IHome size={10}/>} {roleLabel}</span>
              <span className="badge badge-green"><IShield size={10}/> Verified</span>
            </div>
            <div style={{ fontSize:13, color:"var(--text-s)" }}>@{profile.username}</div>
            {profile.bio && <p style={{ fontSize:13, color:"var(--text-b)", lineHeight:1.6, marginTop:5 }}>{profile.bio}</p>}
          </div>

          {/* Quick stats */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {[
              { label:"Phone", value:profile.phone_number },
              { label:"Joined", value:profile.date_joined },
            ].filter(x=>x.value).map(({label,value})=>(
              <div key={label} style={{ background:"var(--bg-subtle)", border:"1px solid var(--border)", borderRadius:8, padding:"8px 12px" }}>
                <div style={{ fontSize:10, fontWeight:600, color:"var(--text-p)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:2 }}>{label}</div>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--text-h)" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar" style={{ marginBottom:14 }}>
          {TABS.map(({id,Icon,label})=>(
            <button key={id} onClick={()=>{setTab(id);setErr("");setMsg("");}} className={`tab-btn${tab===id?" on":""}`}>
              <Icon size={13}/> {label}
            </button>
          ))}
        </div>

        {/* Alerts */}
        {error && <div className="alert alert-err"  style={{marginBottom:12}}><IAlertCirc size={15} style={{flexShrink:0}}/>{error}</div>}
        {msg   && <div className="alert alert-ok"   style={{marginBottom:12}}><ICheckCirc size={15} style={{flexShrink:0}}/>{msg}</div>}

        {/* ── INFO ── */}
        {tab==="info" && (
          <div className="card" style={{ padding:"4px 0" }}>
            {[
              [IUser,    "Username",    profile.username],
              [isK?IWrench:IHome, "Role", roleLabel],
              [IMail,    "Email",       profile.email||"—"],
              [IPhone,   "Phone",       profile.phone_number||"—"],
              [IMapPin,  "Address",     profile.address||"—"],
              [ICalendar,"Member Since",profile.date_joined||"—"],
            ].map(([Icon,label,value])=>(
              <div key={label} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 18px", borderBottom:"1px solid #F3F4F6" }}>
                <div style={{ width:32, height:32, borderRadius:8, background:"var(--bg-subtle)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Icon size={14} color="var(--text-s)"/>
                </div>
                <div>
                  <div style={{ fontSize:11, color:"var(--text-p)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:2 }}>{label}</div>
                  <div style={{ fontSize:14, fontWeight:500, color:"var(--text-h)" }}>{value}</div>
                </div>
              </div>
            ))}
            {profile.bio && (
              <div style={{ display:"flex", gap:12, padding:"13px 18px" }}>
                <div style={{ width:32, height:32, borderRadius:8, background:"var(--bg-subtle)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <IFileText size={14} color="var(--text-s)"/>
                </div>
                <div>
                  <div style={{ fontSize:11, color:"var(--text-p)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>Bio</div>
                  <p style={{ fontSize:14, color:"var(--text-b)", lineHeight:1.7 }}>{profile.bio}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── EDIT ── */}
        {tab==="edit" && (
          <div className="card" style={{ padding:"22px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:13 }}>
              {[
                {label:"First Name",   name:"first_name",   type:"text",  placeholder:"First name",    Icon:IUser},
                {label:"Last Name",    name:"last_name",    type:"text",  placeholder:"Last name"},
                {label:"Email",        name:"email",        type:"email", placeholder:"you@email.com",  Icon:IMail},
                {label:"Phone Number", name:"phone_number", type:"tel",   placeholder:"98XXXXXXXX",     Icon:IPhone},
              ].map(({label,name,type,placeholder,Icon})=>(
                <div key={name}>
                  <label className="lbl">{label}</label>
                  <div className="input-wrap">
                    {Icon && <span className="input-icon-l"><Icon size={14}/></span>}
                    <input type={type} placeholder={placeholder} value={edit[name]}
                      onChange={e=>{setEdit(s=>({...s,[name]:e.target.value}));setErr("");}}
                      className={`field${Icon?" pl":""}`}/>
                  </div>
                </div>
              ))}
              <div style={{ gridColumn:"1/-1" }}>
                <label className="lbl">Address</label>
                <div className="input-wrap">
                  <span className="input-icon-l"><IMapPin size={14}/></span>
                  <input type="text" placeholder="City, District" value={edit.address}
                    onChange={e=>{setEdit(s=>({...s,address:e.target.value}));setErr("");}}
                    className="field pl"/>
                </div>
              </div>
              <div style={{ gridColumn:"1/-1" }}>
                <label className="lbl">Bio</label>
                <textarea rows={3} placeholder="Tell people about yourself…" value={edit.bio}
                  onChange={e=>{setEdit(s=>({...s,bio:e.target.value}));setErr("");}}
                  className="field" style={{ fontFamily:"Inter,sans-serif" }}/>
              </div>
            </div>

            {preview && (
              <div className="alert alert-info" style={{ marginTop:13, alignItems:"center" }}>
                <img src={preview} style={{ width:36,height:36,borderRadius:"50%",objectFit:"cover",flexShrink:0 }} alt=""/>
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:13, fontWeight:600 }}>New photo selected</span>
                  <button onClick={()=>{setPreview(null);setFile(null);}} style={{ marginLeft:10, background:"none", border:"none", cursor:"pointer", color:"var(--danger)", fontSize:12, fontWeight:600, fontFamily:"Inter,sans-serif" }}>Remove</button>
                </div>
              </div>
            )}

            <div style={{ display:"flex", gap:8, marginTop:18 }}>
              <button onClick={saveProfile} disabled={saving} className="btn btn-primary btn-md">
                {saving ? <><div className="spin"/>Saving…</> : <><ISave size={14}/> Save Changes</>}
              </button>
              <button onClick={()=>{setPreview(null);setFile(null);load();setMsg("");setErr("");}} className="btn btn-outline btn-md">
                <IRefresh size={14}/> Reset
              </button>
            </div>
          </div>
        )}

        {/* ── PASSWORD ── */}
        {tab==="password" && (
          <div className="card" style={{ padding:"22px", maxWidth:400 }}>
            <div className="form-stack">
              {[
                { label:"Current Password", key:"old_password",     toggleKey:"old" },
                { label:"New Password",     key:"new_password",     toggleKey:"nw"  },
                { label:"Confirm Password", key:"confirm_password", toggleKey:null  },
              ].map(({label,key,toggleKey})=>(
                <div key={key}>
                  <label className="lbl">{label}</label>
                  <div className="input-wrap">
                    <span className="input-icon-l"><ILock size={14}/></span>
                    <input type={showPw[toggleKey]?"text":"password"} placeholder="••••••••"
                      value={pw[key]}
                      onChange={e=>{setPw(p=>({...p,[key]:e.target.value}));setErr("");}}
                      className="field pl pr"/>
                    <span className="input-icon-r">
                      {key==="confirm_password" && pw.confirm_password && (
                        pw.new_password===pw.confirm_password
                          ? <ICheckCirc size={14} color="#16A34A"/>
                          : <IAlertCirc size={14} color="#DC2626"/>
                      )}
                      {toggleKey && (
                        <button type="button" style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-p)",display:"flex" }}
                          onClick={()=>setShowPw(p=>({...p,[toggleKey]:!p[toggleKey]}))}>
                          {showPw[toggleKey] ? <IEyeOff size={14}/> : <IEye size={14}/>}
                        </button>
                      )}
                    </span>
                  </div>
                  {key==="new_password" && pw.new_password && (
                    <>
                      <div className="pw-bars">{[1,2,3,4].map(i=><div key={i} className="pw-bar" style={{background:str>=i?strClr:undefined}}/>)}</div>
                      <p className="pw-hint" style={{color:strClr}}>{strTxt}</p>
                    </>
                  )}
                </div>
              ))}
              <button onClick={savePw} disabled={saving} className="btn btn-primary btn-md" style={{ marginTop:4 }}>
                {saving ? <><div className="spin"/>Updating…</> : <><ILock size={14}/> Change Password</>}
              </button>
            </div>
          </div>
        )}

      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}