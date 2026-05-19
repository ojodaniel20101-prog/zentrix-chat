// Obsidian Flow Design — Firebase Configuration
// Initializes all Firebase services used by Zentrix Chat

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDRLnXhRtW6XWzfwzgSSAxGm5h39AvRUEg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "zentrix-chat.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "zentrix-chat",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "zentrix-chat.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "318694299710",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:318694299710:web:8b5f5596b5ed211b11596f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-Y0EY34KBRL",
};

// Initialize Firebase app
export const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Firestore
export const db = getFirestore(app);

// Storage
export const storage = getStorage(app);

// Analytics (browser only)
export const analytics =
  typeof window !== "undefined" ? getAnalytics(app) : null;

// FCM Messaging (browser only, requires HTTPS)
export const getMessagingInstance = async () => {
  const supported = await isSupported();
  if (supported) {
    return getMessaging(app);
  }
  return null;
};

export default app;
