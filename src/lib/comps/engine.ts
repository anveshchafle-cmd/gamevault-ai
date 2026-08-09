export type CompTierInfo = {
  tier: string;
  label: string;
  perk: string;
  minSpend: number;
};

// Disclosed, spend-based perk tiers — same hook as the original doc's
// "comp" system, none of the "theoretical loss" obfuscation. What you
// spend is what you see; perks are stated plainly upfront.
export const COMP_TIERS: CompTierInfo[] = [
  { tier: "diamond", label: "Diamond", perk: "VIP lounge access + free monthly event invite", minSpend: 50000 },
  { tier: "platinum", label: "Platinum", perk: "Dedicated station priority + free premium upgrade", minSpend: 20000 },
  { tier: "gold", label: "Gold", perk: "Free monthly pass + exclusive merch", minSpend: 10000 },
  { tier: "silver", label: "Silver", perk: "Free food item + priority booking", minSpend: 5000 },
  { tier: "bronze", label: "Bronze", perk: "Free energy drink every visit", minSpend: 2000 },
];

export function getCompTier(monetary30d: number): CompTierInfo {
  for (const tier of COMP_TIERS) {
    if (monetary30d >= tier.minSpend) return tier;
  }
  return { tier: "none", label: "None", perk: "Spend ₹2,000+/month to unlock Bronze perks", minSpend: 0 };
}
