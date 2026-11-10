import assert from "node:assert/strict";
import { getLoyaltySummary } from "./loyalty.js";

const summary = getLoyaltySummary(9, 3);
assert.equal(summary.tier, "Gold");
assert.equal(summary.points, 975);
assert.equal(summary.nextTier, "Platinum");
assert.equal(summary.nextTarget, 12);
console.log(JSON.stringify(summary));
