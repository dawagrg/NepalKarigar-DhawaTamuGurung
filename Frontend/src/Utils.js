// ── Shared utilities for NepalKarigar ────────────────────────────────────────

export const MEDIA_BASE = "http://127.0.0.1:8000";

/** Build absolute media URL from whatever the API returns */
export const imgUrl = r =>
  !r ? null : r.startsWith("http") ? r : `${MEDIA_BASE}${r.startsWith("/") ? r : "/media/" + r}`;

/** Format a number as NPR currency — NPR 1,500/hr */
export const formatNPR = (val, suffix = "") => {
  if (!val && val !== 0) return "—";
  const n = parseFloat(val);
  if (isNaN(n)) return "—";
  return `NPR ${n.toLocaleString("en-NP", { maximumFractionDigits: 0 })}${suffix}`;
};

/** Relative time — "2 hours ago", "just now" */
export const timeAgo = (isoString) => {
  if (!isoString) return "";
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60)       return "just now";
  if (diff < 3600)     return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)    return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800)   return `${Math.floor(diff / 86400)}d ago`;
  return new Date(isoString).toLocaleDateString("en-NP");
};

/** Debounce a function */
export const debounce = (fn, ms = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

/** Validate Nepal phone number: 98/97/96XXXXXXXX */
export const isValidNepalPhone = (phone) =>
  /^(97|98|96)\d{8}$/.test(phone.replace(/\s/g, ""));

/** Password strength: returns 0-4 */
export const passwordStrength = (pw) => {
  if (!pw || pw.length === 0) return 0;
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
};

export const PW_STRENGTH_COLOR = ["", "#DC2626", "#D97706", "#16A34A", "#2563EB"];
export const PW_STRENGTH_LABEL = ["", "Weak", "Fair", "Good", "Strong"];