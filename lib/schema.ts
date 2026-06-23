import { z } from "zod";

/**
 * Core data contracts for DriveWise. Everything the TCO engine and the four
 * decision views consume is defined here, validated with Zod so that external
 * API responses and user input are checked at the boundary.
 *
 * See docs/SPEC.md §1 for the conceptual model.
 */

// --- Geography -------------------------------------------------------------

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
] as const;

export const UsStateSchema = z.enum(US_STATES);
export type UsState = z.infer<typeof UsStateSchema>;

// --- Driving profile -------------------------------------------------------

/** "HH:MM" 24-hour local time, used for rideshare surge modeling. */
export const TimeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected HH:MM 24-hour time");
export type TimeOfDay = z.infer<typeof TimeOfDaySchema>;

export const RouteSchema = z.object({
  label: z.string().min(1),
  oneWayMiles: z.number().positive(),
  tripsPerDay: z.number().int().positive(),
  daysPerWeek: z.number().int().min(1).max(7),
  typicalDepartTime: TimeOfDaySchema,
  typicalReturnTime: TimeOfDaySchema,
});
export type Route = z.infer<typeof RouteSchema>;

export const DrivingProfileSchema = z.object({
  state: UsStateSchema,
  /** false for this household — drives public-charging assumptions for EVs. */
  homeCharging: z.boolean().default(false),
  annualMiles: z.number().positive(),
  /** How long you plan to keep the car — the single biggest TCO lever. */
  ownershipYears: z.number().positive().max(30),
  routes: z.array(RouteSchema).default([]),
  parkingMonthly: z.number().min(0).optional(),
  tollsMonthly: z.number().min(0).optional(),
});
export type DrivingProfile = z.infer<typeof DrivingProfileSchema>;

// --- Vehicles --------------------------------------------------------------

export const PowertrainSchema = z.enum(["gas", "hybrid", "phev", "ev"]);
export type Powertrain = z.infer<typeof PowertrainSchema>;

export const BodyStyleSchema = z.enum([
  "subcompact",
  "compact",
  "midsize",
  "subcompact_suv",
  "compact_suv",
  "midsize_suv",
]);
export type BodyStyle = z.infer<typeof BodyStyleSchema>;

export const VehicleSchema = z.object({
  id: z.string(),
  make: z.string(),
  model: z.string(),
  year: z.number().int(),
  powertrain: PowertrainSchema,
  bodyStyle: BodyStyleSchema,
  msrp: z.number().positive(),
  /** EPA combined MPG (gas/hybrid) — undefined for pure EVs. */
  combinedMpg: z.number().positive().optional(),
  /** EPA kWh per 100 miles (ev/phev) — undefined for pure gas. */
  kwhPer100mi: z.number().positive().optional(),
  /** Fraction of MSRP retained after `ownershipYears` (segment default). */
  resaleRatio5yr: z.number().min(0).max(1).optional(),
});
export type Vehicle = z.infer<typeof VehicleSchema>;

// --- TCO result ------------------------------------------------------------

/**
 * Additive ledger: every field is a positive cost in dollars and they sum to
 * `total`. Resale is NOT a separate line — it's already netted out of
 * `depreciation` (= purchase price − resale value) to avoid double counting.
 */
export const TcoBreakdownSchema = z.object({
  depreciation: z.number(),
  financingInterest: z.number(),
  energy: z.number(),
  insurance: z.number(),
  maintenance: z.number(),
  /** Sales tax + registration + title fees. */
  fees: z.number(),
  parking: z.number(),
  tolls: z.number(),
  /** Opportunity cost of capital tied up (down payment / cash). */
  opportunityCost: z.number(),
});
export type TcoBreakdown = z.infer<typeof TcoBreakdownSchema>;

export const TcoResultSchema = z.object({
  vehicleId: z.string(),
  horizonYears: z.number(),
  total: z.number(),
  perMonth: z.number(),
  perMile: z.number(),
  breakdown: TcoBreakdownSchema,
  /** Estimated resale value at end of horizon (informational, not a cost). */
  resaleValue: z.number(),
  /** Year-by-year cumulative net cost, for break-even charts. */
  cumulativeByYear: z.array(z.number()),
});
export type TcoResult = z.infer<typeof TcoResultSchema>;
