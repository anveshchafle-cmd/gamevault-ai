// Two distinct wording styles for churn recovery, competing to see which
// actually brings customers back. Assignment is deterministic per customer
// (not random per send) so we get a clean comparison over time, not noise.

export type ChurnVariant = "direct" | "warm";

export function churnRecoveryMessageVariant(
  variant: ChurnVariant,
  customerName: string,
  favoriteGame: string | null,
  daysInactive: number
): string {
  const gamePart = favoriteGame ? ` on ${favoriteGame}` : "";

  if (variant === "direct") {
    return `Hey ${customerName}! It's been ${daysInactive} days since your last session${gamePart}. Your station's ready — come by this week and get 30 mins free.`;
  }

  // "warm" variant — more personal, less transactional framing
  return `${customerName}, we've missed seeing you${gamePart ? ` grinding${gamePart}` : " around"}! It's been a bit — 30 mins on the house if you swing by this week. No pressure, just wanted you to know your spot's here.`;
}

// Deterministic assignment based on customer ID, so the same customer
// always gets the same variant (clean A/B split, not random noise per send)
export function getVariantForCustomer(customerId: string): ChurnVariant {
  const lastChar = customerId.charCodeAt(customerId.length - 1);
  return lastChar % 2 === 0 ? "direct" : "warm";
}
