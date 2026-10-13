/**
 * Two letters for every name: first letters of the first two words
 * ("Priya Devi" → "PD"), or the first two letters of a one-word name
 * ("Arun" → "AR").
 */
export const initialsOf = (name = "") => {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  const letters =
    words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2);
  return letters.toUpperCase();
};

// Distinct, readable (white text) colours; each person always gets the same one.
const AVATAR_COLORS = [
  ["#6366f1", "#4338ca"], // indigo
  ["#0ea5e9", "#0369a1"], // sky
  ["#14b8a6", "#0f766e"], // teal
  ["#22c55e", "#15803d"], // green
  ["#f59e0b", "#b45309"], // amber
  ["#f97316", "#c2410c"], // orange
  ["#ef4444", "#b91c1c"], // red
  ["#ec4899", "#be185d"], // pink
  ["#a855f7", "#7e22ce"], // purple
  ["#64748b", "#334155"], // slate
  ["#84cc16", "#4d7c0f"], // lime
  ["#06b6d4", "#0e7490"], // cyan
];

export const avatarColorOf = (name = "") => {
  const key = String(name).trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  const [from, to] = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
};

/** Round photo, or two-letter initials on the person's own colour. */
const StaffAvatar = ({ name, photo, size = 48, tone = "cook" }) => (
  <span
    className={`cook-avatar cook-avatar--${tone}`}
    style={{
      width: size,
      height: size,
      // Two letters need a little less room than one.
      fontSize: Math.round(size * 0.36),
      ...(photo ? {} : { background: avatarColorOf(name) }),
    }}
    aria-hidden
  >
    {photo ? <img src={photo} alt="" loading="lazy" /> : initialsOf(name) || "?"}
  </span>
);

export default StaffAvatar;
