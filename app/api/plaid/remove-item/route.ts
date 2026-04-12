import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, adminDb } from "@/lib/firebase-admin";
import { getPlaidClient } from "@/lib/plaid-server";
import { getUserHouseholdId } from "@/lib/household-helpers";

export async function POST(req: NextRequest) {
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { item_id } = await req.json();
  if (!item_id) {
    return NextResponse.json({ error: "item_id is required" }, { status: 400 });
  }

  try {
    const tokenDoc = await adminDb.collection("plaid_access_tokens").doc(item_id).get();
    if (!tokenDoc.exists) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const tokenData = tokenDoc.data();

    // Permission check: either the token is owned by this user, or the user
    // is a member of the household that owns the token
    let authorized = tokenData?.user_id === uid;

    if (!authorized) {
      const householdId = await getUserHouseholdId(uid);
      if (householdId) {
        // Token household_id match
        if (tokenData?.household_id === householdId) {
          authorized = true;
        } else if (tokenData?.user_id === "unknown") {
          // Household-shared token (iOS app model)
          const householdDoc = await adminDb.collection("households").doc(householdId).get();
          const memberIds = (householdDoc.data()?.memberUserIDs as string[]) || [];
          if (memberIds.includes(uid)) {
            authorized = true;
          }
        }
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const plaid = getPlaidClient();
    await plaid.itemRemove({ access_token: tokenData?.access_token });
    await adminDb.collection("plaid_access_tokens").doc(item_id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error removing item:", error);
    return NextResponse.json({ error: "Failed to remove item" }, { status: 500 });
  }
}
