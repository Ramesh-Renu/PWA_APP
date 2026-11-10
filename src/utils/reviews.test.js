import { getHotelReviews, getAverageRating, saveHotelReview } from "./reviews";

describe("guest hotel reviews", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores a guest rating and calculates the average for a hotel", () => {
    const hotelId = "hotel-42";

    saveHotelReview(hotelId, { rating: 5, comment: "Great service" });
    saveHotelReview(hotelId, { rating: 3, comment: "Fine visit" });

    const reviews = getHotelReviews(hotelId);
    expect(reviews).toHaveLength(2);
    expect(getAverageRating(hotelId)).toBe(4);
    expect(reviews[0].comment).toBe("Great service");
  });
});
