import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, adminDb } from "@/lib/firebase-admin";
import { getPlaidClient, CountryCode } from "@/lib/plaid-server";

export async function POST(req: NextRequest) {
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { days = 30 } = await req.json().catch(() => ({ days: 30 }));

  try {
    const itemsSnapshot = await adminDb
      .collection("plaid_access_tokens")
      .where("user_id", "==", uid)
      .where("is_active", "==", true)
      .get();

    if (itemsSnapshot.empty) {
      return NextResponse.json({ transactions: [], total_transactions: 0 });
    }

    const plaid = getPlaidClient();
    const allTransactions: any[] = [];
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    for (const doc of itemsSnapshot.docs) {
      const tokenData = doc.data();
      try {
        // Get accounts for mapping
        const accountsResponse = await plaid.accountsGet({
          access_token: tokenData.access_token,
        });

        const institutionId = accountsResponse.data.item.institution_id;
        let institutionName = "Unknown";
        if (institutionId) {
          try {
            const instResponse = await plaid.institutionsGetById({
              institution_id: institutionId,
              country_codes: [CountryCode.Us],
            });
            institutionName = instResponse.data.institution.name;
          } catch {
            // fallback
          }
        }

        const accountMap = new Map(
          accountsResponse.data.accounts.map((a) => [a.account_id, a])
        );

        // Get transactions
        const transactionsResponse = await plaid.transactionsGet({
          access_token: tokenData.access_token,
          start_date: startDate,
          end_date: endDate,
          options: { count: 500, offset: 0 },
        });

        const transactions = transactionsResponse.data.transactions.map((tx) => {
          const account = accountMap.get(tx.account_id);
          return {
            transaction_id: tx.transaction_id,
            account_id: tx.account_id,
            amount: tx.amount,
            date: tx.date,
            name: tx.name,
            merchant_name: tx.merchant_name,
            category: tx.category,
            personal_finance_category: tx.personal_finance_category,
            pending: tx.pending,
            account_name: account
              ? `${account.name}${account.mask ? ` ...${account.mask}` : ""}`
              : "Unknown",
            institution_name: institutionName,
          };
        });

        allTransactions.push(...transactions);
      } catch (err: any) {
        console.error(`Error fetching transactions for item ${doc.id}:`, err.message);
      }
    }

    // Sort by date descending
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      transactions: allTransactions,
      total_transactions: allTransactions.length,
    });
  } catch (error: any) {
    console.error("Error getting all transactions:", error);
    return NextResponse.json({ error: "Failed to get transactions" }, { status: 500 });
  }
}
