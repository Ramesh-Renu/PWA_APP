const PROMOTION_STORAGE_KEY = "hotel_guest_redemptions";

export const PROMOTION_LIBRARY = [
  {
    id: "welcome-15",
    code: "WELCOME15",
    label: "15% off your next booking",
    threshold: 0,
    value: 15,
    type: "percent",
  },
  {
    id: "gold-table",
    code: "GOLDTABLE",
    label: "Priority table preference",
    threshold: 6,
    value: 0,
    type: "perk",
  },
  {
    id: "vip-early",
    code: "VIPEARLY",
    label: "Early check-in perk",
    threshold: 12,
    value: 0,
    type: "perk",
  },
];

export const getRedeemedPromotionIds = () => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(PROMOTION_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
  } catch {
    return [];
  }
};

export const redeemPromotion = (promoId) => {
  if (!promoId) return [];

  const current = new Set(getRedeemedPromotionIds());
  current.add(String(promoId));

  const next = [...current];
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PROMOTION_STORAGE_KEY, JSON.stringify(next));
  }

  return next;
};

export const isPromotionRedeemed = (promoId) =>
  getRedeemedPromotionIds().includes(String(promoId));

export const getPromotionsForGuest = (bookingCount = 0, savedPlaces = 0, redeemedIds = getRedeemedPromotionIds()) => {
  const bookings = Math.max(0, Number(bookingCount) || 0);
  const saved = Math.max(0, Number(savedPlaces) || 0);
  const redeemed = new Set((redeemedIds || []).map(String));

  return PROMOTION_LIBRARY.map((promo) => {
    const unlocked = bookings >= promo.threshold || saved >= Math.max(1, promo.threshold / 2);
    const redeemedCurrent = redeemed.has(String(promo.id));

    return {
      ...promo,
      unlocked,
      redeemed: redeemedCurrent,
      ready: unlocked && !redeemedCurrent,
    };
  });
};

export const getActivePromotion = (bookingCount = 0, savedPlaces = 0, redeemedIds = getRedeemedPromotionIds()) => {
  const offers = getPromotionsForGuest(bookingCount, savedPlaces, redeemedIds);
  return offers.find((offer) => offer.ready) || null;
};
