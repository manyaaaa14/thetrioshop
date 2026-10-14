import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export function getFirebaseAdminAuth() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();

  if (!projectId) {
    return null;
  }

  const app = getApps().find((existingApp) => existingApp.options.projectId === projectId)
    || initializeApp({ projectId }, `firebase-auth-${projectId}`);

  return getAuth(app);
}
