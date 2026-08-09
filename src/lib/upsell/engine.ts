import { createServiceRoleClient } from "@/lib/supabase/server";

export type UpsellSuggestion = {
  itemName: string;
  suggestedPrice: number;
  reason: string;
};

// Looks at this customer's past food/merch purchases and suggests their
// most-ordered item. Falls back to a generic starter suggestion for
// customers with no purchase history yet.
export async function getUpsellSuggestion(
  customerId: string
): Promise<UpsellSuggestion | null> {
  const supabase = createServiceRoleClient();

  const { data: pastOrders } = await supabase
    .from("transactions")
    .select("item_name, unit_price")
    .eq("customer_id", customerId)
    .in("item_type", ["food", "merch"]);

  if (!pastOrders || pastOrders.length === 0) {
    return {
      itemName: "Energy drink + chips combo",
      suggestedPrice: 100,
      reason: "First-time customer — starter combo suggestion",
    };
  }

  const counts: Record<string, { count: number; totalPrice: number }> = {};
  for (const order of pastOrders) {
    if (!order.item_name) continue;
    if (!counts[order.item_name]) {
      counts[order.item_name] = { count: 0, totalPrice: 0 };
    }
    counts[order.item_name].count++;
    counts[order.item_name].totalPrice += Number(order.unit_price);
  }

  const entries = Object.entries(counts);
  if (entries.length === 0) return null;

  entries.sort((a, b) => b[1].count - a[1].count);
  const [topItem, stats] = entries[0];

  return {
    itemName: topItem,
    suggestedPrice: Math.round(stats.totalPrice / stats.count),
    reason: `Ordered ${stats.count}x before — their usual`,
  };
}
