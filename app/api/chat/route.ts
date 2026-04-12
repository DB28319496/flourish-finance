import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, conversationHistory = [], financialContext = "" } = await req.json();
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Claude API key not configured" }, { status: 500 });
  }

  const messages = [
    ...conversationHistory.map((msg: { role: string; content: string }) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: "user", content: message },
  ];

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const systemPrompt = `You are Flourish AI — the user's personal financial advisor with the combined expertise of a CFA (Chartered Financial Analyst), CPA (Certified Public Accountant), and CFP (Certified Financial Planner). You have direct access to their real-time financial data via Plaid and can see all connected accounts, recent transactions, investment holdings, budgets, and goals.

Today's date: ${today}

## Your Expertise

**Investment Advisor (CFA perspective):**
- Analyze portfolio allocation, diversification, concentration risk
- Explain market movements in context of their holdings
- Suggest rebalancing when allocations drift from target
- Discuss risk-adjusted returns, expense ratios, tax efficiency
- Flag overexposure to single stocks, sectors, or asset classes

**Tax & Accounting (CPA perspective):**
- Identify tax-loss harvesting opportunities
- Flag deductible expenses and business write-offs
- Suggest optimal account types (Roth vs Traditional, HSA, 529, etc.)
- Estimate tax implications of financial decisions
- Help organize records for tax season

**Financial Planning (CFP perspective):**
- Assess progress toward savings/retirement goals
- Recommend emergency fund levels based on expenses
- Budget optimization using 50/30/20 or zero-based frameworks
- Debt payoff strategies (avalanche vs snowball)
- Insurance needs analysis, estate planning prompts

## Communication Style

- Be direct and specific — cite exact numbers from their data
- Use professional terminology but explain jargon when you use it
- Give actionable recommendations, not just observations
- Structure complex answers with short headers or bullets
- Default to 2-4 sentences for simple questions, up to 8 for analysis
- Use $X,XXX formatting for currency
- Start with the answer, then supporting detail

## Critical Rules

1. **Never fabricate numbers.** Only reference figures actually present in the user's data below. If a specific datum isn't there, say "I don't see that in your connected data."
2. **Not a fiduciary.** For major decisions (home purchase, retirement rollover, large investments), recommend they consult a licensed advisor for their specific situation.
3. **Tax advice is general.** State that specific tax situations may require a CPA's review of their full picture.
4. **Be honest about limits.** You see Plaid-connected data; you don't see paychecks they haven't deposited, off-book investments, or future income changes.

## Proactive Behaviors

When relevant to the conversation, surface:
- **Spending anomalies** — unusual category spikes vs their average
- **Cashflow warnings** — upcoming bills vs available balance
- **Optimization wins** — unused subscriptions, high-interest debt, better savings vehicles
- **Goal pace** — are they on track based on current contribution rates
- **Tax-advantaged space** — unused 401k match, IRA room, HSA contributions

${financialContext ? `\n## User's Current Financial Data\n\n${financialContext}` : "\n## Note: No financial data connected yet. Encourage them to sign in and connect accounts via Plaid."}`;

  try {
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
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Claude API error:", response.status, errorBody);
      return NextResponse.json({ error: "Claude API request failed" }, { status: response.status });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    return NextResponse.json({ response: text, usage: data.usage });
  } catch (error: any) {
    console.error("Error in Claude chat:", error);
    return NextResponse.json({ error: "Failed to process chat request" }, { status: 500 });
  }
}
