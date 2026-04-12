import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, adminDb } from "@/lib/firebase-admin";
import { getPlaidClient } from "@/lib/plaid-server";
import { FieldValue } from "firebase-admin/firestore";
import { getUserHouseholdId } from "@/lib/household-helpers";

export async function POST(req: NextRequest) {
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { public_token } = await req.json();
  if (!public_token) {
    return NextResponse.json({ error: "public_token is required" }, { status: 400 });
  }

  try {
    const plaid = getPlaidClient();
    const exchangeResponse = await plaid.itemPublicTokenExchange({ public_token });
    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Store with household_id so it's shared across household members (matches iOS model)
    const householdId = await getUserHouseholdId(uid);

    await adminDb.collection("plaid_access_tokens").doc(itemId).set({
      access_token: accessToken,
      item_id: itemId,
      user_id: uid,
      household_id: householdId || null,
      created_at: FieldValue.serverTimestamp(),
      is_active: true,
    });

    return NextResponse.json({ item_id: itemId });
  } catch (error: any) {
    console.error("Error exchanging token:", error);
    return NextResponse.json({ error: "Failed to exchange token" }, { status: 500 });
  }
}
