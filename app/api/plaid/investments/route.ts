import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, adminDb } from "@/lib/firebase-admin";
import { getPlaidClient } from "@/lib/plaid-server";

export async function POST(req: NextRequest) {
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const itemsSnapshot = await adminDb
      .collection("plaid_access_tokens")
      .where("user_id", "==", uid)
      .where("is_active", "==", true)
      .get();

    if (itemsSnapshot.empty) {
      return NextResponse.json({ holdingGroups: [] });
    }

    const plaid = getPlaidClient();
    const holdingGroups: any[] = [];

    for (const doc of itemsSnapshot.docs) {
      const tokenData = doc.data();
      try {
        const response = await plaid.investmentsHoldingsGet({
          access_token: tokenData.access_token,
        });

        const { holdings, securities, accounts } = response.data;

        // Build security lookup
        const securityMap = new Map(
          securities.map((s) => [s.security_id, s])
        );

        // Group holdings by account
        const byAccount: Record<string, any[]> = {};
        for (const holding of holdings) {
          if (!byAccount[holding.account_id]) byAccount[holding.account_id] = [];
          const security = securityMap.get(holding.security_id);

          byAccount[holding.account_id].push({
            id: holding.security_id,
            ticker: security?.ticker_symbol || "N/A",
            name: security?.name || "Unknown",
            price: security?.close_price || 0,
            quantity: holding.quantity,
            value: holding.institution_value || (holding.quantity * (security?.close_price || 0)),
            weight: 0, // calculated below
            costBasis: holding.cost_basis || 0,
            performance3M: null, // would need historical data
            type: security?.type || "unknown",
            sector: security?.unofficial_currency_code || null,
          });
        }

        // Create holding groups per account
        for (const account of accounts) {
          if (account.type !== "investment") continue;
          const accountHoldings = byAccount[account.account_id] || [];
          if (accountHoldings.length === 0) continue;

          const totalValue = accountHoldings.reduce((s: number, h: any) => s + h.value, 0);
          // Calculate weights
          for (const h of accountHoldings) {
            h.weight = totalValue > 0 ? Math.round((h.value / totalValue) * 10000) / 100 : 0;
          }

          holdingGroups.push({
            id: account.account_id,
            accountName: account.name || "Investment Account",
            holdings: accountHoldings,
          });
        }
      } catch (err: any) {
        // Item may not have investments product — skip silently
        if (err?.response?.data?.error_code === "PRODUCTS_NOT_SUPPORTED") {
          continue;
        }
        console.error(`Error fetching investments for item ${doc.id}:`, err.message);
      }
    }

    return NextResponse.json({ holdingGroups });
  } catch (error: any) {
    console.error("Error getting investments:", error);
    return NextResponse.json({ error: "Failed to get investments" }, { status: 500 });
  }
}
