/**
 * Business Rates Calculator Configuration — 2026/27
 * Update this file each financial year.
 * Sources:
 *   - GOV.UK Multiplier Notification: https://www.gov.uk/government/publications/22026-notification-of-non-domestic-rating-multipliers-for-202627
 *   - GOV.UK SBRR: https://www.gov.uk/business-rates-relief/small-business-rate-relief
 *   - GOV.UK Transitional Relief: https://www.gov.uk/business-rates-relief/transitional-relief
 *   - GOV.UK SSB Relief: https://www.gov.uk/business-rates-relief/supporting-small-business-relief
 *   - GOV.UK RHL Guidance: https://www.gov.uk/guidance/business-rates-multipliers-qualifying-retail-hospitality-or-leisure
 */

const RATES_CONFIG = {
  financialYear: "2026/27",

  // ── 2025/26 MULTIPLIERS (old two-tier system, for calculating previous bill from old RV) ──
  previousYear: {
    financialYear: "2025/26",
    smallBusinessMultiplier: 0.499,
    standardMultiplier: 0.555,
    smallBusinessCeiling: 51000,
  },

  // ── 2026/27 MULTIPLIERS (pence per £1 of RV) — new five-tier system ──
  multipliers: {
    smallBusinessRHL:    0.382,
    standardRHL:         0.430,
    smallBusinessNonRHL: 0.432,
    standardNonRHL:      0.480,
    large:               0.508,
  },

  thresholds: {
    smallBusinessCeiling: 51000,
    largePropertyFloor:   500000,
  },

  // ── SMALL BUSINESS RATE RELIEF (SBRR) ──
  sbrr: {
    fullReliefCeiling:    12000,
    partialReliefCeiling: 15000,
  },

  // ── PUBS & LIVE MUSIC VENUES RELIEF (2026/27 only) ──
  pubsRelief: {
    percentage: 0.15,
  },

  // ── TRANSITIONAL RELIEF — Upward Caps (Year 1: 2026/27) ──
  transitionalRelief: {
    year1: {
      small:  { cap: 0.05, rvCeiling: 20000, rvCeilingLondon: 28000 },
      medium: { cap: 0.15, rvCeiling: 100000 },
      large:  { cap: 0.30 },
    },
  },

  // ── SUPPORTING SMALL BUSINESS (SSB) RELIEF ──
  ssb: {
    annualCap: 800,
  },

  // ── TRANSITIONAL RELIEF SUPPLEMENT ──
  transitionalSupplement: {
    pencePerPound: 0.01,
  },

  // ── EMPTY PROPERTY RELIEF ──
  emptyProperty: {
    standardExemptMonths: 3,
    industrialExemptMonths: 6,
    permanentExemptRVCeiling: 2900,
  },

  // ── VACATAD FEE TIERS ──
  vacatadFees: [
    { rvCeiling: 5000,     feePercent: 25 },
    { rvCeiling: 10000,    feePercent: 20 },
    { rvCeiling: 25000,    feePercent: 17.5 },
    { rvCeiling: 50000,    feePercent: 15 },
    { rvCeiling: 100000,   feePercent: 12.5 },
    { rvCeiling: Infinity, feePercent: 10 },
  ],
};
