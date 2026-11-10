const STORAGE_KEY = "table-booking-hotel-reviews";

const readReviews = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeReviews = (reviews) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
};

const normalizeRating = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(5, Math.max(1, Math.round(parsed)));
};

export const getAllHotelReviews = () => readReviews();

export const getHotelReviews = (hotelId) => {
  const key = String(hotelId ?? "");
  if (!key) return [];

  return readReviews()
    .filter((review) => String(review.hotelId) === key)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const saveHotelReview = (hotelId, review = {}) => {
  const key = String(hotelId ?? "");
  if (!key) return null;

  const rating = normalizeRating(review.rating);
  if (!rating) return null;

  const item = {
    id: `${key}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    hotelId: key,
    rating,
    comment: String(review.comment || "").trim(),
    guestName: String(review.guestName || "Guest").trim() || "Guest",
    createdAt: new Date().toISOString(),
  };

  const nextReviews = [...readReviews(), item];

  writeReviews(nextReviews);
  return item;
};

export const getAverageRating = (hotelId) => {
  const reviews = getHotelReviews(hotelId);
  if (!reviews.length) return 0;

  return Number(
    (reviews.reduce((total, review) => total + Number(review.rating || 0), 0) /
      reviews.length).toFixed(1),
  );
};

export const getRatingSummary = (hotelId) => {
  const reviews = getHotelReviews(hotelId);
  return {
    count: reviews.length,
    average: getAverageRating(hotelId),
    latest: reviews[0] || null,
  };
};
