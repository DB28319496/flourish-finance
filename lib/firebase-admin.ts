import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK (server-side only)
if (getApps().length === 0) {
  // Use Application Default Credentials or service account
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  initializeApp(
    serviceAccount
      ? { credential: cert(serviceAccount as ServiceAccount) }
      : { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID }
  );
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();

// Helper to verify Firebase ID token from request
export async function verifyIdToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}
