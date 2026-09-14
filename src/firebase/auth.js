/**
 * Owner authentication via Google sign-in. Only the OWNER_EMAIL account is let
 * through — anyone else is signed straight back out. When Firebase isn't
 * configured, these are inert and the console falls back to the passcode gate.
 */
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth, OWNER_EMAIL, firebaseEnabled } from './config'

/**
 * Google sign-in that works in every context.
 * Prefer the popup (stays on the page); when the environment blocks popups —
 * in-app browsers, embedded webviews, strict popup settings, some mobiles —
 * fall back to the redirect flow, which also auto-authorizes the current
 * origin (so localhost / 127.0.0.1 never trips `auth/unauthorized-domain`).
 */
async function googleSignInFlow(provider) {
  try {
    return await signInWithPopup(auth, provider)
  } catch (err) {
    if (
      err?.code === 'auth/popup-blocked' ||
      err?.code === 'auth/cancelled-popup-request'
    ) {
      // the browser won't open a popup — let the tab itself go to Google
      return signInWithRedirect(auth, provider)
    }
    throw err
  }
}

const isOwner = (user) =>
  !!user && typeof user.email === 'string' && user.email.trim().toLowerCase() === OWNER_EMAIL

/** True when `user` (any signed-in account) is the owner account. */
export const isOwnerUser = isOwner

/** Subscribe to owner-auth state. Calls cb(user|null). Returns an unsubscribe. */
export function watchOwner(cb) {
  if (!firebaseEnabled || !auth) {
    cb(null)
    return () => {}
  }
  return onAuthStateChanged(auth, (user) => cb(isOwner(user) ? user : null))
}

/** Pop the Google sign-in. Rejects (and signs out) if it isn't the owner. */
export async function signInOwner() {
  if (!firebaseEnabled || !auth) throw new Error('firebase-disabled')
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const res = await googleSignInFlow(provider)
  if (res && !isOwner(res.user)) {
    // popup path: a non-owner account was chosen — sign straight back out
    await fbSignOut(auth)
    throw new Error('not-owner')
  }
  if (!res) {
    // redirect path: the account only exists after the round trip — enforce
    // the owner rule once, when they're back
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return
      unsub()
      if (!isOwner(u)) fbSignOut(auth).catch(() => {})
    })
  }
  return res ? res.user : null
}

export function signOutOwner() {
  if (firebaseEnabled && auth) return fbSignOut(auth)
  return Promise.resolve()
}

// ── Visitor login ───────────────────────────────────────────────────────────
// Any Google account may sign in as a visitor. Viewing the site never needs an
// account; signing in unlocks the contact forms and direct contact details.

/** Subscribe to the signed-in visitor (any account). cb(user|null). */
export function watchUser(cb) {
  if (!firebaseEnabled || !auth) {
    cb(null)
    return () => {}
  }
  return onAuthStateChanged(auth, (user) => cb(user || null))
}

/** Pop the Google sign-in for a visitor — no owner restriction. */
export async function signInVisitor() {
  if (!firebaseEnabled || !auth) throw new Error('firebase-disabled')
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  // popup when possible, redirect when the browser blocks popups
  const res = await googleSignInFlow(provider)
  // redirect flow resolves null — the signed-in user arrives back via
  // onAuthStateChanged (watchUser) after the round trip
  return res ? res.user : null
}

/** Sign the current visitor out. */
export const signOutUser = signOutOwner
