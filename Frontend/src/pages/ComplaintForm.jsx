import { useState, useEffect } from "react";
import { submitComplaint, checkComplaintStatus } from "../services/api";
import { IAlertCirc, IAlertTri, ICheckCirc, IClose, ICamera, IFileText } from "../components/Icons";

const CATEGORIES = [
  { value: "poor_work",    label: "Poor Quality Work"     },
  { value: "misbehaviour", label: "Misbehaviour / Rude"   },
  { value: "fraud",        label: "Fraud / Scam"          },
  { value: "no_show",      label: "Did Not Show Up"       },
  { value: "overcharging", label: "Overcharging"          },
  { value: "damage",       label: "Property Damage"       },
  { value: "late_payment", label: "Late / No Payment"     },
  { value: "harassment",   label: "Harassment"            },
  { value: "other",        label: "Other"                 },
];

const STATUS_STYLE = {
  pending:   { color:"#D97706", bg:"#FFFBEB", label:"Pending Review"  },
  reviewing: { color:"#2563EB", bg:"#EFF6FF", label:"Under Review"    },
  resolved:  { color:"#16A34A", bg:"#F0FDF4", label:"Resolved"        },
  dismissed: { color:"#6B7280", bg:"#F9FAFB", label:"Dismissed"       },
};

