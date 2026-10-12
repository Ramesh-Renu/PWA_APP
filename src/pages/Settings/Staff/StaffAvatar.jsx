export const initialsOf = (name = "") =>
  String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

/** Round photo, or initials when the person has no photo. */
const StaffAvatar = ({ name, photo, size = 48, tone = "cook" }) => (
  <span
    className={`cook-avatar cook-avatar--${tone}`}
    style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
    aria-hidden
  >
    {photo ? <img src={photo} alt="" loading="lazy" /> : initialsOf(name) || "?"}
  </span>
);

export default StaffAvatar;
