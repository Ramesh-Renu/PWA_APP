export const LOYALTY_TIERS = [
  { tier: "New", min: 0, pointsPerVisit: 0, perks: "Try your first reservation" },
  { tier: "Silver", min: 3, pointsPerVisit: 50, perks: "Priority waitlist" },
  { tier: "Gold", min: 6, pointsPerVisit: 100, perks: "Free table preference" },
  { tier: "Platinum", min: 12, pointsPerVisit: 150, perks: "VIP dining perks" },
];

export const getLoyaltySummary = (bookingCount = 0, savedPlaces = 0) => {
  const validBookings = Math.max(0, Number(bookingCount) || 0);
  const validSavedPlaces = Math.max(0, Number(savedPlaces) || 0);
  const points = validBookings * 100 + validSavedPlaces * 25;

  let tier = "New";
  let nextTier = null;
  let nextTarget = null;

  for (const item of LOYALTY_TIERS) {
    if (validBookings >= item.min) {
      tier = item.tier;
    } else if (!nextTier) {
      nextTier = item.tier;
      nextTarget = item.min;
    }
  }

  if (tier === "Platinum") {
    nextTier = null;
    nextTarget = null;
  }

  const activeTier = LOYALTY_TIERS.find((item) => item.tier === tier) || LOYALTY_TIERS[0];

  return {
    tier,
    points,
    perks: activeTier.perks,
    nextTier,
    nextTarget,
    bookings: validBookings,
    savedPlaces: validSavedPlaces,
  };
};
