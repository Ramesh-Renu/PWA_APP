import assert from "node:assert/strict";
import { getActivePromotion, getPromotionsForGuest } from "./promotions.js";

const offers = getPromotionsForGuest(7, 2);
assert.equal(offers[0].code, "WELCOME15");
assert.equal(offers[0].ready, true);
assert.equal(getActivePromotion(7, 2).code, "WELCOME15");
console.log("promotions ok");
