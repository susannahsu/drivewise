import { monthlyLoanPayment, totalLoanInterest } from "@/lib/tco/financing";

/**
 * "Rate my deal" — judge an actual dealer offer against the market, so the tool
 * is useful at the moment of decision (in the showroom), not just in research.
 *
 * Two levers a dealer controls independently:
 *   1. the negotiated vehicle price vs MSRP, and
 *   2. the financing APR vs the going rate (dealers mark up the bank's buy rate).
 * We grade each, then roll them into one verdict.
 */

export interface DealInput {
  /** Sticker / MSRP of the vehicle. */
  msrp: number;
  /** Negotiated vehicle price (before tax, title, fees). */
  quotedPrice: number;
  /** APR the dealer is offering, as a decimal (e.g. 0.069). */
  offeredApr: number;
  /** Current going auto-loan APR (live FRED), as a decimal. */
  marketApr: number;
  /** Loan length in months. */
  termMonths: number;
  /** Cash down. */
  downPayment: number;
}

export type Grade = "great" | "fair" | "walk_away";

export interface DealVerdict {
  grade: Grade;
  headline: string;
  monthlyPayment: number;
  totalInterest: number;
  /** Negotiated price minus MSRP (negative = below sticker). */
  priceVsMsrp: number;
  /** Offered APR minus market APR, in decimal (e.g. 0.03 = 3 points over). */
  aprGap: number;
  /** Roughly what the price *should* be — a fair transaction target. */
  fairPriceTarget: number;
  reasons: { grade: Grade; text: string }[];
}

// New cars typically transact a few percent under MSRP; treat ~5% under as the
// fair target and anything at/above sticker as a red flag.
const FAIR_DISCOUNT = 0.05;
const GREAT_DISCOUNT = 0.08;

// How far over the going rate before financing is a problem. Dealers mark up the
// bank "buy rate"; up to ~0.5pt is normal, 2pt+ is a markup worth refinancing.
const APR_OK_GAP = 0.005;
const APR_BAD_GAP = 0.02;

const worst = (grades: Grade[]): Grade =>
  grades.includes("walk_away")
    ? "walk_away"
    : grades.includes("fair")
      ? "fair"
      : "great";

export function rateDeal(input: DealInput): DealVerdict {
  const { msrp, quotedPrice, offeredApr, marketApr, termMonths, downPayment } =
    input;

  const principal = Math.max(0, quotedPrice - downPayment);
  const monthlyPayment = monthlyLoanPayment(principal, offeredApr, termMonths);
  const totalInterest = totalLoanInterest(principal, offeredApr, termMonths);

  const priceVsMsrp = quotedPrice - msrp;
  const aprGap = offeredApr - marketApr;
  const fairPriceTarget = Math.round(msrp * (1 - FAIR_DISCOUNT));

  // --- Grade the price ---
  const reasons: DealVerdict["reasons"] = [];
  let priceGrade: Grade;
  if (quotedPrice <= msrp * (1 - GREAT_DISCOUNT)) {
    priceGrade = "great";
    reasons.push({
      grade: "great",
      text: `Price is ${pct(-priceVsMsrp / msrp)} below MSRP — a strong number.`,
    });
  } else if (quotedPrice <= msrp) {
    priceGrade = "fair";
    reasons.push({
      grade: "fair",
      text:
        priceVsMsrp === 0
          ? "Price is exactly MSRP — there's usually room to push below sticker."
          : `Price is ${pct(-priceVsMsrp / msrp)} under MSRP; fair, but aim for ~${pct(FAIR_DISCOUNT)} off (${money(fairPriceTarget)}).`,
    });
  } else {
    priceGrade = "walk_away";
    reasons.push({
      grade: "walk_away",
      text: `Price is ${money(priceVsMsrp)} OVER MSRP — markups/add-ons. Target ${money(fairPriceTarget)}.`,
    });
  }

  // --- Grade the financing ---
  let aprGrade: Grade;
  if (aprGap <= APR_OK_GAP) {
    aprGrade = "great";
    reasons.push({
      grade: "great",
      text: `${(offeredApr * 100).toFixed(1)}% APR is at or below the going rate (${(marketApr * 100).toFixed(1)}%).`,
    });
  } else if (aprGap <= APR_BAD_GAP) {
    aprGrade = "fair";
    reasons.push({
      grade: "fair",
      text: `${(offeredApr * 100).toFixed(1)}% APR is ${pts(aprGap)} over the ${(marketApr * 100).toFixed(1)}% going rate — ask them to match a credit-union quote.`,
    });
  } else {
    aprGrade = "walk_away";
    reasons.push({
      grade: "walk_away",
      text: `${(offeredApr * 100).toFixed(1)}% APR is ${pts(aprGap)} over the ${(marketApr * 100).toFixed(1)}% going rate — that's a financing markup costing you ${money(totalInterest)} in interest. Get outside financing.`,
    });
  }

  const grade = worst([priceGrade, aprGrade]);
  const headline =
    grade === "great"
      ? "Strong deal — sign it."
      : grade === "fair"
        ? "Decent, but there's room to push."
        : "Walk away (or renegotiate).";

  return {
    grade,
    headline,
    monthlyPayment: Math.round(monthlyPayment),
    totalInterest: Math.round(totalInterest),
    priceVsMsrp: Math.round(priceVsMsrp),
    aprGap,
    fairPriceTarget,
    reasons,
  };
}

function pct(frac: number): string {
  return `${(frac * 100).toFixed(1)}%`;
}
function pts(gapDecimal: number): string {
  return `${(gapDecimal * 100).toFixed(1)} points`;
}
function money(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}
