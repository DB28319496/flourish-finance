/**
 * Firestore helpers — uniform API for reading/writing user data.
 * All operations silently no-op if Firebase isn't configured (e.g., unauthenticated).
 *
 * Data layout:
 *   users/{uid}/settings/budget_targets    — { [categoryKey]: number }
 *   users/{uid}/settings/user              — UserSettings
 *   users/{uid}/goals/{goalId}             — Goal
 *   users/{uid}/transaction_edits/{txId}   — TransactionEdit
 *   users/{uid}/snapshots/{YYYY-MM-DD}     — { netWorth, assets, liabilities }
 */

export async function getDoc<T>(uid: string, path: string[]): Promise<T | null> {
  try {
    const { doc, getDoc: fbGetDoc } = await import("firebase/firestore");
    const { db } = await import("./firebase");
    if (!db) return null;
    const snap = await fbGetDoc(doc(db, "users", uid, ...path));
    return snap.exists() ? (snap.data() as T) : null;
  } catch (err) {
    console.warn(`Failed to read ${path.join("/")}:`, err);
    return null;
  }
}

export async function setDoc(uid: string, path: string[], data: Record<string, unknown>, merge = true): Promise<boolean> {
  try {
    const { doc, setDoc: fbSetDoc } = await import("firebase/firestore");
    const { db } = await import("./firebase");
    if (!db) return false;
    await fbSetDoc(doc(db, "users", uid, ...path), data, { merge });
    return true;
  } catch (err) {
    console.error(`Failed to write ${path.join("/")}:`, err);
    return false;
  }
}

export async function deleteDoc(uid: string, path: string[]): Promise<boolean> {
  try {
    const { doc, deleteDoc: fbDeleteDoc } = await import("firebase/firestore");
    const { db } = await import("./firebase");
    if (!db) return false;
    await fbDeleteDoc(doc(db, "users", uid, ...path));
    return true;
  } catch (err) {
    console.error(`Failed to delete ${path.join("/")}:`, err);
    return false;
  }
}

export async function listCollection<T>(uid: string, collectionName: string): Promise<(T & { id: string })[]> {
  try {
    const { collection, getDocs } = await import("firebase/firestore");
    const { db } = await import("./firebase");
    if (!db) return [];
    const snap = await getDocs(collection(db, "users", uid, collectionName));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
  } catch (err) {
    console.warn(`Failed to list ${collectionName}:`, err);
    return [];
  }
}
