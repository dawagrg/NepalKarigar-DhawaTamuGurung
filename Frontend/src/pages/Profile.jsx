import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, updateProfile, changePassword } from "../services/api";

export default function Profile() {
  const navigate  = useNavigate();
  const fileRef   = useRef();
  const [tab, setTab]           = useState("info");
  const [profile, setProfile]   = useState(null);
  const [loading, setLoad]      = useState(true);
  const [saving, setSave]       = useState(false);
  const [focused, setFocus]     = useState("");
  const [error, setError]       = useState("");
  const [msg, setMsg]           = useState("");
  const [preview, setPreview]   = useState(null);
  const [file, setFile]         = useState(null);
  const [edit, setEdit]         = useState({ first_name:"", last_name:"", email:"", phone_number:"", bio:"", address:"" });
  const [pw, setPw]             = useState({ old_password:"", new_password:"", confirm_password:"" });

  useEffect(() => {
    if (!localStorage.getItem("access_token")) { navigate("/login"); return; }
    load();
  }, []);

  const load = async () => {
    try {
      const res = await getProfile();
      const d = res.data;
      setProfile(d);
      setEdit({ first_name: d.first_name||"", last_name: d.last_name||"", email: d.email||"", phone_number: d.phone_number||"", bio: d.bio||"", address: d.address||"" });
      if (d.role) localStorage.setItem("role", d.role);
    } catch { navigate("/login"); }
    finally { setLoad(false); }
  };

  const role      = profile?.role || "customer";
  const isK       = role === "karigar";
  const accent    = isK ? "#E11D48" : "#4F46E5";
  const accentLt  = isK ? "#FFF1F2" : "#EEF2FF";
  const accentBdr = isK ? "#FECDD3" : "#C7D2FE";
  const accentGrd = isK ? "linear-gradient(135deg, #E11D48, #9F1239)" : "linear-gradient(135deg, #4F46E5, #7C3AED)";
  const accentShd = isK ? "rgba(225,29,72,0.25)" : "rgba(79,70,229,0.25)";
  const roleLabel = isK ? "🔧 Karigar" : "🏠 Customer";
  const pillCls   = isK ? "pill-rose" : "pill-indigo";
  const btnCls    = isK ? "btn btn-rose" : "btn btn-primary";
  const focusCls  = (name) => `nk-input${isK ? " rk" : ""}${focused === name ? " focused" : ""}`;

  const saveProfile = async () => {
    setSave(true); setError(""); setMsg("");
    try {
      const fd = new FormData();
      Object.entries(edit).forEach(([k,v]) => fd.append(k, v));
      if (file) fd.append("profile_image", file);
      const res = await updateProfile(fd);
      setProfile(res.data);
      localStorage.setItem("username", res.data.username);
      setMsg("Profile saved successfully ✓");
      setFile(null); setPreview(null);
    } catch (err) { setError(err.response?.data?.error || "Failed to update."); }
    finally { setSave(false); }
  };

  const savePw = async () => {
    if (!pw.old_password || !pw.new_password || !pw.confirm_password) { setError("All fields are required."); return; }
    if (pw.new_password !== pw.confirm_password) { setError("Passwords do not match."); return; }
    if (pw.new_password.length < 8) { setError("Min. 8 characters."); return; }
    setSave(true); setError(""); setMsg("");
    try {
      const res = await changePassword(pw);
      if (res.data.access) { localStorage.setItem("access_token", res.data.access); localStorage.setItem("refresh_token", res.data.refresh); }
      setMsg("Password changed successfully ✓");
      setPw({ old_password:"", new_password:"", confirm_password:"" });
    } catch (err) { setError(err.response?.data?.error || "Failed."); }
    finally { setSave(false); }
  };

  const pwLen = pw.new_password.length;
  const str   = pwLen===0 ? 0 : pwLen<6 ? 1 : pwLen<10 ? 2 : pwLen<14 ? 3 : 4;
  const strC  = ["","#E11D48","#D97706","#059669","#4F46E5"][str];
  const strLbl= ["","Weak","Fair","Good","Strong"][str];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #E2E8F0", borderTopColor: "#4F46E5", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "#94A3B8", fontSize: 14 }}>Loading profile…</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const avatarUrl = preview || profile?.profile_image;
  const initials  = (profile?.first_name?.[0] || profile?.username?.[0] || "U").toUpperCase();

  const FLabel = ({ children }) => (
    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{children}</label>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", paddingTop: 80, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Soft bg blobs */}
      <div className="blob" style={{ width: 500, height: 500, background: `${isK ? "rgba(225,29,72,0.04)" : "rgba(79,70,229,0.05)"}`, top: 0, right: 0, position: "fixed" }} />
      <div className="dot-bg" style={{ position: "fixed", inset: 0, opacity: 0.3 }} />

      <div style={{ maxWidth: 940, margin: "0 auto", padding: "36px 24px", position: "relative", zIndex: 1 }}>

        {/* ── HERO CARD ── */}
        <div className="card" style={{ padding: "32px", marginBottom: 24, borderRadius: 24, position: "relative", overflow: "hidden" }}>
          {/* Accent corner */}
          <div style={{ position: "absolute", top: 0, right: 0, width: 220, height: 220, background: `radial-gradient(circle at top right, ${accentLt}, transparent 70%)`, borderRadius: "0 24px 0 0", pointerEvents: "none" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap", position: "relative" }}>
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 90, height: 90, borderRadius: "50%", background: avatarUrl ? "transparent" : accentGrd, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 800, color: "white", fontFamily: "Syne, sans-serif", overflow: "hidden", border: `3px solid ${accentBdr}`, boxShadow: `0 0 0 4px ${accentLt}, 0 8px 28px rgba(0,0,0,0.08)` }}>
                {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
              </div>
              {tab === "edit" && (
                <>
                  <button onClick={() => fileRef.current.click()} style={{ position: "absolute", bottom: 2, right: 2, width: 28, height: 28, borderRadius: "50%", background: accentGrd, border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12, boxShadow: `0 2px 8px ${accentShd}` }}>✎</button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (f) { setFile(f); setPreview(URL.createObjectURL(f)); } }} />
                </>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 24, color: "#0F172A", margin: 0 }}>
                  {profile.first_name||profile.last_name ? `${profile.first_name} ${profile.last_name}`.trim() : profile.username}
                </h2>
                <span className={`pill ${pillCls}`}>{roleLabel}</span>
                <span className="pill pill-green">✓ Verified</span>
              </div>
              <div style={{ color: "#94A3B8", fontSize: 13, marginBottom: profile.bio ? 10 : 0 }}>@{profile.username}</div>
              {profile.bio && <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.65, maxWidth: 520 }}>{profile.bio}</p>}
            </div>

            {/* Meta */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[["📅", profile.date_joined, "Joined"], ["📱", profile.phone_number, "Phone"]].map(([icon, val, label]) => (
                <div key={label} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, padding: "12px 16px", textAlign: "center", minWidth: 110 }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{val || "—"}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "white", border: "1px solid #E2E8F0", borderRadius: 14, padding: 5, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          {[["info","👤","My Info"],["edit","✏️","Edit Profile"],["password","🔒","Change Password"]].map(([id, icon, label]) => (
            <button key={id} onClick={() => { setTab(id); setError(""); setMsg(""); }} style={{
              flex: 1, padding: "10px 14px", border: "none", cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 13, borderRadius: 10,
              transition: "all 0.22s",
              background: tab === id ? accentGrd : "transparent",
              color: tab === id ? "white" : "#64748B",
              boxShadow: tab === id ? `0 4px 14px ${accentShd}` : "none",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}>
              <span>{icon}</span><span>{label}</span>
            </button>
          ))}
        </div>

        {/* Alerts */}
        {error && <div className="fade-in" style={{ background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: 12, padding: "13px 18px", marginBottom: 20, color: "#BE123C", fontSize: 14, display: "flex", gap: 10 }}><span>⚠</span>{error}</div>}
        {msg   && <div className="fade-in" style={{ background: "#F0FDF4", border: "1px solid #A7F3D0", borderRadius: 12, padding: "13px 18px", marginBottom: 20, color: "#065F46", fontSize: 14, display: "flex", gap: 10 }}><span>✓</span>{msg}</div>}

        {/* ── INFO TAB ── */}
        {tab === "info" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 14 }}>
            {[["👤","Username",profile.username],["🏷️","Role",roleLabel],["✉️","Email",profile.email||"Not set"],["📱","Phone",profile.phone_number],["📍","Address",profile.address||"Not set"],["📅","Member Since",profile.date_joined],["🪪","Full Name",(profile.first_name||profile.last_name)?`${profile.first_name} ${profile.last_name}`.trim():"Not set"]].map(([icon,label,value]) => (
              <div key={label} className="card card-hover" style={{ padding: "18px 20px", borderRadius: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{icon} {label}</div>
                <div style={{ fontSize: 15, color: "#0F172A", fontWeight: 600 }}>{value}</div>
              </div>
            ))}
            {profile.bio && (
              <div className="card" style={{ padding: "18px 20px", borderRadius: 16, gridColumn: "1/-1" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>📝 Bio</div>
                <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.75 }}>{profile.bio}</div>
              </div>
            )}
          </div>
        )}

        {/* ── EDIT TAB ── */}
        {tab === "edit" && (
          <div className="card" style={{ padding: "30px", borderRadius: 22 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 18 }}>
              {[["first_name","First Name","text","First name"],["last_name","Last Name","text","Last name"],["email","Email","email","your@email.com"],["phone_number","Phone","tel","98XXXXXXXX"],["address","Address","text","City, District"]].map(([name,label,type,ph]) => (
                <div key={name}>
                  <FLabel>{label}</FLabel>
                  <input name={name} type={type} placeholder={ph} value={edit[name]}
                    onChange={e => setEdit({ ...edit, [e.target.name]: e.target.value })}
                    onFocus={() => setFocus(name)} onBlur={() => setFocus("")}
                    className={focusCls(name)} />
                </div>
              ))}
              <div style={{ gridColumn: "1/-1" }}>
                <FLabel>Bio</FLabel>
                <textarea name="bio" value={edit.bio} placeholder="Tell people about yourself…" rows={3}
                  onChange={e => setEdit({ ...edit, bio: e.target.value })}
                  onFocus={() => setFocus("bio")} onBlur={() => setFocus("")}
                  className={focusCls("bio")} style={{ resize: "vertical", fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
              </div>
            </div>

            {preview && (
              <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: accentLt, border: `1px solid ${accentBdr}`, borderRadius: 12 }}>
                <img src={preview} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: `2px solid ${accentBdr}` }} alt="" />
                <div>
                  <div style={{ fontSize: 13, color: "#0F172A", fontWeight: 600, marginBottom: 4 }}>New photo selected</div>
                  <button onClick={() => { setPreview(null); setFile(null); }} style={{ fontSize: 12, color: "#E11D48", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}>✕ Remove</button>
                </div>
              </div>
            )}

            <div style={{ marginTop: 26, display: "flex", gap: 12 }}>
              <button onClick={saveProfile} disabled={saving} className={btnCls} style={{ padding: "13px 32px", borderRadius: 12, fontSize: 15 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 1 }}>
                  {saving ? <><div className="spinner" />Saving…</> : "Save Changes →"}
                </span>
              </button>
              <button onClick={() => { setPreview(null); setFile(null); load(); setMsg(""); setError(""); }} className="btn btn-ghost" style={{ padding: "13px 22px", borderRadius: 12, fontSize: 15 }}>
                Reset
              </button>
            </div>
          </div>
        )}

        {/* ── PASSWORD TAB ── */}
        {tab === "password" && (
          <div className="card" style={{ padding: "30px", borderRadius: 22, maxWidth: 480 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {[["old_password","Current Password","Your current password"],["new_password","New Password","Min. 8 characters"],["confirm_password","Confirm Password","Re-enter new password"]].map(([name,label,ph]) => (
                <div key={name}>
                  <FLabel>{label}</FLabel>
                  <input name={name} type="password" placeholder={ph} value={pw[name]}
                    onChange={e => { setPw({ ...pw, [e.target.name]: e.target.value }); setError(""); }}
                    onFocus={() => setFocus(name)} onBlur={() => setFocus("")}
                    className={focusCls(name)} />
                </div>
              ))}

              {pw.new_password && (
                <div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
                    {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: str >= i ? strC : "#E2E8F0", transition: "background 0.3s" }} />)}
                  </div>
                  <span style={{ fontSize: 11, color: strC, fontWeight: 700 }}>{strLbl} password</span>
                </div>
              )}

              <button onClick={savePw} disabled={saving} className={btnCls} style={{ padding: "14px 32px", borderRadius: 12, fontSize: 15, marginTop: 4 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 1 }}>
                  {saving ? <><div className="spinner" />Updating…</> : "Update Password →"}
                </span>
              </button>
            </div>
          </div>
        )}

      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}