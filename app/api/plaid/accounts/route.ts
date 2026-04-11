import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, adminDb } from "@/lib/firebase-admin";
import { getPlaidClient, CountryCode } from "@/lib/plaid-server";

export async function POST(req: NextRequest) {
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Get all Plaid items for this user
    const itemsSnapshot = await adminDb
      .collection("plaid_access_tokens")
      .where("user_id", "==", uid)
      .where("is_active", "==", true)
      .get();

    if (itemsSnapshot.empty) {
      return NextResponse.json({ accounts: [], items: [] });
    }

    const plaid = getPlaidClient();
    const allAccounts: any[] = [];
    const items: any[] = [];

    for (const doc of itemsSnapshot.docs) {
      const tokenData = doc.data();
      try {
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
            // Silently fall back
          }
        }

        const accounts = accountsResponse.data.accounts.map((account) => ({
          account_id: account.account_id,
          item_id: doc.id,
          name: account.name,
          official_name: account.official_name,
          type: account.type,
          subtype: account.subtype,
          mask: account.mask,
          current_balance: account.balances.current,
          available_balance: account.balances.available,
          limit: account.balances.limit,
          institution_name: institutionName,
          institution_id: institutionId,
        }));

        allAccounts.push(...accounts);
        items.push({
          item_id: doc.id,
          institution_name: institutionName,
          account_count: accounts.length,
        });
      } catch (err: any) {
        console.error(`Error fetching accounts for item ${doc.id}:`, err.message);
      }
    }

    return NextResponse.json({ accounts: allAccounts, items });
  } catch (error: any) {
    console.error("Error getting all accounts:", error);
    return NextResponse.json({ error: "Failed to get accounts" }, { status: 500 });
  }
}
