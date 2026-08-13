"use server";

import { createClient } from "@/lib/supabase/server";
import { generateFomoMessage, getLiveOccupancyContext } from "@/lib/ai/messageWriter";

export async function generateAiFomoText(
  cafeId: string,
  offerDescription: string
) {
  if (!offerDescription.trim()) {
    return { success: false, error: "Enter a rough offer idea first, then generate polished wording." };
  }

  try {
    const supabase = await createClient();
    const { data: sampleCustomer } = await supabase
      .from("customers")
      .select("name, favorite_game")
      .eq("cafe_id", cafeId)
      .limit(1)
      .maybeSingle();

    const occupancy = await getLiveOccupancyContext(cafeId);

    const message = await generateFomoMessage({
      customerName: sampleCustomer?.name ?? "there",
      favoriteGame: sampleCustomer?.favorite_game ?? null,
      occupiedStations: occupancy.occupiedStations,
      totalStations: occupancy.totalStations,
      availableStations: occupancy.availableStations,
      offerDescription,
    });

    if (!message) {
      return { success: false, error: "AI didn't return a message. Try again." };
    }

    return { success: true, message };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "AI generation failed." };
  }
}
