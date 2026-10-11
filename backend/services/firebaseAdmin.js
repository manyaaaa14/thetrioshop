import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export function getFirebaseAdminAuth() {
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!projectId) {
    return null;
  }

  const app = getApps().find((existingApp) => existingApp.name === "[DEFAULT]")
    || initializeApp({ projectId });

  return getAuth(app);
}
