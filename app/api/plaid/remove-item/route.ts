import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, adminDb } from "@/lib/firebase-admin";
import { getPlaidClient } from "@/lib/plaid-server";

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
    if (tokenData?.user_id !== uid) {
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
