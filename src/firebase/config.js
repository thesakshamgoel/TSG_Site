/**
 * Firebase bootstrap.
 *
 * The web config below is PUBLIC by design: a Firebase web apiKey is a client
 * identifier, not a secret — it ships in every bundle visitors download, and
 * the real security comes from the Firestore rules + owner-email gate in
 * `firestore.rules`.
 *
 * Baking the project config in as a default means login + shared content work
 * on ANY host (Vercel, Netlify, GitHub Pages…) with zero environment setup —
 * so the "Sign in" button never disappears just because a host is missing env
 * vars.
 *
 * Precedence:
 *   1. VITE_FIREBASE_* env vars, when set to a non-empty value → they override.
 *   2. The built-in config below (project sg-website-62a7a).
 *   3. A value set to an EMPTY STRING (see .env.test) wins with '' →
 *      firebaseEnabled = false → local mode (used by the e2e suite).
 */
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const BUILTIN = {
  apiKey: 'AIzaSyAKD1h-mi4Yem_oXiw4CpdCOXfs7abIANU',
  authDomain: 'sg-website-62a7a.firebaseapp.com',
  projectId: 'sg-website-62a7a',
  storageBucket: 'sg-website-62a7a.firebasestorage.app',
  messagingSenderId: '360166898853',
  appId: '1:360166898853:web:6814ee1d7661aae43ce14c',
}

// `== null` on purpose (not `!v`): an empty string deliberately disables
// Firebase (test mode), while an *unset* variable falls back to built-in.
const pick = (envValue, builtin) => (envValue == null ? builtin : envValue)

const cfg = {
  apiKey: pick(import.meta.env.VITE_FIREBASE_API_KEY, BUILTIN.apiKey),
  authDomain: pick(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, BUILTIN.authDomain),
  projectId: pick(import.meta.env.VITE_FIREBASE_PROJECT_ID, BUILTIN.projectId),
  storageBucket: pick(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, BUILTIN.storageBucket),
  messagingSenderId: pick(
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    BUILTIN.messagingSenderId
  ),
  appId: pick(import.meta.env.VITE_FIREBASE_APP_ID, BUILTIN.appId),
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
