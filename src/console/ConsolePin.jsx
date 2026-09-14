import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { firebaseEnabled } from '../firebase/config'
import { signInOwner } from '../firebase/auth'
import './ConsolePin.css'

/**
 * Owner-only gate for the developer console.
 *  • Firebase configured → real Google sign-in, restricted to the owner account.
 *  • Otherwise            → email + passcode access-gating (front-end only).
 * The console just edits site content, so there's nothing dangerous behind it.
 */
export default function ConsolePin({ pin, email, onOk, onClose }) {
  const [emailVal, setEmailVal] = useState('')
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [authErr, setAuthErr] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!firebaseEnabled) inputRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // ── Firebase mode: Google sign-in ──────────────────────────────────────
  const googleSignIn = async () => {
    setBusy(true)
    setAuthErr('')
    try {
      await signInOwner() // owner-auth state in App flips the gate to the console
    } catch (e) {
      setAuthErr(
        e?.message === 'not-owner'
          ? 'That Google account isn’t the owner.'
          : 'Sign-in failed — try again.'
      )
    } finally {
      setBusy(false)
    }
  }

  if (firebaseEnabled) {
    return (
      <div className="pin" onClick={onClose}>
        <motion.div
          className="pin__panel"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        >
          <span className="slate">Restricted</span>
          <h3>Developer Console</h3>
          <p>Owner access only. Sign in with your Google account.</p>
          <button
            type="button"
            className="btn primary pin__google"
            onClick={googleSignIn}
            disabled={busy}
          >
            {busy ? 'Signing in…' : 'Sign in with Google'}
          </button>
          {authErr && (
            <span className="pin__err" role="alert">
              {authErr}
            </span>
          )}
          <div className="pin__actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Fallback mode: email + passcode ────────────────────────────────────
  const submit = (e) => {
    e.preventDefault()
    const emailOk = emailVal.trim().toLowerCase() === (email || '').trim().toLowerCase()
    if (emailOk && value === pin) onOk()
    else {
      setError(true)
      setValue('')
    }
  }

  return (
    <div className="pin" onClick={onClose}>
      <motion.form
        className="pin__panel"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      >
        <span className="slate">Restricted</span>
        <h3>Developer Console</h3>
        <p>Owner access only — enter your email and passcode.</p>
        <input
          ref={inputRef}
          type="email"
          className={`pin__email ${error ? 'is-error' : ''}`}
          value={emailVal}
          onChange={(e) => {
            setEmailVal(e.target.value)
            setError(false)
          }}
          placeholder="Owner email"
          autoComplete="off"
          spellCheck="false"
        />
        <input
          type="password"
          className={error ? 'is-error' : ''}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(false)
          }}
          placeholder="Passcode"
          autoComplete="off"
        />
        {error && (
          <span className="pin__err" role="alert">
            Wrong email or passcode.
          </span>
        )}
        <div className="pin__actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn primary">
            Unlock
          </button>
        </div>
      </motion.form>
    </div>
  )
}
