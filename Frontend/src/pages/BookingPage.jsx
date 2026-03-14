import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getKarigarPublicProfile, createBooking } from "../services/api";
import { ICheckCirc, IAlertCirc, IUser, ICalendar } from "../components/Icons";

const MEDIA_BASE = "http://127.0.0.1:8000";
const imgUrl = r => !r ? null : r.startsWith("http") ? r : `${MEDIA_BASE}${r.startsWith("/") ? r : "/media/" + r}`;

export default function BookingPage() {
  const navigate    = useNavigate();
  const [sp]        = useSearchParams();
  const karigarId   = sp.get("karigar");   // user_id  → for booking POST
  const profileId   = sp.get("profile");   // karigar_profile_id → for API fetch

  const [kp,       setKp]       = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState("");
  const [success,  setSuccess]  = useState(false);
  const [booking,  setBooking]  = useState(null);

  // Form fields
  const [subServiceId, setSubServiceId] = useState("");
  const [address,  setAddress]  = useState(localStorage.getItem("user_address") || "");
  const [date,     setDate]     = useState("");
  const [note,     setNote]     = useState("");
  const [wantBargain, setWantBargain] = useState(false);
  const [offeredRate, setOfferedRate] = useState("");
  const [bargainMsg,  setBargainMsg]  = useState("");

  useEffect(() => {
    if (!localStorage.getItem("access_token")) { navigate("/login"); return; }
    if (!profileId) { navigate("/search"); return; }  // profileId is the karigar_profile_id
    getKarigarPublicProfile(profileId)
      .then(r => { setKp(r.data); setOfferedRate(r.data.hourly_rate || ""); })
      .catch(() => setErr("Could not load karigar details."))
      .finally(() => setLoading(false));
  }, [karigarId]);

  const today = new Date().toISOString().split("T")[0];

  const submit = async () => {
    setErr("");
    if (!address.trim()) { setErr("Please enter a service address."); return; }
    if (!date)           { setErr("Please select a date."); return; }
    if (date < today)    { setErr("Date cannot be in the past."); return; }
    if (wantBargain && (!offeredRate || parseFloat(offeredRate) <= 0)) {
      setErr("Please enter a valid offered rate."); return;
    }

    setSaving(true);
    try {
      const payload = {
        karigar_profile_id: profileId,   // KarigarProfile PK — what backend expects
        address,
        date,
        note,
        ...(subServiceId && { sub_service_id: parseInt(subServiceId) }),
        ...(wantBargain && offeredRate && { offered_rate: offeredRate, bargain_message: bargainMsg }),
      };
      const res = await createBooking(payload);
      setBooking(res.data);
      setSuccess(true);
    } catch (e) {
      const d = e.response?.data;
      const msg = d?.error || d?.detail || d?.karigar_profile_id?.[0]
        || (typeof d === "object" ? Object.values(d)[0] : null)
        || "Failed to create booking. Please try again.";
      setErr(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight:"100vh",background:"var(--bg-page)",paddingTop:70,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ width:30,height:30,border:"3px solid var(--border)",borderTopColor:"var(--primary)",
        borderRadius:"50%",animation:"spin .7s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (success && booking) return (
    <div style={{ minHeight:"100vh",background:"var(--bg-page)",paddingTop:70,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div className="card" style={{ padding:"40px 32px",maxWidth:440,width:"100%",textAlign:"center" }}>
        <div style={{ width:64,height:64,borderRadius:"50%",background:"#F0FDF4",border:"2px solid #BBF7D0",
          display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px" }}>
          <ICheckCirc size={28} color="#16A34A"/>
        </div>
        <h2 style={{ fontSize:20,fontWeight:800,color:"var(--text-h)",marginBottom:6 }}>Booking Submitted!</h2>
        <p style={{ fontSize:13,color:"var(--text-s)",marginBottom:16,lineHeight:1.6 }}>
          Your booking has been sent to <strong>{kp?.full_name || kp?.username}</strong>.
          {booking.status === "bargaining"
            ? " Your rate offer is under negotiation."
            : " Waiting for the karigar to accept."}
        </p>
        <div style={{ background:"var(--bg-subtle)",borderRadius:10,padding:"14px",marginBottom:20,textAlign:"left" }}>
          {[
            ["Status",   booking.status.charAt(0).toUpperCase()+booking.status.slice(1)],
            ["Date",     booking.date],
            ["Address",  booking.address],
            ["Service",  booking.sub_service_name || "General"],
            ...(booking.offered_rate ? [["Your Offered Rate","NPR "+parseFloat(booking.offered_rate).toLocaleString()+"/hr"]] : []),
            ...(booking.karigar_rate ? [["Karigar's Rate","NPR "+parseFloat(booking.karigar_rate).toLocaleString()+"/hr"]] : []),
          ].map(([l,v]) => (
            <div key={l} style={{ display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:13,
              borderBottom:"1px solid var(--border)" }}>
              <span style={{ color:"var(--text-s)" }}>{l}</span>
              <span style={{ fontWeight:600,color:"var(--text-h)" }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <button className="btn btn-outline btn-sm" style={{ flex:1 }} onClick={() => navigate("/my-bookings")}>
            My Bookings
          </button>
          <button className="btn btn-primary btn-sm" style={{ flex:1 }} onClick={() => navigate("/search")}>
            Find More
          </button>
        </div>
      </div>
    </div>
  );

  const avatar = imgUrl(kp?.profile_image);
  const karigarRate = parseFloat(kp?.hourly_rate || 0);

  return (
    <div style={{ minHeight:"100vh",background:"var(--bg-page)",paddingTop:70 }}>
      <div style={{ maxWidth:640,margin:"0 auto",padding:"28px 20px" }}>

        {/* Header */}
        <button onClick={() => navigate(-1)}
          style={{ display:"inline-flex",alignItems:"center",gap:6,marginBottom:20,padding:"6px 12px",
            borderRadius:8,border:"1.5px solid var(--border)",background:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,color:"var(--text-s)" }}>
          ← Back
        </button>
        <h1 style={{ fontSize:22,fontWeight:800,color:"var(--text-h)",marginBottom:4 }}>Book a Karigar</h1>
        <p style={{ fontSize:13,color:"var(--text-s)",marginBottom:22 }}>Fill in the details below to request a booking.</p>

        {err && <div className="alert alert-err" style={{ marginBottom:16 }}><IAlertCirc size={14}/> {err}</div>}

        {/* Karigar mini-card */}
        {kp && (
          <div className="card" style={{ padding:"16px",marginBottom:18,display:"flex",gap:14,alignItems:"center" }}>
            <div style={{ width:52,height:52,borderRadius:"50%",overflow:"hidden",flexShrink:0,
              background:"var(--primary-bg)",border:"2px solid var(--primary-bd)",
              display:"flex",alignItems:"center",justifyContent:"center" }}>
              {avatar
                ? <img src={avatar} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                : <span style={{ fontWeight:700,fontSize:20,color:"var(--primary)" }}>{(kp.full_name||kp.username||"K")[0].toUpperCase()}</span>}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700,fontSize:15,color:"var(--text-h)" }}>{kp.full_name || kp.username}</div>
              <div style={{ fontSize:12,color:"var(--text-s)" }}>{kp.category} {kp.district ? `• ${kp.district}` : ""}</div>
            </div>
            {karigarRate > 0 && (
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:15,fontWeight:700,color:"var(--primary)" }}>NPR {karigarRate.toLocaleString()}</div>
                <div style={{ fontSize:11,color:"var(--text-p)" }}>per hour</div>
              </div>
            )}
          </div>
        )}

        <div className="card" style={{ padding:"24px" }}>
          <div className="form-stack">

            {/* Sub-service */}
            {kp?.sub_services?.length > 0 && (
              <div>
                <label style={{ fontSize:11,fontWeight:700,color:"var(--text-p)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em" }}>
                  Service Needed
                </label>
                <select value={subServiceId} onChange={e => setSubServiceId(e.target.value)}
                  style={{ width:"100%",padding:"10px 12px",borderRadius:8,border:"1.5px solid var(--border)",
                    fontSize:13,background:"#fff",outline:"none",cursor:"pointer",boxSizing:"border-box" }}
                  onFocus={e=>e.target.style.borderColor="var(--primary)"}
                  onBlur={e=>e.target.style.borderColor="var(--border)"}>
                  <option value="">— Select a service (optional) —</option>
                  {kp.sub_services.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.base_price ? ` (from NPR ${parseFloat(s.base_price).toLocaleString()})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date */}
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:"var(--text-p)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em" }}>
                Service Date *
              </label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} min={today}
                style={{ width:"100%",padding:"10px 12px",borderRadius:8,border:"1.5px solid var(--border)",
                  fontSize:13,background:"#fff",outline:"none",boxSizing:"border-box" }}
                onFocus={e=>e.target.style.borderColor="var(--primary)"}
                onBlur={e=>e.target.style.borderColor="var(--border)"}/>
            </div>

            {/* Address */}
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:"var(--text-p)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em" }}>
                Service Address *
              </label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                placeholder="e.g. House No. 12, Thamel, Kathmandu"
                style={{ width:"100%",padding:"10px 12px",borderRadius:8,border:"1.5px solid var(--border)",
                  fontSize:13,background:"#fff",outline:"none",boxSizing:"border-box" }}
                onFocus={e=>e.target.style.borderColor="var(--primary)"}
                onBlur={e=>e.target.style.borderColor="var(--border)"}/>
            </div>

            {/* Note */}
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:"var(--text-p)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em" }}>
                Note to Karigar (optional)
              </label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                placeholder="Describe what you need done, any special instructions…"
                style={{ width:"100%",padding:"10px 12px",borderRadius:8,border:"1.5px solid var(--border)",
                  fontSize:13,background:"#fff",outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit" }}
                onFocus={e=>e.target.style.borderColor="var(--primary)"}
                onBlur={e=>e.target.style.borderColor="var(--border)"}/>
            </div>

            {/* Bargaining toggle */}
            {karigarRate > 0 && (
              <div style={{ borderTop:"1px solid var(--border)",paddingTop:16 }}>
                <button type="button"
                  onClick={() => { setWantBargain(b => !b); setOfferedRate(String(karigarRate)); }}
                  style={{ display:"flex",alignItems:"center",gap:10,width:"100%",padding:"12px 14px",
                    borderRadius:9,border:`2px solid ${wantBargain?"var(--primary)":"var(--border)"}`,
                    background:wantBargain?"var(--primary-bg)":"#fff",cursor:"pointer",textAlign:"left",transition:"all .15s" }}>
                  <div style={{ width:20,height:20,borderRadius:5,border:`2px solid ${wantBargain?"var(--primary)":"var(--border)"}`,
                    background:wantBargain?"var(--primary)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                    {wantBargain && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <div>
                    <div style={{ fontWeight:700,fontSize:13,color:wantBargain?"var(--primary)":"var(--text-h)" }}>
                      💰 Negotiate the Rate
                    </div>
                    <div style={{ fontSize:12,color:"var(--text-s)",marginTop:1 }}>
                      Karigar's listed rate is NPR {karigarRate.toLocaleString()}/hr. Offer a different rate.
                    </div>
                  </div>
                </button>

                {wantBargain && (
                  <div style={{ marginTop:14,display:"flex",flexDirection:"column",gap:12 }}>
                    <div>
                      <label style={{ fontSize:11,fontWeight:700,color:"var(--text-p)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em" }}>
                        Your Offered Rate (NPR/hr) *
                      </label>
                      <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                        <input type="number" min="1" value={offeredRate} onChange={e => setOfferedRate(e.target.value)}
                          style={{ flex:1,padding:"10px 12px",borderRadius:8,border:"1.5px solid var(--border)",
                            fontSize:14,fontWeight:600,background:"#fff",outline:"none" }}
                          onFocus={e=>e.target.style.borderColor="var(--primary)"}
                          onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                        <span style={{ fontSize:12,color:"var(--text-s)",whiteSpace:"nowrap" }}>NPR / hr</span>
                      </div>
                      {offeredRate && karigarRate > 0 && parseFloat(offeredRate) !== karigarRate && (
                        <div style={{ marginTop:6,fontSize:12,color: parseFloat(offeredRate)<karigarRate?"#D97706":"#16A34A" }}>
                          {parseFloat(offeredRate) < karigarRate
                            ? `↓ NPR ${(karigarRate - parseFloat(offeredRate)).toLocaleString()} less than listed rate`
                            : `↑ NPR ${(parseFloat(offeredRate) - karigarRate).toLocaleString()} more than listed rate`}
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ fontSize:11,fontWeight:700,color:"var(--text-p)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em" }}>
                        Message (optional)
                      </label>
                      <textarea value={bargainMsg} onChange={e => setBargainMsg(e.target.value)} rows={2}
                        placeholder="Explain your offer, e.g. 'I have multiple rooms, can you offer a discount?'"
                        style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid var(--border)",
                          fontSize:13,background:"#fff",outline:"none",resize:"none",boxSizing:"border-box",fontFamily:"inherit" }}
                        onFocus={e=>e.target.style.borderColor="var(--primary)"}
                        onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <button onClick={submit} disabled={saving} className="btn btn-primary btn-full" style={{ marginTop:4,fontSize:15,padding:"12px" }}>
              {saving ? "Submitting…" : wantBargain ? "Submit Booking with Offer" : "Confirm Booking Request"}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}