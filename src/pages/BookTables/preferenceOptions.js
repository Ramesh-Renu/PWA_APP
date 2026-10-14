// Cooking preferences a customer can add to a dish. Each group is one choice
// (or none); the choices become the order item's `notes` text for the kitchen.
// `note` is what the kitchen reads; every choice the customer makes is sent.
export const PREFERENCE_GROUPS = [
  {
    id: "spice",
    label: "Spice level",
    options: [
      { value: "none", label: "No spice", note: "No spice" },
      { value: "low", label: "Low", note: "Spice: Low" },
      { value: "medium", label: "Medium", note: "Spice: Medium" },
      { value: "high", label: "High", note: "Spice: High" },
    ],
  },
  {
    id: "msg",
    label: "Ajinomoto (MSG)",
    options: [
      { value: "yes", label: "Yes", note: "With Ajinomoto" },
      { value: "no", label: "No", note: "No Ajinomoto" },
    ],
  },
  {
    id: "deep_fry",
    label: "Deep fry",
    options: [
      { value: "yes", label: "Yes", note: "Deep fried" },
      { value: "no", label: "No", note: "Not deep fried" },
    ],
  },
  {
    id: "oil",
    label: "Oil",
    options: [
      { value: "regular", label: "Regular", note: "Regular oil" },
      { value: "less", label: "Less oil", note: "Less oil" },
    ],
  },
  {
    id: "salt",
    label: "Salt",
    options: [
      { value: "regular", label: "Regular", note: "Regular salt" },
      { value: "less", label: "Less salt", note: "Less salt" },
    ],
  },
  {
    id: "onion_garlic",
    label: "Onion & garlic",
    options: [
      { value: "yes", label: "Yes", note: "With onion & garlic" },
      { value: "no", label: "No (Jain)", note: "No onion & garlic" },
    ],
  },
  {
    id: "garnish",
    label: "Coriander / garnish",
    options: [
      { value: "yes", label: "Yes", note: "With garnish" },
      { value: "no", label: "No", note: "No garnish" },
    ],
  },
  {
    id: "sugar",
    label: "Sugar",
    hint: "Drinks & desserts",
    options: [
      { value: "regular", label: "Regular", note: "Regular sugar" },
      { value: "less", label: "Less", note: "Less sugar" },
      { value: "none", label: "No sugar", note: "No sugar" },
    ],
  },
  {
    id: "ice",
    label: "Ice",
    hint: "Drinks",
    options: [
      { value: "yes", label: "With ice", note: "With ice" },
      { value: "no", label: "No ice", note: "No ice" },
    ],
  },
];

export const NOTE_MAX_LENGTH = 150;

/** { spice: "high", msg: "no", text: "extra lemon" } → "Spice: High · No Ajinomoto · Note: extra lemon" */
export const preferencesToNote = (prefs = {}) => {
  const parts = PREFERENCE_GROUPS.map(
    (group) => group.options.find((option) => option.value === prefs[group.id])?.note,
  ).filter(Boolean);
  const text = String(prefs.text || "").trim();
  if (text) parts.push(`Note: ${text}`);
  return parts.join(" · ");
};

/**
 * Reverse of preferencesToNote, for editing a saved note:
 * "Spice: High · No Ajinomoto · Note: extra lemon" → { spice: "high", msg: "no", text: "extra lemon" }.
 * Parts that match no option (older or hand-written notes) go to `text`.
 */
export const noteToPreferences = (note) => {
  const prefs = {};
  const extra = [];
  String(note || "")
    .split(" · ")
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      if (part.startsWith("Note: ")) {
        extra.push(part.slice(6));
        return;
      }
      const group = PREFERENCE_GROUPS.find((item) =>
        item.options.some((option) => option.note === part),
      );
      if (group && !prefs[group.id]) {
        prefs[group.id] = group.options.find((option) => option.note === part).value;
      } else {
        extra.push(part);
      }
    });
  if (extra.length) prefs.text = extra.join(", ").slice(0, NOTE_MAX_LENGTH);
  return prefs;
};

/** True when the customer chose anything (or wrote a note). */
export const hasPreferences = (prefs) => Boolean(preferencesToNote(prefs));
