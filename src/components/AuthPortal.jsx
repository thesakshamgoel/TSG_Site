import { useEffect, useRef, useState } from 'react'
import { firebaseEnabled } from '../firebase/config'
import { watchUser, signInVisitor, signOutUser, isOwnerUser } from '../firebase/auth'
import { toast } from './Toast'
import './AuthPortal.css'

/**
 * The site's login portal, living in the nav.
 *  • Signed out → a "Sign in" pill that pops the Google account chooser.
 *  • Signed in  → the account's avatar; clicking it opens a small menu with
 *    the account details and Sign out.
 *  • Owner only → the menu also shows "Developer Console" — the console entry
 *    point simply doesn't exist for anyone else.
 * Renders nothing when Firebase isn't configured (local mode has no auth).
 */
// Turn a Firebase auth error code into something a human can act on.
function explainAuthError(e) {
  const code = e?.code || e?.message || ''
  if (/configuration-not-found/.test(code))
    return 'Authentication isn’t enabled on this Firebase project yet. Console → Authentication → Get started, then Sign-in method → enable Google.'
  if (/operation-not-allowed/.test(code))
    return 'Google sign-in isn’t enabled yet. Firebase console → Authentication → Sign-in method → enable Google.'
  if (/unauthorized-domain/.test(code))
    return 'This domain isn’t authorized. Add it in Firebase → Authentication → Settings → Authorized domains.'
  if (/popup-blocked/.test(code))
    return 'Could not open Google sign-in in this browser — please try again.'
  if (/popup-closed-by-user|cancelled-popup-request/.test(code))
    return '' // user closed it on purpose — not an error worth showing
  if (/network-request-failed/.test(code))
    return 'Network error reaching Google — check your connection and retry.'
  if (/invalid-api-key/.test(code))
    return 'Firebase config problem — check the keys in .env.local.'
  return 'Sign-in failed — please try again.'
}

export default function AuthPortal({ onOpenConsole }) {
  const [user, setUser] = useState(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const rootRef = useRef(null)

  useEffect(() => watchUser(setUser), [])

  // redirect-flow round trip: we set a flag right before leaving for Google;
  // when the signed-in user lands back, confirm it (survives the reload)
  useEffect(() => {
    let flag = false
    try {
      flag = sessionStorage.getItem('sg_auth_pending') === '1'
      if (flag) sessionStorage.removeItem('sg_auth_pending')
    } catch {}
    if (flag && user) toast.success('Signed in as ' + (user.displayName || user.email))
  }, [user])

  // close the menu on outside click or Escape
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!firebaseEnabled) return null

  const signIn = async () => {
    setBusy(true)
    setErr('')
    try {
      const resUser = await signInVisitor()
      if (resUser) {
        // popup flow — we have the user right here
        toast.success('Signed in as ' + (resUser.displayName || resUser.email))
      } else {
        // redirect flow — the user arrives after the Google round trip;
        // the flag lets the effect above greet them when they're back
        try {
          sessionStorage.setItem('sg_auth_pending', '1')
        } catch {}
      }
    } catch (e) {
      // surface the reason in the UI — DevTools is locked down in production,
      // so a silent console error would be invisible.
      console.warn('[auth] sign-in failed:', e?.code || e?.message)
      const msg = explainAuthError(e) // '' when the user cancelled on purpose
      setErr(msg)
      if (msg) toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  if (!user) {
    return (
      <div className="authportal">
        <button
          type="button"
          className="authportal__signin"
          onClick={signIn}
          disabled={busy}
          aria-label="Sign in with Google"
        >
          <GoogleMark />
          <span>{busy ? 'Signing in…' : 'Sign in'}</span>
        </button>
        {err && (
          // visual only — the toast (role=alert) is the announced message
          <span className="authportal__signin-err" aria-hidden="true">
            {err}
          </span>
        )}
      </div>
    )
  }

  const owner = isOwnerUser(user)
  const initial = (user.displayName || user.email || '?').trim().charAt(0).toUpperCase()

  return (
    <div className="authportal" ref={rootRef}>
      <button
        type="button"
        className={`authportal__chip ${owner ? 'is-owner' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span className="authportal__initial">{initial}</span>
        )}
      </button>

      {open && (
        <div className="authportal__menu glass" role="menu">
          <div className="authportal__who">
            <span className="authportal__name">{user.displayName || 'Signed in'}</span>
            <span className="authportal__email">{user.email}</span>
            {owner && <span className="authportal__badge">Owner</span>}
          </div>
          {owner && (
            <button
              type="button"
              role="menuitem"
              className="authportal__item"
              onClick={() => {
                setOpen(false)
                onOpenConsole?.()
              }}
            >
              Developer Console
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            className="authportal__item authportal__item--out"
            onClick={() => {
              setOpen(false)
              signOutUser()
              toast.info('Signed out')
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

function GoogleMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}
