/**
 * Firestore-backed site content. A single document (site/content) holds every
 * editable thing — the same shape the localStorage store already uses, plus the
 * new curation fields. Public read, owner-only write (enforced by security
 * rules; see firestore.rules). Submitted reviews are appended here too.
 */
import { doc, onSnapshot, setDoc, arrayUnion } from 'firebase/firestore'
import { db, firebaseEnabled } from './config'

const contentRef = () => doc(db, 'site', 'content')

/** Live-subscribe to the content doc. cb(data|null). Returns unsubscribe. */
export function subscribeContent(cb) {
  if (!firebaseEnabled || !db) {
    cb(null)
    return () => {}
  }
  return onSnapshot(
    contentRef(),
    (snap) => cb(snap.exists() ? snap.data() : {}),
    (err) => {
      console.warn('[firebase] content subscribe failed:', err?.message)
      cb(null)
    }
  )
}

/** Owner-only: merge a patch into the content doc. */
export async function saveContent(patch) {
  if (!firebaseEnabled || !db) throw new Error('firebase-disabled')
  await setDoc(contentRef(), patch, { merge: true })
}

/** Public: append a submitted review (used by the review form). */
export async function appendReview(review) {
  if (!firebaseEnabled || !db) throw new Error('firebase-disabled')
  await setDoc(contentRef(), { reviewsAdded: arrayUnion(review) }, { merge: true })
}
