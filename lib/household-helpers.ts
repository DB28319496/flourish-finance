/**
 * Household helpers for server-side routes.
 * The iOS app uses a household-based data model where Plaid tokens are
 * shared across household members. This module resolves a user's household
 * and returns their access tokens.
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
 * Get all active Plaid access tokens for a user's household.
 * Falls back to tokens owned directly by the user if no household exists.
 */
export async function getPlaidTokensForUser(
  uid: string
): Promise<Array<{ id: string; access_token: string; item_id: string }>> {
  // Try household-based tokens first
  const householdId = await getUserHouseholdId(uid);

  if (householdId) {
    // Tokens may be stored with household_id field
    const byHousehold = await adminDb
      .collection("plaid_access_tokens")
      .where("household_id", "==", householdId)
      .where("is_active", "==", true)
      .get();

    if (!byHousehold.empty) {
      return byHousehold.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          access_token: data.access_token,
          item_id: data.item_id || d.id,
        };
      });
    }

    // Some tokens have user_id = "unknown" but are shared in the household
    // In that case fall through to return all tokens with access_token present
    // (this is the iOS app's actual schema)
    const allActive = await adminDb
      .collection("plaid_access_tokens")
      .where("is_active", "==", true)
      .get();

    if (!allActive.empty) {
      // Get household members
      const householdDoc = await adminDb.collection("households").doc(householdId).get();
      const memberIds = (householdDoc.data()?.memberUserIDs as string[]) || [uid];

      // Return tokens that belong to a member OR have user_id=unknown (household-owned)
      return allActive.docs
        .filter((d) => {
          const uId = d.data().user_id;
          return memberIds.includes(uId) || uId === "unknown";
        })
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            access_token: data.access_token,
            item_id: data.item_id || d.id,
          };
        });
    }
  }

  // Fallback: tokens directly owned by this user
  const byUser = await adminDb
    .collection("plaid_access_tokens")
    .where("user_id", "==", uid)
    .where("is_active", "==", true)
    .get();

  return byUser.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      access_token: data.access_token,
      item_id: data.item_id || d.id,
    };
  });
}
