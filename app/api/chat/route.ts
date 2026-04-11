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

  const systemPrompt = `You are Flourish AI, a friendly, proactive, and knowledgeable personal finance assistant. You have access to the user's real financial data and can answer questions about their spending, budgets, savings, net worth, and more.

IMPORTANT GUIDELINES:
- Be conversational, warm, and encouraging - celebrate wins and be supportive about challenges
- Give specific numbers from their data when answering questions
- Keep responses concise (2-4 sentences for simple questions, more for complex analysis)
- If asked about something not in the data, say so honestly
- Never make up numbers - only use what's in the provided data
- Use currency formatting ($X,XXX) for money amounts

PROACTIVE INSIGHTS - When relevant, include:
1. PREDICTIVE ALERTS: Warn about potential overspending based on pace
2. ACTIONABLE SUGGESTIONS: Identify specific savings opportunities
3. PATTERN RECOGNITION: Notice trends in spending
4. CELEBRATION: Acknowledge positive financial behavior
5. SMART RECOMMENDATIONS based on their situation

${financialContext ? `\nUSER'S FINANCIAL DATA:\n${financialContext}` : ""}`;

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
        max_tokens: 1024,
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
