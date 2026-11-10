const FAVORITES_KEY = "table-booking-favorites";

export const getFavoriteHotels = () => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
};

export const isFavoriteHotel = (hotelId) =>
  getFavoriteHotels().includes(String(hotelId));

export const toggleFavoriteHotel = (hotelId) => {
  const key = String(hotelId);
  const current = getFavoriteHotels();
  const next = current.includes(key)
    ? current.filter((item) => item !== key)
    : [...current, key];

  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return next.includes(key);
};

export const getFavoriteHotelsFor = (hotels = []) => {
  const favoriteIds = new Set(getFavoriteHotels());
  return hotels.filter((hotel) => favoriteIds.has(String(hotel.id)));
};
