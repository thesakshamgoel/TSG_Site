import { useEffect, useRef, useState } from 'react'
import './Toast.css'

/**
 * Global toasts — success / info / error feedback for sign-in, the contact
 * and review forms, and anything else that needs a result on screen.
 *
 * Usage (from anywhere, no context needed):
 *   import { toast } from './Toast'
 *   toast.success('Saved') · toast.info('Draft opened') · toast.error('Failed')
 * Mount <ToastViewport /> once (App.jsx).
 *
 * Web & accessibility compliance:
 *  - Each toast is an ARIA live region: role="status" (polite) for
 *    success/info, role="alert" (assertive) for errors, aria-atomic so
 *    screen readers announce the full message when it appears.
 *  - Error toasts receive programmatic focus, so keyboard + screen-reader
 *    users land on the message (WCAG 4.1.3 Focus Order).
 *  - Auto-dismiss pauses while the toast is hovered or focused — nobody
 *    loses a message mid-read (WCAG 2.2.1 Timing Adjustable).
 *  - Every message pairs icon + text; meaning is never colour-only
 *    (WCAG 1.4.1 Use of Colour). Text is high-contrast on the dark panel.
 *  - The entrance animation is disabled under prefers-reduced-motion
 *    (WCAG 2.3.3 Animation from Interactions).
 */

const DURATIONS = { success: 5000, info: 6000, error: 9000 }
const MAX_VISIBLE = 3

let notify = null
let seq = 0

function emit(type, message) {
  if (typeof message !== 'string' || !message.trim()) return
  if (notify) notify({ id: ++seq, type, message: message.trim() })
}

export const toast = {
  success: (m) => emit('success', m),
  info: (m) => emit('info', m),
  error: (m) => emit('error', m),
}

export default function ToastViewport() {
  const [items, setItems] = useState([])
  const timers = useRef(new Map())
  const focusedErrors = useRef(new Set())
  const itemsRef = useRef(items)
  itemsRef.current = items

  const dismiss = (id) => {
    const t = timers.current.get(id)
    if (t) clearTimeout(t)
    timers.current.delete(id)
    setItems((list) => list.filter((i) => i.id !== id))
  }

  // pause the auto-dismiss while hovered / focused (WCAG 2.2.1)
  const pause = (id) => {
    const t = timers.current.get(id)
    if (t) {
      clearTimeout(t)
      timers.current.delete(id)
    }
  }
  const resume = (item) => {
    if (timers.current.has(item.id)) return
    if (!itemsRef.current.some((i) => i.id === item.id)) return
    const t = setTimeout(() => dismiss(item.id), DURATIONS[item.type] || 6000)
    timers.current.set(item.id, t)
  }

  useEffect(() => {
    notify = (item) => {
      setItems((list) => [...list, item].slice(-MAX_VISIBLE))
      const t = setTimeout(() => dismiss(item.id), DURATIONS[item.type] || 6000)
      timers.current.set(item.id, t)
    }
    return () => {
      notify = null
      timers.current.forEach((t) => clearTimeout(t))
      timers.current.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // move focus to the newest error so keyboard + SR users land on it
  useEffect(() => {
    const next = [...items]
      .reverse()
      .find((i) => i.type === 'error' && !focusedErrors.current.has(i.id))
    if (!next) return
    focusedErrors.current.add(next.id)
    requestAnimationFrame(() =>
      document.getElementById(`toast-${next.id}`)?.focus({ preventScroll: true })
    )
  }, [items])

  return (
    <div className="toasts" aria-label="Notifications">
      {items.map((it) => (
        <div
          key={it.id}
          id={`toast-${it.id}`}
          className={`toast toast--${it.type}`}
          role={it.type === 'error' ? 'alert' : 'status'}
          aria-atomic="true"
          tabIndex={it.type === 'error' ? -1 : undefined}
          onMouseEnter={() => pause(it.id)}
          onMouseLeave={() => resume(it)}
          onFocusCapture={() => pause(it.id)}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) resume(it)
          }}
        >
          <span className="toast__icon" aria-hidden="true">
            {it.type === 'success' ? (
              <IconCheck />
            ) : it.type === 'error' ? (
              <IconAlert />
            ) : (
              <IconInfo />
            )}
          </span>
          <span className="toast__msg">{it.message}</span>
          <button
            type="button"
            className="toast__close"
            aria-label={`Dismiss notification: ${it.message}`}
            onClick={() => dismiss(it.id)}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path
                d="M2 2l8 8M10 2l-8 8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}

function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M6.2 10.4l2.5 2.5 5-5.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconAlert() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 5.8v5.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="14.2" r="1.1" fill="currentColor" />
    </svg>
  )
}

function IconInfo() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 9v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="6.3" r="1.1" fill="currentColor" />
    </svg>
  )
}
