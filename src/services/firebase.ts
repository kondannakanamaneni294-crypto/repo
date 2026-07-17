import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  Auth
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase Config with intelligent self-correction for scrambled environment variables
const env = (import.meta as any).env || {};

function getSanitizedConfig() {
  // Start with sensible, verified default fallbacks
  let apiKey = env.VITE_FIREBASE_API_KEY || "AIzaSyB_AXp2a1CTt0h2VCz3SotqrFdyvxU7iJ0";
  let authDomain = env.VITE_FIREBASE_AUTH_DOMAIN || "decision-making-ffc61.firebaseapp.com";
  let projectId = "decision-making-ffc61";
  let storageBucket = "decision-making-ffc61.firebasestorage.app";
  let messagingSenderId = "1055105113942";
  let appId = "1:1055105113942:web:142bebd4465fb9283480f7";

  const rawProjectId = env.VITE_FIREBASE_PROJECT_ID;
  const rawStorageBucket = env.VITE_FIREBASE_STORAGE_BUCKET;
  const rawMessagingSenderId = env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const rawAppId = env.VITE_FIREBASE_APP_ID;

  console.log("Firebase Audit: Inspecting Raw Environment Variables:", {
    rawProjectId,
    rawStorageBucket,
    rawMessagingSenderId,
    rawAppId
  });

  // 1. Resolve Project ID
  if (rawProjectId) {
    if (rawProjectId.endsWith('.firebasestorage.app')) {
      projectId = rawProjectId.replace('.firebasestorage.app', '');
    } else if (rawProjectId.includes('.')) {
      projectId = rawProjectId.split('.')[0];
    } else {
      projectId = rawProjectId;
    }
  }
  
  // 2. Resolve Auth Domain and Storage Bucket from Project ID
  authDomain = `${projectId}.firebaseapp.com`;
  storageBucket = `${projectId}.firebasestorage.app`;

  // 3. Resolve App ID
  if (rawMessagingSenderId && rawMessagingSenderId.startsWith('1:')) {
    appId = rawMessagingSenderId;
  } else if (rawAppId && rawAppId.startsWith('1:')) {
    appId = rawAppId;
  }

  // 4. Resolve Messaging Sender ID
  if (rawStorageBucket && /^\d+$/.test(rawStorageBucket)) {
    messagingSenderId = rawStorageBucket;
  } else if (rawMessagingSenderId && /^\d+$/.test(rawMessagingSenderId)) {
    messagingSenderId = rawMessagingSenderId;
  }

  const resolved = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId
  };

  console.log("Firebase Audit: Self-Corrected & Resolved Config:", resolved);
  return resolved;
}

const firebaseConfig = getSanitizedConfig();

let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.error("Error initializing Firebase App:", error);
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail 
};
