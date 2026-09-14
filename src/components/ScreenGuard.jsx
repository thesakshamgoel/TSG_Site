import { useEffect, useState } from 'react'
import './ScreenGuard.css'

/**
 * Screenshot / screen-capture / DevTools deterrence.
 *
 * IMPORTANT: no web page can truly *prevent* a screenshot — OS capture tools
 * (Win+Shift+S, macOS Cmd+Shift+4, phone cameras) run outside the browser's
 * control. Netflix/Prime get black screenshots only for the <video> pixels via
 * hardware DRM (Widevine/EME) — that path doesn't exist for regular pages.
 * This layer blocks every vector a browser exposes and blanks the screen the
 * moment capture is likely:
 *   • right-click / context menu (no "Save image as")
 *   • Save / Print / View-source / DevTools shortcuts
 *   • image dragging + text selection + copy-to-clipboard (forms stay usable)
 *   • blanks the page the instant the window loses focus or the tab is hidden
 *   • clears the clipboard on PrtScn, blanks any print / save-as-PDF
 *   • detects DevTools opened from the browser menu (docked resize + console
 *     bait) → locks the page down until they're closed; in production the
 *     lockdown also runs a debugger trap so the DOM can't be picked apart
 *
 * Automation (navigator.webdriver — the e2e runner) bypasses the guard so the
 * test suite can exercise the real UI.
 */

const isBot = typeof navigator !== 'undefined' && navigator.webdriver

export default function ScreenGuard() {
  const [obscured, setObscured] = useState(false)
  const [lockdown, setLockdown] = useState(false)

  // ── capture deterrence (existing vectors) ─────────────────────────────────
  useEffect(() => {
    document.body.classList.add('screen-guard')
    let flashTimer

    const onContextMenu = (e) => e.preventDefault()
    const onDragStart = (e) => {
      if (e.target?.tagName === 'IMG') e.preventDefault()
    }

    const inField = (t) =>
      t && (/^(input|textarea|select)$/i.test(t.tagName) || t.isContentEditable)
    const onCopy = (e) => {
      if (inField(e.target)) return
      // whatever was grabbed leaves marked, not with site content
      e.clipboardData?.setData('text/plain', '© Saksham Goel — content protected')
      e.preventDefault()
    }

    const isBlocked = (e) => {
      const key = (e.key || '').toLowerCase()
      if (e.key === 'PrintScreen') return true
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && ['s', 'p', 'u'].includes(key)) return true
      if (e.key === 'F12') return true
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c', 'k'].includes(key)) return true
      // macOS capture combos (the OS usually intercepts first, but best-effort)
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(key)) return true
      return false
    }
    const onKeyDown = (e) => {
      // keep the site's own console shortcut working (Ctrl/Cmd+Shift+K opens it)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key || '').toLowerCase() === 'k') return
      if (isBlocked(e)) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    const onKeyUp = (e) => {
      if (e.key === 'PrintScreen') {
        // overwrite a full-screen clipboard grab, then flash the veil
        navigator.clipboard?.writeText('').catch(() => {})
        setObscured(true)
        clearTimeout(flashTimer)
        flashTimer = setTimeout(() => setObscured(false), 1400)
      }
    }

    // Window "blur" fires both when the user switches away AND when focus moves
    // into an embedded video iframe (clicking/playing a YouTube embed). Only the
    // former should blank the screen — otherwise the veil covers the video and
    // it becomes unwatchable. If focus landed on an in-page <iframe>, ignore it;
    // a real tab-switch/minimise is still caught by visibilitychange below.
    const onHide = () => {
      if (document.activeElement?.tagName === 'IFRAME') return
      setObscured(true)
      // some browsers set activeElement to the iframe a tick AFTER blur — if
      // that's what happened, undo the veil so the video stays watchable
      setTimeout(() => {
        if (document.activeElement?.tagName === 'IFRAME') setObscured(false)
      }, 60)
    }
    const onShow = () => setObscured(false)
    const onVisibility = () => setObscured(document.visibilityState === 'hidden')

    window.addEventListener('contextmenu', onContextMenu)
    window.addEventListener('dragstart', onDragStart)
    window.addEventListener('copy', onCopy, true)
    window.addEventListener('cut', onCopy, true)
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', onKeyUp, true)
    window.addEventListener('blur', onHide)
    window.addEventListener('focus', onShow)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      document.body.classList.remove('screen-guard')
      window.removeEventListener('contextmenu', onContextMenu)
      window.removeEventListener('dragstart', onDragStart)
      window.removeEventListener('copy', onCopy, true)
      window.removeEventListener('cut', onCopy, true)
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', onKeyUp, true)
      window.removeEventListener('blur', onHide)
      window.removeEventListener('focus', onShow)
      document.removeEventListener('visibilitychange', onVisibility)
      clearTimeout(flashTimer)
    }
  }, [])

  // ── DevTools detection (menu-opened — shortcuts are already blocked) ──────
  // Production only: locking the page when DevTools opens would also fight the
  // owner debugging on the dev server, so this whole layer is off in dev.
  useEffect(() => {
    if (isBot || !import.meta.env.PROD) return

    // 1) console bait: DevTools renders logged objects lazily, firing this
    //    getter only while a console is actually open.
    let lastPing = 0
    const bait = Object.defineProperty(new Image(), 'id', {
      get() {
        lastPing = Date.now()
        return ''
      },
    })

    // 2) docked-panel heuristic: the gap between the OS window and the
    //    viewport jumping well past its load-time baseline means a dock
    //    appeared. Baselined so browser zoom / bookmark bars don't false-fire.
    const gap = () =>
      Math.max(
        window.outerWidth - window.innerWidth,
        window.outerHeight - window.innerHeight
      )
    const baseline = gap()

    let warned = false
    const timer = setInterval(() => {
      console.debug(bait)
      const open = Date.now() - lastPing < 2600 || gap() - baseline > 220
      setLockdown((prev) => {
        if (open && !prev && !warned) {
          warned = true
          console.clear()
          console.log(
            '%c⛔ This portfolio is protected.',
            'color:#e9b872;font-size:20px;font-weight:700'
          )
          console.log(
            '%cAll work shown here is © Saksham Goel. Close the developer tools to continue.',
            'color:#aaa;font-size:13px'
          )
        }
        return open
      })
      // production only: while locked down, stall any DOM poking
      if (open && import.meta.env.PROD) {
        try {
          // eslint-disable-next-line no-debugger
          debugger
        } catch {
          /* ignore */
        }
      }
    }, 1200)

    return () => clearInterval(timer)
  }, [])

  const on = obscured || lockdown
  return (
    <div className={`sguard ${on ? 'is-on' : ''}`} aria-hidden="true">
      <div className="sguard__msg">
        <span className="rec">● Protected</span>
        <p>
          {lockdown
            ? 'Close the developer tools to continue viewing.'
            : 'Screen capture is disabled on this site.'}
        </p>
      </div>
    </div>
  )
}
