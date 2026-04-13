import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// =============================================================================
// Tool Definitions — what the AI can do on the user's behalf
// =============================================================================

const tools = [
  {
    name: "create_goal",
    description: "Create a new savings goal for the user.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Name of the goal (e.g., 'Emergency Fund')" },
        target: { type: "number", description: "Target amount in dollars" },
        current: { type: "number", description: "Current saved amount (default 0)" },
        deadline: { type: "string", description: "Target deadline (e.g., 'Dec 2026')" },
        monthlyContribution: { type: "number", description: "Planned monthly contribution in dollars (default 0)" },
        icon: { type: "string", description: "Emoji icon (default '🎯'). Examples: 🛡️ (emergency), ✈️ (travel), 🚗 (car), 🏠 (home), 🎓 (education)" },
        color: { type: "string", description: "Hex color (default '#10b981'). Options: #10b981 (green), #3b82f6 (blue), #f59e0b (amber), #8b5cf6 (purple), #ef4444 (red)" },
      },
      required: ["name", "target"],
    },
  },
  {
    name: "update_goal",
    description: "Update an existing goal. Use list_goals first to get the goal ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        goal_id: { type: "string", description: "The ID of the goal to update" },
        name: { type: "string" },
        target: { type: "number" },
        current: { type: "number" },
        deadline: { type: "string" },
        monthlyContribution: { type: "number" },
        icon: { type: "string" },
        color: { type: "string" },
      },
      required: ["goal_id"],
    },
  },
  {
    name: "delete_goal",
    description: "Delete a goal. Use list_goals first to get the goal ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        goal_id: { type: "string", description: "The ID of the goal to delete" },
      },
      required: ["goal_id"],
    },
  },
  {
    name: "list_goals",
    description: "List all the user's current savings goals with their IDs.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "set_budget_target",
    description: "Set a monthly budget target for a category (e.g., 'Food and Drink', 'Shopping', 'Transportation').",
    input_schema: {
      type: "object" as const,
      properties: {
        category: { type: "string", description: "Category name (will be normalized to lowercase slug)" },
        amount: { type: "number", description: "Monthly budget amount in dollars" },
      },
      required: ["category", "amount"],
    },
  },
  {
    name: "exclude_from_recurring",
    description: "Hide a merchant from the auto-detected recurring list (user confirms it's not actually recurring).",
    input_schema: {
      type: "object" as const,
      properties: {
        merchant: { type: "string", description: "Exact merchant name to exclude" },
      },
      required: ["merchant"],
    },
  },
  {
    name: "update_transaction",
    description: "Update a transaction — rename merchant, add notes, flag it, or mark as recurring. Requires the transaction ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        transaction_id: { type: "string" },
        merchantName: { type: "string" },
        notes: { type: "string" },
        isFlagged: { type: "boolean" },
        isRecurring: { type: "boolean" },
      },
      required: ["transaction_id"],
    },
  },
  {
    name: "update_setting",
    description: "Update a user preference. Valid keys: emailNotifs, pushNotifs, weeklyReport, budgetAlerts, largeTransactions, darkMode, currency (USD/EUR/GBP), displayName.",
    input_schema: {
      type: "object" as const,
      properties: {
        key: { type: "string" },
        value: { description: "Boolean or string depending on the key" },
      },
      required: ["key", "value"],
    },
  },
  {
    name: "rename_category",
    description: "Rename a Plaid category globally (e.g., rename 'Food and Drink' to 'Groceries'). The rename applies everywhere in the app.",
    input_schema: {
      type: "object" as const,
      properties: {
        original_category: { type: "string", description: "The current Plaid category name" },
        new_name: { type: "string", description: "The renamed category name" },
      },
      required: ["original_category", "new_name"],
    },
  },
  {
    name: "create_rule",
    description: "Create an auto-categorization rule. When any transaction's merchant contains the pattern, the rule's actions are applied.",
    input_schema: {
      type: "object" as const,
      properties: {
        merchant_pattern: { type: "string", description: "Substring to match in merchant name (case-insensitive)" },
        set_category: { type: "string", description: "Category to auto-assign (optional)" },
        set_recurring: { type: "boolean", description: "Whether to mark matches as recurring (optional)" },
        set_flag: { type: "boolean", description: "Whether to flag matches (optional)" },
      },
      required: ["merchant_pattern"],
    },
  },
  {
    name: "hide_account",
    description: "Hide an account from net worth totals and charts (user still sees it on Accounts page).",
    input_schema: {
      type: "object" as const,
      properties: {
        account_id: { type: "string" },
      },
      required: ["account_id"],
    },
  },
  {
    name: "add_manual_recurring",
    description: "Add a manual recurring income or expense (for things Plaid didn't auto-detect, like cash income or a new subscription).",
    input_schema: {
      type: "object" as const,
      properties: {
        type: { type: "string", enum: ["income", "expense"] },
        name: { type: "string", description: "Name (e.g., 'Freelance payment for Dwayne' or 'Spotify subscription')" },
        amount: { type: "number" },
        frequency: { type: "string", description: "'Weekly', 'Bi-weekly', 'Monthly', or 'Yearly'" },
        category: { type: "string", description: "Category label" },
        notes: { type: "string" },
      },
      required: ["type", "name", "amount", "frequency"],
    },
  },
];

