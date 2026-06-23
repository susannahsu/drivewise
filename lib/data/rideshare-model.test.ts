import { describe, it, expect } from "vitest";
import {
  DEFAULT_FARE_MODEL,
  estimateTripFare,
  monthlyRideshareCost,
  timeSurgeMultiplier,
} from "./rideshare-model";

describe("timeSurgeMultiplier", () => {
  it("surges during morning and evening rush", () => {
    expect(timeSurgeMultiplier("08:00")).toBeGreaterThan(1);
    expect(timeSurgeMultiplier("17:30")).toBeGreaterThan(1);
  });
  it("is flat off-peak midday", () => {
    expect(timeSurgeMultiplier("13:00")).toBe(1);
  });
});

describe("estimateTripFare", () => {
  it("rises with distance", () => {
    expect(estimateTripFare(10, 1)).toBeGreaterThan(estimateTripFare(3, 1));
  });
  it("never falls below the min fare plus booking fee", () => {
    const floor = DEFAULT_FARE_MODEL.minFare + DEFAULT_FARE_MODEL.bookingFee;
    expect(estimateTripFare(0.5, 1)).toBeGreaterThanOrEqual(floor);
  });
  it("surge scales the ride portion up", () => {
    expect(estimateTripFare(10, 1.7)).toBeGreaterThan(estimateTripFare(10, 1));
  });
});

describe("monthlyRideshareCost", () => {
  it("scales with commuting days per week", () => {
    const route = {
      oneWayMiles: 8,
      daysPerWeek: 5,
      departTime: "08:00",
      returnTime: "17:30",
    };
    const fewer = { ...route, daysPerWeek: 2 };
    expect(monthlyRideshareCost(route)).toBeGreaterThan(
      monthlyRideshareCost(fewer),
    );
  });
});
