import type { UsState } from "@/lib/schema";
import { ANNUAL_REGISTRATION, vehicleSalesTaxRate } from "./defaults";

/**
 * Upfront sales/use tax on the purchase. Not applied to leases the same way
 * (lessees are typically taxed on monthly payments), so the engine only calls
 * this for purchase modes.
 */
export function salesTax(price: number, state: UsState): number {
  return price * vehicleSalesTaxRate(state);
}

/** Registration + title/plate fees over the ownership horizon. */
export function registrationFees(years: number): number {
  return ANNUAL_REGISTRATION * years;
}
