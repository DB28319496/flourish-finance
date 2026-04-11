// Plaid service — calls existing Firebase Cloud Functions
// These functions are already deployed and handle Plaid API communication server-side.

const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FUNCTIONS_URL || "";

interface PlaidAccount {
  account_id: string;
  name: string;
  official_name: string | null;
  type: string;       // "depository" | "investment" | "credit" | "loan"
  subtype: string | null;
  mask: string | null;
  current_balance: number | null;
  available_balance: number | null;
}

interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  merchant_name: string | null;
  category: string[] | null;
  pending: boolean;
}

async function callFunction(
  endpoint: string,
  idToken: string,
  body: Record<string, unknown> = {}
) {
  const res = await fetch(`${FUNCTIONS_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `Function ${endpoint} failed: ${res.status}`);
  }

  return res.json();
}

export async function createLinkToken(idToken: string): Promise<{ link_token: string }> {
  return callFunction("createLinkToken", idToken);
}

export async function exchangePublicToken(
  idToken: string,
  publicToken: string
): Promise<{ item_id: string }> {
  return callFunction("exchangePublicToken", idToken, { public_token: publicToken });
}

export async function getAccounts(
  idToken: string,
  itemId: string
): Promise<{ accounts: PlaidAccount[] }> {
  return callFunction("getAccounts", idToken, { item_id: itemId });
}

export async function getTransactions(
  idToken: string,
  itemId: string,
  days: number = 30
): Promise<{ transactions: PlaidTransaction[]; total_transactions: number }> {
  return callFunction("getTransactions", idToken, { item_id: itemId, days });
}

export async function removeItem(idToken: string, itemId: string): Promise<{ success: boolean }> {
  return callFunction("removeItem", idToken, { item_id: itemId });
}

export type { PlaidAccount, PlaidTransaction };