// =============================================================================
// Tool Execution — writes to Firestore on the user's behalf
// =============================================================================

async function executeTool(name: string, input: any, uid: string): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    const userRef = adminDb.collection("users").doc(uid);

    switch (name) {
      case "list_goals": {
        const snap = await userRef.collection("goals").get();
        const goals = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        return { success: true, result: { goals } };
      }

      case "create_goal": {
        const id = `goal_${Date.now()}`;
        const goal = {
          id,
          name: input.name,
          target: input.target,
          current: input.current ?? 0,
          deadline: input.deadline || "No deadline",
          monthlyContribution: input.monthlyContribution ?? 0,
          icon: input.icon || "🎯",
          color: input.color || "#10b981",
          createdAt: Date.now(),
        };
        await userRef.collection("goals").doc(id).set(goal);
        return { success: true, result: { goal_id: id, goal } };
      }

      case "update_goal": {
        const { goal_id, ...updates } = input;
        await userRef.collection("goals").doc(goal_id).set(updates, { merge: true });
        return { success: true, result: { goal_id } };
      }

      case "delete_goal": {
        await userRef.collection("goals").doc(input.goal_id).delete();
        return { success: true, result: { deleted: input.goal_id } };
      }

      case "set_budget_target": {
        const categoryKey = String(input.category).toLowerCase().replace(/\s+/g, "-");
        await userRef.collection("settings").doc("budget_targets").set(
          { [categoryKey]: input.amount },
          { merge: true }
        );
        return { success: true, result: { category: categoryKey, amount: input.amount } };
      }

      case "exclude_from_recurring": {
        const settingsDoc = await userRef.collection("settings").doc("user").get();
        const current = (settingsDoc.data()?.excludedRecurring as string[]) || [];
        if (!current.some((m) => m.toLowerCase() === input.merchant.toLowerCase())) {
          await userRef.collection("settings").doc("user").set(
            { excludedRecurring: [...current, input.merchant] },
            { merge: true }
          );
        }
        return { success: true, result: { excluded: input.merchant } };
      }

      case "update_transaction": {
        const { transaction_id, ...edits } = input;
        await userRef.collection("transaction_edits").doc(transaction_id).set(edits, { merge: true });
        return { success: true, result: { transaction_id, edits } };
      }

      case "update_setting": {
        await userRef.collection("settings").doc("user").set(
          { [input.key]: input.value },
          { merge: true }
        );
        return { success: true, result: { key: input.key, value: input.value } };
      }

      case "rename_category": {
        const settingsDoc = await userRef.collection("settings").doc("user").get();
        const overrides = (settingsDoc.data()?.categoryOverrides as Record<string, string>) || {};
        overrides[input.original_category] = input.new_name;
        await userRef.collection("settings").doc("user").set({ categoryOverrides: overrides }, { merge: true });
        return { success: true, result: { renamed: input.original_category, to: input.new_name } };
      }

      case "create_rule": {
        const id = `rule_${Date.now()}`;
        const rule = {
          id,
          merchantPattern: input.merchant_pattern,
          setCategory: input.set_category,
          setRecurring: input.set_recurring,
          setFlag: input.set_flag,
          createdAt: Date.now(),
        };
        await userRef.collection("rules").doc(id).set(rule);
        return { success: true, result: { rule_id: id, rule } };
      }

      case "hide_account": {
        const settingsDoc = await userRef.collection("settings").doc("user").get();
        const hidden = (settingsDoc.data()?.hiddenAccounts as string[]) || [];
        if (!hidden.includes(input.account_id)) hidden.push(input.account_id);
        await userRef.collection("settings").doc("user").set({ hiddenAccounts: hidden }, { merge: true });
        return { success: true, result: { hidden: input.account_id } };
      }

      case "add_manual_recurring": {
        const id = `manual_${Date.now()}`;
        const item = {
          id,
          type: input.type,
          name: input.name,
          amount: input.amount,
          frequency: input.frequency,
          category: input.category || (input.type === "income" ? "Income" : "Other"),
          notes: input.notes || "",
          createdAt: Date.now(),
        };
        await userRef.collection("manual_recurring").doc(id).set(item);
        return { success: true, result: { id, item } };
      }

      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  } catch (err: any) {
    console.error(`Tool ${name} failed:`, err);
    return { success: false, error: err.message || "Tool execution failed" };
  }
}

