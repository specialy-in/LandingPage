import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
console.log("Firebase App Initialized", firebaseConfig.projectId);

export const auth = getAuth(app);

// Robust Firestore initialization
// Use experimentalForceLongPolling to bypass potential WebSocket blocks (Firewall/Antivirus)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

console.log("[Firebase] Initialized with experimentalForceLongPolling: true");
console.log(`[Firebase] Project ID: ${firebaseConfig.projectId}`);

export const storage = getStorage(app);
