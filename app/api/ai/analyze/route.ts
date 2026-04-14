import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

// =============================================================================
// System prompts for each analysis type
// =============================================================================

const PROMPTS: Record<string, (ctx: string) => string> = {
  "weekly-brief": (ctx) => `You are a financial advisor. Produce a CONCISE weekly brief for the user based on their data below.

Today's date: ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}

Format your response as STRICT JSON with this exact schema:
{
  "greeting": "short personalized greeting (5-10 words)",
  "highlights": [
    {"emoji": "💰", "headline": "one-line headline", "detail": "1-2 sentences"},
    ...3-5 items
  ],
  "actionItems": [
    {"label": "short action", "detail": "why matters"},
    ...0-3 items
  ]
}

Focus on things that changed this week vs prior patterns. Don't restate obvious facts. Find SPECIFIC insights. Use actual numbers from their data.

User's data:
${ctx}`,

  "portfolio-analysis": (ctx) => `You are a CFA. Analyze the user's investment holdings and recent market news. Produce CONCISE analysis focused on actionable observations.

Today's date: ${new Date().toLocaleDateString()}

Format as STRICT JSON:
{
  "summary": "1-2 sentence overall portfolio health",
  "observations": [
    {"type": "concentration" | "diversification" | "performance" | "risk" | "opportunity", "headline": "short", "detail": "1-2 sentences with specific numbers"},
    ...3-5 items
  ],
  "recommendations": [
    {"priority": "high" | "medium" | "low", "action": "short action", "rationale": "why"},
    ...0-3 items
  ]
}

Don't give generic advice. Reference specific holdings, sectors, or amounts.

User's data:
${ctx}`,

  "tax-opportunities": (ctx) => `You are a CPA reviewing the user's investment holdings for tax-loss harvesting opportunities.

Format as STRICT JSON:
{
  "summary": "1 sentence on tax situation",
  "opportunities": [
    {"ticker": "SYMBOL", "loss": "dollar amount", "action": "sell X shares", "rationale": "why, including wash-sale considerations"},
    ...0-5 items
  ],
  "caveats": ["string", ...always note wash-sale rule and recommend CPA review]
}

Only suggest harvesting when there's an actual loss. Don't invent positions.

User's data:
${ctx}`,

  "subscription-audit": (ctx) => `You are a financial auditor reviewing the user's transactions for subscriptions they could cancel.

Format as STRICT JSON:
{
  "totalMonthly": "total dollar amount across all detected subscriptions",
  "subscriptions": [
    {"merchant": "name", "monthly": "dollar amount", "category": "string", "lastCharged": "YYYY-MM-DD", "suggestion": "keep | review | cancel", "why": "short reason"},
    ...all subscriptions found
  ]
}

Look at recurring transactions, merchant names (Netflix, Spotify, gym, etc.). Base suggestions on usage patterns when visible.

User's data:
${ctx}`,
};

// =============================================================================
// Route
// =============================================================================

export async function POST(req: NextRequest) {
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 10 analysis requests per 5 minutes per user (each is 2K tokens of Claude)
  const limited = rateLimit(`analyze:${uid}`, { limit: 10, windowMs: 5 * 60_000 });
  if (limited) return limited;

  const { type, financialContext = "" } = await req.json();
  if (!type || !PROMPTS[type]) {
    return NextResponse.json({ error: "Invalid analysis type" }, { status: 400 });
  }

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Claude API key not configured" }, { status: 500 });

  try {
    const prompt = PROMPTS[type](financialContext);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: "Respond with ONLY the JSON object requested. No markdown, no explanation.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Claude API error:", response.status, errorBody);
      return NextResponse.json({ error: "Claude API request failed" }, { status: response.status });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    // Parse the JSON response
    let parsed;
    try {
      // Clean up potential markdown code fences
      const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("Failed to parse AI JSON:", text);
      return NextResponse.json({ error: "Invalid AI response format", raw: text }, { status: 500 });
    }

    return NextResponse.json({ analysis: parsed, generatedAt: new Date().toISOString() });
  } catch (error: any) {
    console.error("Error in AI analyze:", error);
    return NextResponse.json({ error: "Failed to process analysis" }, { status: 500 });
  }
}
