import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase-admin";
import { getPlaidClient, CountryCode } from "@/lib/plaid-server";
import { getPlaidTokensForUser } from "@/lib/household-helpers";

export async function POST(req: NextRequest) {
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const tokens = await getPlaidTokensForUser(uid);

    if (tokens.length === 0) {
      return NextResponse.json({ accounts: [], items: [] });
    }

    const plaid = getPlaidClient();
    const allAccounts: any[] = [];
    const items: any[] = [];

    for (const token of tokens) {
      try {
        const accountsResponse = await plaid.accountsGet({
          access_token: token.access_token,
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
          item_id: token.id,
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
          item_id: token.id,
          institution_name: institutionName,
          account_count: accounts.length,
        });
      } catch (err: any) {
        console.error(`Error fetching accounts for item ${token.id}:`, err.message);
      }
    }

    return NextResponse.json({ accounts: allAccounts, items });
  } catch (error: any) {
    console.error("Error getting all accounts:", error);
    return NextResponse.json({ error: "Failed to get accounts" }, { status: 500 });
  }
}
