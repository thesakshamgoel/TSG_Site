/**
 * Firebase bootstrap. Everything here is OPTIONAL: if the VITE_FIREBASE_* env
 * vars aren't set, `firebaseEnabled` is false and the whole app quietly falls
 * back to its localStorage/seed behaviour — so the site works with or without a
 * backend. Fill in .env (see .env.example) to switch the real backend on.
 */
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseEnabled = !!(cfg.apiKey && cfg.projectId && cfg.appId)

// The one account allowed into the developer console.
export const OWNER_EMAIL = (
  import.meta.env.VITE_OWNER_EMAIL || 'thesakshamgoel@gmail.com'
).trim().toLowerCase()

let auth = null
let db = null

if (firebaseEnabled) {
  try {
    const app = initializeApp(cfg)
    auth = getAuth(app)
    db = getFirestore(app)
  } catch (err) {
    // never let a misconfig take the whole site down — fall back to local mode
    console.warn('[firebase] init failed, running in local mode:', err?.message)
  }
}

export { auth, db }
