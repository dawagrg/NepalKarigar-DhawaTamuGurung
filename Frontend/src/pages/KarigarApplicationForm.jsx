import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { submitKarigarApplication, checkApplicationStatus, getCategories } from "../services/api";
import { ICheckCirc, IAlertCirc, IUser, ICamera, IWrench,
         ICard, ITool, ICheck, ISmartphone, ITrophy, IAlertTri } from "../components/Icons";

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

function FileUpload({ label, name, required, hint, value, onChange }) {
  const ref     = useRef();
  const preview = value ? URL.createObjectURL(value) : null;
  return (
    <div>
      <label style={{ fontSize:11, fontWeight:700, color:"var(--text-p)", display:"block",
        marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>
        {label} {required && <span style={{ color:"#DC2626" }}>*</span>}
      </label>
      {hint && <p style={{ fontSize:11, color:"var(--text-p)", marginBottom:6 }}>{hint}</p>}
      <input type="file" accept="image/*,.pdf" ref={ref} style={{ display:"none" }}
        onChange={e => onChange(e.target.files[0] || null)} />
      <div onClick={() => ref.current?.click()}
        style={{ border:"2px dashed var(--border)", borderRadius:10, padding:"16px",
          cursor:"pointer", textAlign:"center", background:"var(--bg-subtle)",
          transition:"border-color .2s" }}
        onMouseEnter={e => e.currentTarget.style.borderColor="var(--primary)"}
        onMouseLeave={e => e.currentTarget.style.borderColor="var(--border)"}>
        {preview ? (
          <div style={{ position:"relative", display:"inline-block" }}>
            <img src={preview} alt="" style={{ maxHeight:120, maxWidth:"100%",
              borderRadius:7, objectFit:"cover" }}/>
            <div style={{ marginTop:6, fontSize:11, color:"var(--primary)", fontWeight:600 }}>
              {value.name} — click to change
            </div>
          </div>
        ) : (
          <div>
            <ICamera size={28} color="var(--text-p)"/>
            <p style={{ fontSize:12, color:"var(--text-p)", marginTop:6 }}>
              Click to upload photo / PDF
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const STEPS = [
  { id:1, label:"Personal Info",    icon:"user" },
  { id:2, label:"Citizenship",      icon:"card" },
  { id:3, label:"Service Details",  icon:"tool" },
  { id:4, label:"Review & Submit",  icon:"check" },
];

export default function KarigarApplicationForm() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // userId & username passed via navigation state from Register page
  const userId   = location.state?.user_id   || localStorage.getItem("pending_user_id");
  const userName = location.state?.username  || localStorage.getItem("pending_username");
  const userPhone= location.state?.phone_number || localStorage.getItem("pending_phone");

  const [step,    setStep]    = useState(1);
  const [cats,    setCats]    = useState([]);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState("");
  const [done,    setDone]    = useState(false);
  const [appStatus, setAppStatus] = useState(null);

  // Form fields
  const [form, setForm] = useState({
    full_name:          "",
    date_of_birth:      "",
    age:                "",
    address:            "",
    district:           "",
    citizenship_number: "",
    service_category_id:"",
    service_title:      "",
    experience_years:   "0",
    about_yourself:     "",
  });
  const [files, setFiles] = useState({
    citizenship_front: null,
    citizenship_back:  null,
    certificate:       null,
    work_sample:       null,
  });

  const set  = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErr(""); };
  const setF = (k, v) => { setFiles(f => ({ ...f, [k]: v })); setErr(""); };

  useEffect(() => {
    getCategories().then(r => setCats(r.data)).catch(() => {});
    // Check if already submitted
    if (userId) {
      checkApplicationStatus(userId)
        .then(r => {
          if (r.data.has_application) setAppStatus(r.data);
        })
        .catch(() => {});
    }
    if (!userId) navigate("/register");
  }, []);

  // Auto-calculate age from DOB
  useEffect(() => {
    if (form.date_of_birth) {
      const dob  = new Date(form.date_of_birth);
      const today = new Date();
      const age  = today.getFullYear() - dob.getFullYear() -
        ((today.getMonth() < dob.getMonth() ||
         (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) ? 1 : 0);
      if (age > 0) set("age", String(age));
    }
  }, [form.date_of_birth]);

  const validateStep = (s) => {
    if (s === 1) {
      if (!form.full_name.trim())     return "Full name is required.";
      if (!form.date_of_birth)        return "Date of birth is required.";
      if (!form.age || parseInt(form.age) < 18) return "You must be at least 18 years old.";
      if (!form.address.trim())       return "Address is required.";
      if (!form.district)             return "District is required.";
    }
    if (s === 2) {
      if (!form.citizenship_number.trim()) return "Citizenship number is required.";
      if (!files.citizenship_front)        return "Citizenship front photo is required.";
    }
    if (s === 3) {
      if (!form.service_title.trim()) return "Service title is required.";
    }
    return null;
  };

  const next = () => {
    const e = validateStep(step);
    if (e) { setErr(e); return; }
    setErr("");
    setStep(s => s + 1);
  };

  const submit = async () => {
    const e = validateStep(3);
    if (e) { setErr(e); return; }
    setSaving(true); setErr("");
    try {
      const fd = new FormData();
      fd.append("user_id", userId);
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v); });
      await submitKarigarApplication(fd);
      // Clear pending storage
      localStorage.removeItem("pending_user_id");
      localStorage.removeItem("pending_username");
      localStorage.removeItem("pending_phone");
      setDone(true);
    } catch(e) {
      const d = e.response?.data;
      setErr(d?.error || d?.detail || "Submission failed. Please try again.");
    } finally { setSaving(false); }
  };

  const INP = {
    width:"100%", padding:"10px 12px", borderRadius:8,
    border:"1.5px solid var(--border)", fontSize:13,
    background:"#fff", color:"var(--text-h)",
    outline:"none", boxSizing:"border-box",
  };
  const LBL = ({ children, req }) => (
    <label style={{ fontSize:11, fontWeight:700, color:"var(--text-p)", display:"block",
      marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>
      {children} {req && <span style={{ color:"#DC2626" }}>*</span>}
    </label>
  );

  // ── Already submitted ──────────────────────────────────────────────────────
  if (appStatus?.has_application) {
    const STATUS_INFO = {
      pending:  { color:"#D97706", bg:"#FFFBEB", icon:"clock", msg:"Your application is being reviewed by our team. You will receive an SMS once a decision is made." },
      approved: { color:"#16A34A", bg:"#F0FDF4", icon:"check", msg:"Your application has been approved! You can now log in." },
      rejected: { color:"#DC2626", bg:"#FEF2F2", icon:"close", msg:"Your application was not approved." },
    };
    const info = STATUS_INFO[appStatus.status] || STATUS_INFO.pending;
    return (
      <div style={{ minHeight:"100vh", background:"#F9FAFB", display:"flex",
        alignItems:"center", justifyContent:"center", padding:20 }}>
        <div style={{ maxWidth:480, width:"100%", textAlign:"center" }}>
          <div style={{ marginBottom:16, display:"flex", justifyContent:"center" }}>{info.icon==="check"?<ICheckCirc size={56} color="#16A34A"/>:info.icon==="close"?<IAlertCirc size={56} color="#DC2626"/>:<IAlertCirc size={56} color="#D97706"/>}</div>
          <h2 style={{ fontSize:22, fontWeight:800, color:"#111827", marginBottom:8 }}>
            Application {appStatus.status.charAt(0).toUpperCase() + appStatus.status.slice(1)}
          </h2>
          <div style={{ background:info.bg, border:`1.5px solid`, borderColor:info.color+"33",
            borderRadius:12, padding:"16px 20px", marginBottom:20, color:info.color }}>
            {info.msg}
          </div>
          {appStatus.admin_note && appStatus.status === "rejected" && (
            <div style={{ background:"#FEF2F2", border:"1.5px solid #FECACA", borderRadius:10,
              padding:"12px 16px", marginBottom:16, fontSize:13, color:"#DC2626" }}>
              <strong>Reason:</strong> {appStatus.admin_note}
            </div>
          )}
          {appStatus.status === "approved" ? (
            <button className="btn btn-primary btn-lg" onClick={() => navigate("/login")}>
              Log In Now
            </button>
          ) : (
            <button className="btn btn-outline btn-sm" onClick={() => navigate("/")}>
              Go to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Submission success ─────────────────────────────────────────────────────
  if (done) return (
    <div style={{ minHeight:"100vh", background:"#F9FAFB", display:"flex",
      alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ maxWidth:520, width:"100%", textAlign:"center" }}>
        <div style={{ width:80, height:80, borderRadius:"50%", background:"#F0FDF4",
          border:"2px solid #BBF7D0", display:"flex", alignItems:"center",
          justifyContent:"center", margin:"0 auto 20px" }}>
          <ICheckCirc size={36} color="#16A34A"/>
        </div>
        <h1 style={{ fontSize:24, fontWeight:800, color:"#111827", marginBottom:10 }}>
          Application Submitted!
        </h1>
        <p style={{ fontSize:14, color:"#6B7280", lineHeight:1.75, marginBottom:24 }}>
          Thank you <strong>{userName}</strong>! Your verification application has been
          received and is under review by our admin team.
        </p>
        <div style={{ background:"#EFF6FF", border:"1.5px solid #BFDBFE", borderRadius:12,
          padding:"16px 20px", marginBottom:24, textAlign:"left" }}>
          <p style={{ fontSize:13, fontWeight:700, color:"#1D4ED8", marginBottom:8 }}>
            What happens next?
          </p>
          {[
            "Our team will review your citizenship and service documents.",
            "This usually takes 1–2 business days.",
            `You will receive an SMS on ${userPhone || "your registered number"} once a decision is made.`,
            "If approved, you can log in and start receiving bookings immediately.",
          ].map((t,i) => (
            <div key={i} style={{ display:"flex", gap:8, marginBottom:6, fontSize:13, color:"#1E40AF" }}>
              <span style={{ fontWeight:700, flexShrink:0 }}>{i+1}.</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
        <button className="btn btn-outline btn-lg" onClick={() => navigate("/")}>
          Go to Home
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#F9FAFB", paddingTop:40, paddingBottom:60 }}>
      <div style={{ maxWidth:640, margin:"0 auto", padding:"0 20px" }}>

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:32, justifyContent:"center" }}>
          <div style={{ width:36, height:36, background:"#2563EB", borderRadius:10,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <IWrench size={18} color="white"/>
          </div>
          <span style={{ fontWeight:800, fontSize:20, color:"#111827" }}>NepalKarigar</span>
        </div>

        <div style={{ textAlign:"center", marginBottom:28 }}>
          <h1 style={{ fontSize:22, fontWeight:800, color:"#111827", marginBottom:6 }}>
            Karigar Verification
          </h1>
          <p style={{ fontSize:13, color:"#6B7280" }}>
            Hi <strong>{userName}</strong>! Complete your verification to start receiving bookings.
          </p>
        </div>

        {/* Step progress */}
        <div style={{ display:"flex", gap:0, marginBottom:28, background:"white",
          borderRadius:12, border:"1.5px solid var(--border)", overflow:"hidden" }}>
          {STEPS.map((s, i) => {
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} style={{ flex:1, padding:"12px 8px", textAlign:"center",
                background: active ? "#2563EB" : done ? "#EFF6FF" : "white",
                borderRight: i < STEPS.length-1 ? "1px solid var(--border)" : "none",
                transition:"background .2s" }}>
                <div style={{ fontSize:18, marginBottom:2 }}>
                  {done ? <ICheckCirc size={20} color={active?"white":"#2563EB"}/> : s.icon === "user" ? <IUser size={20} color={active?"white":"var(--text-p)"}/> : s.icon === "card" ? <ICard size={20} color={active?"white":"var(--text-p)"}/> : s.icon === "tool" ? <ITool size={20} color={active?"white":"var(--text-p)"}/> : <ICheck size={20} color={active?"white":"var(--text-p)"}/>}
                </div>
                <div style={{ fontSize:10, fontWeight:700,
                  color: active ? "white" : done ? "#2563EB" : "#9CA3AF",
                  textTransform:"uppercase", letterSpacing:"0.04em" }}>
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Error */}
        {err && (
          <div style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"10px 14px",
            background:"#FEF2F2", border:"1.5px solid #FECACA", borderRadius:9,
            marginBottom:16, fontSize:13, color:"#DC2626" }}>
            <IAlertCirc size={14} style={{ flexShrink:0, marginTop:1 }}/>
            <span>{err}</span>
          </div>
        )}

        <div className="card" style={{ padding:"28px 24px" }}>

          {/* ── STEP 1: Personal Info ───────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize:16, fontWeight:700, color:"var(--text-h)", marginBottom:20 }}>
                Personal Information
              </h2>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

                <div>
                  <LBL req>Full Name (as on citizenship)</LBL>
                  <input value={form.full_name} onChange={e=>set("full_name",e.target.value)}
                    placeholder="e.g. Prasan Kumar Rai" style={INP}
                    onFocus={e=>e.target.style.borderColor="var(--primary)"}
                    onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div>
                    <LBL req>Date of Birth</LBL>
                    <input type="date" value={form.date_of_birth}
                      onChange={e=>set("date_of_birth",e.target.value)}
                      max={new Date(Date.now()-18*365*24*60*60*1000).toISOString().split("T")[0]}
                      style={INP}
                      onFocus={e=>e.target.style.borderColor="var(--primary)"}
                      onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                  </div>
                  <div>
                    <LBL req>Age</LBL>
                    <input type="number" min="18" max="80" value={form.age}
                      onChange={e=>set("age",e.target.value)}
                      placeholder="e.g. 28" style={INP}
                      onFocus={e=>e.target.style.borderColor="var(--primary)"}
                      onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                    {form.age && parseInt(form.age) < 18 && (
                      <p style={{ fontSize:11, color:"#DC2626", marginTop:4, display:"flex", alignItems:"center", gap:4 }}>
                        <IAlertTri size={11} color="#DC2626"/> Must be at least 18 years old
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <LBL req>Current Address</LBL>
                  <input value={form.address} onChange={e=>set("address",e.target.value)}
                    placeholder="e.g. Ward No. 5, Thamel, Kathmandu" style={INP}
                    onFocus={e=>e.target.style.borderColor="var(--primary)"}
                    onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>

                <div>
                  <LBL req>District</LBL>
                  <select value={form.district} onChange={e=>set("district",e.target.value)}
                    style={{ ...INP, cursor:"pointer" }}>
                    <option value="">— Select your district —</option>
                    {DISTRICTS.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

              </div>
            </div>
          )}

          {/* ── STEP 2: Citizenship ─────────────────────────────────────────── */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize:16, fontWeight:700, color:"var(--text-h)", marginBottom:6 }}>
                Citizenship Details
              </h2>
              <p style={{ fontSize:12, color:"var(--text-s)", marginBottom:20 }}>
                Your citizenship card is used to verify your identity. Documents are kept secure and private.
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

                <div>
                  <LBL req>Citizenship Number</LBL>
                  <input value={form.citizenship_number}
                    onChange={e=>set("citizenship_number",e.target.value)}
                    placeholder="e.g. 12-03-70-00123" style={INP}
                    onFocus={e=>e.target.style.borderColor="var(--primary)"}
                    onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>

                <FileUpload
                  label="Citizenship Card — Front Side" required
                  hint="Clear photo of the front of your citizenship card"
                  value={files.citizenship_front}
                  onChange={v=>setF("citizenship_front",v)}/>

                <FileUpload
                  label="Citizenship Card — Back Side"
                  hint="Clear photo of the back side (optional but recommended)"
                  value={files.citizenship_back}
                  onChange={v=>setF("citizenship_back",v)}/>

              </div>
            </div>
          )}

          {/* ── STEP 3: Service Details ─────────────────────────────────────── */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize:16, fontWeight:700, color:"var(--text-h)", marginBottom:6 }}>
                Service & Skills
              </h2>
              <p style={{ fontSize:12, color:"var(--text-s)", marginBottom:20 }}>
                Tell us about your trade. Upload a certificate or evidence of your skills.
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

                <div>
                  <LBL>Primary Service Category</LBL>
                  <select value={form.service_category_id}
                    onChange={e=>set("service_category_id",e.target.value)}
                    style={{ ...INP, cursor:"pointer" }}>
                    <option value="">— Select a category —</option>
                    {cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <LBL req>Service Title / Trade</LBL>
                  <input value={form.service_title}
                    onChange={e=>set("service_title",e.target.value)}
                    placeholder="e.g. Licensed Electrician, Master Plumber, Carpenter"
                    style={INP}
                    onFocus={e=>e.target.style.borderColor="var(--primary)"}
                    onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>

                <div>
                  <LBL>Years of Experience</LBL>
                  <input type="number" min="0" max="50"
                    value={form.experience_years}
                    onChange={e=>set("experience_years",e.target.value)}
                    style={INP}
                    onFocus={e=>e.target.style.borderColor="var(--primary)"}
                    onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>

                <FileUpload
                  label="Certificate / License"
                  hint="Trade certificate, NTC license, or any official qualification"
                  value={files.certificate}
                  onChange={v=>setF("certificate",v)}/>

                <FileUpload
                  label="Work Sample Photo"
                  hint="A photo of your past work (strongly recommended)"
                  value={files.work_sample}
                  onChange={v=>setF("work_sample",v)}/>

                <div>
                  <LBL>About Yourself</LBL>
                  <textarea value={form.about_yourself}
                    onChange={e=>set("about_yourself",e.target.value)}
                    rows={3} placeholder="Briefly describe your experience, skills and why customers should hire you…"
                    style={{ ...INP, resize:"vertical", fontFamily:"inherit" }}
                    onFocus={e=>e.target.style.borderColor="var(--primary)"}
                    onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>

              </div>
            </div>
          )}

          {/* ── STEP 4: Review & Submit ─────────────────────────────────────── */}
          {step === 4 && (
            <div>
              <h2 style={{ fontSize:16, fontWeight:700, color:"var(--text-h)", marginBottom:16 }}>
                Review Your Application
              </h2>
              {/* Summary */}
              {[
                ["Full Name",           form.full_name],
                ["Date of Birth",       form.date_of_birth],
                ["Age",                 form.age + " years"],
                ["Address",            form.address],
                ["District",            form.district],
                ["Citizenship No.",    form.citizenship_number],
                ["Service Title",       form.service_title],
                ["Experience",          form.experience_years + " years"],
              ].map(([l,v])=>(
                <div key={l} style={{ display:"flex", justifyContent:"space-between",
                  padding:"8px 0", borderBottom:"1px solid var(--border)", fontSize:13 }}>
                  <span style={{ color:"var(--text-s)", fontWeight:500 }}>{l}</span>
                  <span style={{ color:"var(--text-h)", fontWeight:600, textAlign:"right",
                    maxWidth:"60%", wordBreak:"break-word" }}>{v||"—"}</span>
                </div>
              ))}

              {/* Files summary */}
              <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:6 }}>
                {[
                  ["Citizenship Front", files.citizenship_front],
                  ["Citizenship Back",  files.citizenship_back],
                  ["Certificate",       files.certificate],
                  ["Work Sample",       files.work_sample],
                ].map(([l,f])=>(
                  <div key={l} style={{ display:"flex", justifyContent:"space-between",
                    fontSize:12, padding:"5px 0", borderBottom:"1px solid #F3F4F6" }}>
                    <span style={{ color:"var(--text-s)" }}>{l}</span>
                    <span style={{ fontWeight:600,
                      color:f?"#16A34A":"#9CA3AF", display:"flex", alignItems:"center", gap:3 }}>
                      {f ? <><ICheck size={11} color="#16A34A"/>{f.name}</> : "Not provided"}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop:20, padding:"14px 16px", background:"#EFF6FF",
                border:"1.5px solid #BFDBFE", borderRadius:10, fontSize:12, color:"#1D4ED8" }}>
                You will receive an SMS on <strong>{userPhone}</strong> once the admin reviews your application.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display:"flex", justifyContent:"space-between",
            marginTop:24, gap:10 }}>
            {step > 1 ? (
              <button onClick={() => { setErr(""); setStep(s=>s-1); }}
                style={{ flex:1, padding:"11px", borderRadius:9,
                  border:"1.5px solid var(--border)", background:"#fff",
                  fontWeight:700, fontSize:14, cursor:"pointer", color:"var(--text-s)" }}>
                ← Back
              </button>
            ) : <div style={{ flex:1 }}/>}

            {step < 4 ? (
              <button onClick={next}
                style={{ flex:2, padding:"11px", borderRadius:9,
                  border:"none", background:"#2563EB", color:"white",
                  fontWeight:700, fontSize:14, cursor:"pointer" }}>
                Next →
              </button>
            ) : (
              <button onClick={submit} disabled={saving}
                style={{ flex:2, padding:"11px", borderRadius:9,
                  border:"none", background:saving?"#93C5FD":"#2563EB",
                  color:"white", fontWeight:700, fontSize:14,
                  cursor:saving?"not-allowed":"pointer" }}>
                {saving ? "Submitting…" : "Submit Application"}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}