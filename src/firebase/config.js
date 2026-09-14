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
 *   1. VITE_FIREBASE_DISABLED=true (see .env.test) → hard local mode, used by
 *      the e2e suite. Anything else, Firebase is on.
 *   2. VITE_FIREBASE_* env vars, when set to a NON-EMPTY value → they override
 *      the built-in config.
 *   3. The built-in config below (project sg-website-62a7a).
 *
 * Empty-string env vars are treated the same as unset. This matters in the
 * real world: a host like Vercel with VITE_FIREBASE_* defined but left blank
 * used to bake '' into the bundle and silently kill the Sign in button.
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

// `== null || ''` on purpose: blank host env vars (a common Vercel setup
// slip) must NOT silently kill auth — unset and blank both fall back to the
// built-in config. Test mode uses VITE_FIREBASE_DISABLED=true instead.
const pick = (envValue, builtin) =>
  envValue == null || envValue === '' ? builtin : envValue

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

// Explicit escape hatch for the e2e suite / headless CI (see .env.test).
const FORCED_OFF = import.meta.env.VITE_FIREBASE_DISABLED === 'true'

export const firebaseEnabled = !FORCED_OFF && !!(cfg.apiKey && cfg.projectId && cfg.appId)

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
