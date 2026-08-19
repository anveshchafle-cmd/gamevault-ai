import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SUMMARY_SYSTEM_PROMPT = `You are a sharp, direct business analyst for a gaming cafe owner. You've just been given today's automated operations report. Write a short executive summary.

Rules:
- 3-4 sentences maximum.
- Every fact and number you mention MUST come from the data provided. Never invent anything.
- Identify the SINGLE most important thing the owner should know or do today — don't just list every number back.
- Direct, plain English, no corporate fluff, no "I hope this finds you well" filler.
- If nothing urgent happened, say so plainly and briefly instead of manufacturing false urgency.`;

export async function generateExecutiveSummary(reportData: Record<string, any>) {
  const userPrompt = `Here's today's automated ops report data:

${JSON.stringify(reportData, null, 2)}

Write the executive summary.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 250,
      system: SUMMARY_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    return textBlock && "text" in textBlock ? textBlock.text.trim() : null;
  } catch {
    return null; // gracefully absent if AI call fails — report still works without it
  }
}
