// ── Skeleton loading components for NepalKarigar ─────────────────────────────

const pulse = `
  @keyframes skPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
  }
  .sk { animation: skPulse 1.5s ease-in-out infinite; background: #E5E7EB; border-radius: 6px; }
`;

function Sk({ w = "100%", h = 16, r = 6, style = {} }) {
  return (
    <div className="sk" style={{ width: w, height: h, borderRadius: r, flexShrink: 0, ...style }} />
  );
}

/** Skeleton for a karigar search card */
export function KarigarCardSkeleton() {
  return (
    <div style={{ background: "#fff", border: "1.5px solid #F3F4F6", borderRadius: 12, padding: 18 }}>
      <style>{pulse}</style>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Sk w={48} h={48} r={24} />
        <div style={{ flex: 1 }}>
          <Sk w="60%" h={15} style={{ marginBottom: 8 }} />
          <Sk w="40%" h={12} />
        </div>
        <Sk w={60} h={14} r={8} />
      </div>
      <Sk w="90%" h={12} style={{ marginBottom: 6 }} />
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        <Sk w={70} h={22} r={20} />
        <Sk w={90} h={22} r={20} />
        <Sk w={60} h={22} r={20} />
      </div>
    </div>
  );
}

/** Skeleton for a booking card */
export function BookingCardSkeleton() {
  return (
    <div style={{ background: "#fff", border: "1.5px solid #F3F4F6", borderRadius: 12, padding: "16px 18px" }}>
      <style>{pulse}</style>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Sk w={42} h={42} r={21} />
        <div style={{ flex: 1 }}>
          <Sk w="50%" h={15} style={{ marginBottom: 8 }} />
          <Sk w="70%" h={11} />
        </div>
        <Sk w={80} h={24} r={20} />
      </div>
    </div>
  );
}

/** Skeleton for a karigar profile hero */
export function ProfileHeroSkeleton() {
  return (
    <div className="card" style={{ padding: 24, marginBottom: 16 }}>
      <style>{pulse}</style>
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <Sk w={88} h={88} r={44} />
        <div style={{ flex: 1 }}>
          <Sk w="55%" h={22} style={{ marginBottom: 10 }} />
          <Sk w="30%" h={13} style={{ marginBottom: 12 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <Sk w={80} h={22} r={20} />
            <Sk w={70} h={22} r={20} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Generic page spinner — use only when skeleton not suitable */
export function PageSpinner() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #E5E7EB", borderTopColor: "#2563EB", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/** Empty state with icon, title, message, optional CTA */
export function EmptyState({ emoji, icon, title, message, action, onAction }) {
  return (
    <div style={{ textAlign: "center", padding: "56px 20px" }}>
      <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}>
        {icon || (emoji ? <span style={{ fontSize: 48, lineHeight: 1 }}>{emoji}</span> : <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-p)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>)}
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 6 }}>{title}</h3>
      {message && <p style={{ fontSize: 13, color: "#6B7280", marginBottom: action ? 18 : 0, lineHeight: 1.6 }}>{message}</p>}
      {action && (
        <button onClick={onAction}
          style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          {action}
        </button>
      )}
    </div>
  );
}