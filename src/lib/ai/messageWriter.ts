import Anthropic from "@anthropic-ai/sdk";
import { createServiceRoleClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FOMO_SYSTEM_PROMPT = `You write WhatsApp messages for GameVault, a gaming cafe in India. Voice: a savvy gamer friend who knows what's happening at the cafe right now — casual, warm, a bit playful, uses light gamer slang naturally (not forced).

Hard rules, never break these:
- Every number, seat count, or fact you mention MUST come from the data provided. Never invent statistics, seat counts, or urgency that isn't real.
- Never guilt-trip, never manufacture fake urgency, never pressure using emotional manipulation.
- Keep it short — 2-3 sentences max, WhatsApp-length.
- Be honest and transparent.
- No emoji overload — one or two max, only if it fits naturally.`;

const CHURN_SYSTEM_PROMPT = `You write WhatsApp churn-recovery messages for GameVault, a gaming cafe in India. Voice: a genuine, warm gamer friend who's noticed someone's been away — not a marketing bot.

Hard rules, never break these:
- Every fact you mention (days inactive, favorite game, achievements, spend history) MUST come from the data provided. Never invent anything.
- Never guilt-trip. Never fake urgency. Never pressure.
- Reference something real and specific about THIS customer (their game, an achievement, how long they've been away) so it feels personal, not templated.
- Keep it short — 2-3 sentences, WhatsApp-length.
- Offer a genuine, simple incentive to come back if one is provided in the data.`;

export async function generateFomoMessage(context: {
  customerName: string;
  favoriteGame: string | null;
  occupiedStations: number;
  totalStations: number;
  availableStations: number;
  offerDescription: string;
}) {
  const { customerName, favoriteGame, occupiedStations, totalStations, availableStations, offerDescription } = context;

  const userPrompt = `Write a FOMO-style WhatsApp message for this customer.

Customer name: ${customerName}
Favorite game: ${favoriteGame ?? "unknown"}
Real current cafe status: ${occupiedStations} of ${totalStations} stations occupied, ${availableStations} available right now.
The actual offer to mention: ${offerDescription}

Only reference the real occupancy numbers above if genuinely relevant to urgency. Don't force it in if it doesn't fit naturally.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 200,
    system: FOMO_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock && "text" in textBlock ? textBlock.text.trim() : null;
}

export async function generatePersonalizedChurnMessage(context: {
  customerName: string;
  favoriteGame: string | null;
  daysInactive: number;
  clvTier: string | null;
  achievements: string[];
}) {
  const { customerName, favoriteGame, daysInactive, clvTier, achievements } = context;

  const userPrompt = `Write a personalized "come back" WhatsApp message for this customer.

Customer name: ${customerName}
Favorite game: ${favoriteGame ?? "unknown"}
Days since last visit: ${daysInactive}
Customer tier: ${clvTier ?? "unscored"} (whale = big spender, grinder = frequent visitor, socialite = brings friends, at_risk = was active, now quiet, tourist = came once)
Achievements they've earned: ${achievements.length > 0 ? achievements.join(", ") : "none yet"}

Offer: 30 minutes free if they come back this week (only mention this if it fits naturally).`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 200,
    system: CHURN_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock && "text" in textBlock ? textBlock.text.trim() : null;
}

export async function getLiveOccupancyContext(cafeId: string) {
  const supabase = createServiceRoleClient();
  const { data: stations } = await supabase
    .from("stations")
    .select("status")
    .eq("cafe_id", cafeId);

  const totalStations = stations?.length ?? 0;
  const occupiedStations = stations?.filter((s) => s.status === "occupied").length ?? 0;
  const availableStations = totalStations - occupiedStations;

  return { totalStations, occupiedStations, availableStations };
}
