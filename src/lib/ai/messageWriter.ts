import Anthropic from "@anthropic-ai/sdk";
import { createServiceRoleClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You write WhatsApp messages for GameVault, a gaming cafe in India. Voice: a savvy gamer friend who knows what's happening at the cafe right now — casual, warm, a bit playful, uses light gamer slang naturally (not forced).

Hard rules, never break these:
- Every number, seat count, or fact you mention MUST come from the data provided. Never invent statistics, seat counts, or urgency that isn't real.
- Never guilt-trip, never manufacture fake urgency, never pressure using emotional manipulation.
- Keep it short — 2-3 sentences max, WhatsApp-length.
- Be honest and transparent. If something is a genuine limited-time real offer, say so plainly.
- No emojis overload — one or two max, only if it fits naturally.`;

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

Only reference the real occupancy numbers above if they're genuinely relevant to urgency (e.g. cafe is nearly full). Don't force it in if it doesn't fit naturally.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 200,
    system: SYSTEM_PROMPT,
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
