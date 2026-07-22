'use client';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, type Auth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL, type FirebaseStorage } from 'firebase/storage';

let app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _storage: FirebaseStorage | null = null;

/**
 * Lazy-initialize Firebase only when actually needed (e.g. inside a click
 * handler). This avoids "auth/invalid-api-key" failures during Next.js static
 * generation when env vars aren't available at build time.
 */
function init() {
  if (typeof window === 'undefined') return null;
  if (_auth) return _auth;

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'agridirect-9427a.firebaseapp.com',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'agridirect-9427a',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'agridirect-9427a.appspot.com',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '994573510262',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!config.apiKey || !config.appId) {
    console.warn('Firebase not configured — set NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_APP_ID');
    return null;
  }

  app = getApps().length ? getApps()[0] : initializeApp(config as any);
  _auth = getAuth(app);
  _storage = getStorage(app);
  return _auth;
}

export function getFirebaseAuth(): Auth {
  const a = init();
  if (!a) throw new Error('Firebase Auth is not configured. Add your Firebase web config to .env.local.');
  return a;
}

export function getFirebaseStorage(): FirebaseStorage {
  // Ensure Firebase is initialised
  init();
  if (!_storage) throw new Error('Firebase Storage is not configured.');
  return _storage;
}

/**
 * Upload a File to Firebase Storage under `products/` and return the public download URL.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const storage = getFirebaseStorage();
  const path = `products/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export { RecaptchaVerifier, signInWithPhoneNumber };