// =============================================================================
// Route
// =============================================================================

export async function POST(req: NextRequest) {
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, conversationHistory = [], financialContext = "" } = await req.json();
  if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 });

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Claude API key not configured" }, { status: 500 });

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const systemPrompt = `You are Flourish AI — the user's personal financial advisor with the combined expertise of a CFA (Chartered Financial Analyst), CPA (Certified Public Accountant), and CFP (Certified Financial Planner).

Today's date: ${today}

You have direct access to the user's real-time financial data AND you can take actions on their behalf via tool calls. You act like a true assistant — when the user asks you to do something, do it immediately rather than just explaining how.

## When to use tools (act autonomously)

- "Add a goal for X" → call create_goal
- "Set my Food budget to $500" → call set_budget_target
- "Rename this transaction to X" → call update_transaction
- "I want to save $1000 for a vacation by December" → call create_goal with sensible defaults
- "That's not recurring, remove it" → call exclude_from_recurring
- "Turn off email notifications" → call update_setting
- "I got paid $500 cash from freelance work" → call add_manual_recurring or update_transaction as appropriate
- "Update my goal — I already saved $5k" → call list_goals first to get ID, then update_goal
- "Rename 'Food and Drink' to 'Groceries'" → call rename_category
- "Anytime I see Starbucks, tag it as Coffee" → call create_rule with merchant_pattern="Starbucks", set_category="Coffee"
- "Hide my Employer Plan 401k from totals" → call hide_account (use account list to find ID)

Use sensible defaults when the user doesn't specify everything. For example, if they say "create a goal for a new car for $20k", pick a reasonable deadline (6-12 months), monthly contribution (target/months), icon (🚗), and color.

## Confirmations

After taking an action, briefly confirm what you did in 1-2 sentences. Example:
"✓ Created your Emergency Fund goal — $15,000 target by December 2026, saving $500/month. You'll reach it in about 30 months at your current pace."

If the user asks for something destructive (delete goal, major budget change, etc.), perform it but confirm clearly what was done.

## Your Expertise

**Investment (CFA):** portfolio allocation, diversification, concentration risk, tax efficiency, rebalancing
**Tax (CPA):** deductions, tax-loss harvesting, Roth vs Traditional, HSA, 529
**Planning (CFP):** goal pacing, emergency fund sizing, debt payoff strategies, budget optimization

## Communication Style

- Direct and specific — cite exact numbers from their data
- Structure complex answers with short bullets or headers
- Default to 2-4 sentences for simple questions, up to 8 for analysis
- Use $X,XXX formatting for money

## Critical Rules

1. Never fabricate numbers — only reference figures in their data.
2. Not a fiduciary — recommend a licensed advisor for major decisions.
3. Tax advice is general — specific situations need a CPA's review.

${financialContext ? `\n## User's Current Financial Data\n\n${financialContext}` : "\n## Note: No financial data connected yet."}`;

  let messages: any[] = [
    ...conversationHistory.map((m: any) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  const actionsPerformed: { tool: string; input: any; result: any }[] = [];

  try {
    // Agentic loop — up to 6 iterations
    for (let iteration = 0; iteration < 6; iteration++) {
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
          tools,
          messages,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Claude API error:", response.status, errorBody);
        return NextResponse.json({ error: "Claude API request failed" }, { status: response.status });
      }

      const data = await response.json();

      // If not using a tool, return final response
      if (data.stop_reason !== "tool_use") {
        const text = data.content?.find((b: any) => b.type === "text")?.text || "";
        return NextResponse.json({ response: text, actions: actionsPerformed, usage: data.usage });
      }

      // Execute any tool_use blocks, add assistant message + tool_result to history
      messages.push({ role: "assistant", content: data.content });
      const toolResults: any[] = [];

      for (const block of data.content) {
        if (block.type === "tool_use") {
          const result = await executeTool(block.name, block.input, uid);
          actionsPerformed.push({ tool: block.name, input: block.input, result });
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result),
            is_error: !result.success,
          });
        }
      }

      messages.push({ role: "user", content: toolResults });
    }

    // Safety exit — max iterations reached
    return NextResponse.json({
      response: "I completed the requested actions but had to stop after several iterations.",
      actions: actionsPerformed,
    });
  } catch (error: any) {
    console.error("Error in Claude chat:", error);
    return NextResponse.json({ error: "Failed to process chat request" }, { status: 500 });
  }
}
