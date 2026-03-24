import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

let app: FirebaseApp | null = null;
let analyticsReady = false;

function initAnalyticsIfPossible(firebaseApp: FirebaseApp) {
  if (analyticsReady || typeof window === "undefined") return;
  const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;
  if (!measurementId) return;
  try {
    getAnalytics(firebaseApp);
    analyticsReady = true;
  } catch {
    /* Analytics unavailable in some environments (e.g. SSR, blocked cookies) */
  }
}

export function isFirebaseConfigured(): boolean {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  return Boolean(apiKey && projectId);
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;
  if (!app) {
    const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;
    app = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      ...(measurementId ? { measurementId } : {}),
    });
    initAnalyticsIfPossible(app);
  }
  return app;
}

export function getAuthInstance() {
  const a = getFirebaseApp();
  if (!a) return null;
  return getAuth(a);
}

export function getDb() {
  const a = getFirebaseApp();
  if (!a) return null;
  return getFirestore(a);
}
