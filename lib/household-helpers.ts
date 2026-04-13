/**
 * Household helpers for server-side routes.
 *
 * Plaid tokens are scoped to either:
 *  (a) household_id — shared across all members of that household (iOS app + new web connections)
 *  (b) user_id — owned by a single user
 *
 * We NEVER return tokens that lack both scopes to prevent cross-tenant leakage.
 */

import { adminDb } from "./firebase-admin";

/**
 * Get the household ID for a user. Returns null if user has no household.
 */
export async function getUserHouseholdId(uid: string): Promise<string | null> {
  try {
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists) return null;
    return (userDoc.data()?.householdId as string) || null;
  } catch {
    return null;
  }
}

/**
 * Get all active Plaid access tokens accessible to this user.
 * Tokens must be explicitly tied to the user or their household.
 */
export async function getPlaidTokensForUser(
  uid: string
): Promise<Array<{ id: string; access_token: string; item_id: string }>> {
  const householdId = await getUserHouseholdId(uid);
  const results: Array<{ id: string; access_token: string; item_id: string }> = [];
  const seen = new Set<string>();

  // 1. Tokens scoped to the user's household
  if (householdId) {
    const byHousehold = await adminDb
      .collection("plaid_access_tokens")
      .where("household_id", "==", householdId)
      .where("is_active", "==", true)
      .get();

    for (const d of byHousehold.docs) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      const data = d.data();
      results.push({
        id: d.id,
        access_token: data.access_token,
        item_id: data.item_id || d.id,
      });
    }
  }

  // 2. Tokens directly owned by this user
  const byUser = await adminDb
    .collection("plaid_access_tokens")
    .where("user_id", "==", uid)
    .where("is_active", "==", true)
    .get();

  for (const d of byUser.docs) {
    if (seen.has(d.id)) continue;
    seen.add(d.id);
    const data = d.data();
    results.push({
      id: d.id,
      access_token: data.access_token,
      item_id: data.item_id || d.id,
    });
  }

  return results;
}