export default function ComplaintForm({ booking, accusedUser, accusedRole, onClose }) {
  const [step,        setStep]     = useState("check"); // check|form|done|existing
  const [existing,    setExisting] = useState(null);
  const [category,    setCategory] = useState("");
  const [title,       setTitle]    = useState("");
  const [description, setDesc]     = useState("");
  const [evidence,    setEvidence] = useState(null);
  const [saving,      setSaving]   = useState(false);
  const [err,         setErr]      = useState("");

  // Check if user already filed a complaint for this booking
  useEffect(() => {
    checkComplaintStatus({
      accused_id: accusedUser?.id,
      booking_id: booking?.id,
    }).then(r => {
      if (r.data.has_complaint) {
        setExisting(r.data);
        setStep("existing");
      } else {
        setStep("form");
      }
    }).catch(() => setStep("form"));
  }, []);

  const submit = async () => {
    setErr("");
    if (!category)              { setErr("Please select a complaint category."); return; }
    if (!title.trim())          { setErr("Please enter a complaint title."); return; }
    if (description.trim().length < 10) { setErr("Please provide a detailed description (min 10 characters)."); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("accused_id",  accusedUser.id);
      fd.append("category",    category);
      fd.append("title",       title.trim());
      fd.append("description", description.trim());
      if (booking?.id) fd.append("booking_id", booking.id);
      if (evidence)    fd.append("evidence", evidence);

      await submitComplaint(fd);
      setStep("done");
    } catch(e) {
      const d = e.response?.data;
      setErr(d?.error || d?.detail || "Failed to submit complaint. Please try again.");
    } finally { setSaving(false); }
  };

  const INP = {
    width:"100%", padding:"10px 12px", borderRadius:8,
    border:"1.5px solid var(--border)", fontSize:13,
    background:"#fff", color:"var(--text-h)",
    outline:"none", boxSizing:"border-box",
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1000,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"white", borderRadius:14, maxWidth:520, width:"100%",
        boxShadow:"0 20px 60px rgba(0,0,0,0.25)", maxHeight:"90vh", overflowY:"auto" }}>

        {/* Header */}
        <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid #F3F4F6",
          display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, background:"white", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"#FEF2F2",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <IAlertTri size={18} color="#DC2626"/>
            </div>
            <div>
              <h2 style={{ fontSize:16, fontWeight:800, color:"#111827", margin:0 }}>
                File a Complaint
              </h2>
              <p style={{ fontSize:11, color:"var(--text-p)", margin:0 }}>
                Against: <strong>{accusedUser?.full_name || accusedUser?.username}</strong>
                {" "}({accusedRole})
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
            <IClose size={18} color="var(--text-p)"/>
          </button>
        </div>

        <div style={{ padding:"20px 24px" }}>

          {/* Loading */}
          {step === "check" && (
            <div style={{ textAlign:"center", padding:"32px 0", color:"var(--text-p)", fontSize:13 }}>
              Checking…
            </div>
          )}

          {/* Already complained */}
          {step === "existing" && existing && (
            <div>
              <div style={{ background:"#FFFBEB", border:"1.5px solid #FDE68A", borderRadius:10,
                padding:"14px 16px", marginBottom:16 }}>
                <p style={{ fontSize:13, fontWeight:700, color:"#92400E", marginBottom:4 }}>
                  You already filed a complaint about this booking.
                </p>
                <p style={{ fontSize:12, color:"#92400E" }}>
                  Complaint ID: #{existing.complaint_id}
                </p>
              </div>

              {/* Status */}
              {(() => {
                const s = STATUS_STYLE[existing.status] || STATUS_STYLE.pending;
                return (
                  <div style={{ background:s.bg, border:`1.5px solid ${s.color}33`,
                    borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                      <span style={{ padding:"2px 10px", borderRadius:20, fontSize:12,
                        fontWeight:700, background:s.color, color:"white" }}>
                        {s.label}
                      </span>
                    </div>
                    {existing.admin_response ? (
                      <>
                        <p style={{ fontSize:12, fontWeight:700, color:"var(--text-p)",
                          textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>
                          Admin Response:
                        </p>
                        <p style={{ fontSize:13, color:"var(--text-b)", lineHeight:1.6 }}>
                          {existing.admin_response}
                        </p>
                        {existing.action_taken && (
                          <div style={{ marginTop:8, padding:"6px 10px", background:"white",
                            borderRadius:7, fontSize:12, fontWeight:600, color:"var(--text-h)",
                            display:"inline-block" }}>
                            Action Taken: {existing.action_taken}
                          </div>
                        )}
                      </>
                    ) : (
                      <p style={{ fontSize:13, color:"var(--text-s)" }}>
                        Your complaint is being reviewed. You will receive an SMS update.
                      </p>
                    )}
                  </div>
                );
              })()}
              <button onClick={onClose} className="btn btn-outline btn-sm btn-full">Close</button>
            </div>
          )}

          {/* Complaint form */}
          {step === "form" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {/* Info banner */}
              <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:9,
                padding:"10px 14px", fontSize:12, color:"#1D4ED8", lineHeight:1.6 }}>
                Your complaint will be reviewed by the admin team. Provide accurate and honest
                information. False complaints may result in action against your account.
              </div>

              {err && (
                <div style={{ display:"flex", gap:8, padding:"10px 13px", background:"#FEF2F2",
                  border:"1.5px solid #FECACA", borderRadius:9, fontSize:13, color:"#DC2626" }}>
                  <IAlertCirc size={14} style={{ flexShrink:0, marginTop:1 }}/>
                  <span>{err}</span>
                </div>
              )}

              {/* Category */}
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"var(--text-p)",
                  display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                  Complaint Type <span style={{ color:"#DC2626" }}>*</span>
                </label>
                <select value={category} onChange={e=>{setCategory(e.target.value);setErr("");}}
                  style={{ ...INP, cursor:"pointer" }}>
                  <option value="">— Select complaint type —</option>
                  {CATEGORIES.map(c=>(
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"var(--text-p)",
                  display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                  Complaint Title <span style={{ color:"#DC2626" }}>*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e=>{setTitle(e.target.value);setErr("");}}
                  placeholder="Brief summary of the complaint"
                  style={INP}
                  onFocus={e=>e.target.style.borderColor="var(--primary)"}
                  onBlur={e=>e.target.style.borderColor="var(--border)"}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"var(--text-p)",
                  display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                  Detailed Description <span style={{ color:"#DC2626" }}>*</span>
                </label>
                <textarea
                  value={description}
                  onChange={e=>{setDesc(e.target.value);setErr("");}}
                  rows={4}
                  placeholder="Describe what happened in detail. Include dates, amounts, and specific incidents..."
                  style={{ ...INP, resize:"vertical", fontFamily:"inherit" }}
                  onFocus={e=>e.target.style.borderColor="var(--primary)"}
                  onBlur={e=>e.target.style.borderColor="var(--border)"}
                />
                <p style={{ fontSize:11, color:description.length < 10 && description.length > 0 ? "#DC2626" : "var(--text-p)",
                  marginTop:3 }}>
                  {description.length}/500 characters {description.length < 10 && description.length > 0 && "— minimum 10 required"}
                </p>
              </div>

              {/* Evidence upload */}
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"var(--text-p)",
                  display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                  Evidence Photo (Optional)
                </label>
                <div style={{ border:"2px dashed var(--border)", borderRadius:9, padding:"16px",
                  textAlign:"center", cursor:"pointer", background:"var(--bg-subtle)" }}
                  onClick={() => document.getElementById("complaint-evidence").click()}>
                  <input id="complaint-evidence" type="file" accept="image/*"
                    style={{ display:"none" }}
                    onChange={e=>setEvidence(e.target.files[0]||null)}/>
                  {evidence ? (
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                      <ICheckCirc size={16} color="#16A34A"/>
                      <span style={{ fontSize:13, color:"#16A34A", fontWeight:600 }}>{evidence.name}</span>
                      <button onClick={e=>{e.stopPropagation();setEvidence(null);}}
                        style={{ background:"none", border:"none", cursor:"pointer", color:"#DC2626", fontSize:12, fontWeight:600 }}>
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <ICamera size={24} color="var(--text-p)"/>
                      <p style={{ fontSize:12, color:"var(--text-p)", marginTop:6 }}>
                        Click to upload screenshot or photo evidence
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking reference */}
              {booking && (
                <div style={{ background:"var(--bg-subtle)", borderRadius:8, padding:"10px 14px",
                  fontSize:12, color:"var(--text-s)", display:"flex", alignItems:"center", gap:6 }}>
                  <IFileText size={13} color="var(--text-p)"/>
                  Linked to booking #{booking.id} — {booking.date}
                </div>
              )}

              {/* Actions */}
              <div style={{ display:"flex", gap:10, marginTop:4 }}>
                <button onClick={onClose}
                  style={{ flex:1, padding:"11px", borderRadius:9,
                    border:"1.5px solid var(--border)", background:"#fff",
                    fontWeight:700, fontSize:13, cursor:"pointer", color:"var(--text-s)" }}>
                  Cancel
                </button>
                <button onClick={submit} disabled={saving}
                  style={{ flex:2, padding:"11px", borderRadius:9, border:"none",
                    background: saving ? "#9CA3AF" : "#DC2626",
                    color:"white", fontWeight:700, fontSize:13,
                    cursor: saving ? "not-allowed" : "pointer",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <IAlertTri size={14} color="white"/>
                  {saving ? "Submitting…" : "Submit Complaint"}
                </button>
              </div>
            </div>
          )}

          {/* Success */}
          {step === "done" && (
            <div style={{ textAlign:"center", padding:"20px 0" }}>
              <div style={{ width:64, height:64, borderRadius:"50%", background:"#F0FDF4",
                border:"2px solid #BBF7D0", display:"flex", alignItems:"center",
                justifyContent:"center", margin:"0 auto 16px" }}>
                <ICheckCirc size={32} color="#16A34A"/>
              </div>
              <h3 style={{ fontSize:17, fontWeight:800, color:"#111827", marginBottom:8 }}>
                Complaint Submitted
              </h3>
              <p style={{ fontSize:13, color:"var(--text-s)", lineHeight:1.75, marginBottom:20 }}>
                Your complaint has been received by the admin team.<br/>
                You will receive an <strong>SMS notification</strong> once reviewed.
              </p>
              <div style={{ background:"#EFF6FF", borderRadius:9, padding:"12px 16px",
                fontSize:12, color:"#1D4ED8", lineHeight:1.6, marginBottom:20, textAlign:"left" }}>
                <strong>What happens next:</strong><br/>
                1. Admin reviews your complaint within 1-2 business days<br/>
                2. Appropriate action is taken against the responsible party<br/>
                3. You receive an SMS with the admin's decision
              </div>
              <button onClick={onClose} className="btn btn-primary btn-sm btn-full">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}