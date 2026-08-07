import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// For every action marked executed 3+ days ago with no outcome recorded
// yet, checks whether the customer actually transacted in the days after
// — and records the real revenue, replacing the static expected-value
// guess with reality. Run this periodically (or on-demand via a button).
export async function GET() {
  const supabase = createServiceRoleClient();

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const { data: executedActions } = await supabase
    .from("next_best_actions")
    .select("id, customer_id, executed_at, recommended_action")
    .eq("was_executed", true)
    .is("actual_outcome_value", null)
    .lt("executed_at", threeDaysAgo.toISOString());

  if (!executedActions || executedActions.length === 0) {
    return NextResponse.json({ measured: 0 });
  }

  let measured = 0;

  for (const action of executedActions) {
    if (!action.customer_id || !action.executed_at) continue;

    const windowEnd = new Date(action.executed_at);
    windowEnd.setDate(windowEnd.getDate() + 7);

    const { data: transactions } = await supabase
      .from("transactions")
      .select("total_amount")
      .eq("customer_id", action.customer_id)
      .gte("created_at", action.executed_at)
      .lte("created_at", windowEnd.toISOString());

    const actualValue = (transactions ?? []).reduce(
      (sum, t) => sum + Number(t.total_amount),
      0
    );

    await supabase
      .from("next_best_actions")
      .update({ actual_outcome_value: actualValue })
      .eq("id", action.id);

    measured++;
  }

  return NextResponse.json({ measured });
}
