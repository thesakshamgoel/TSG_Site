import { useEffect } from 'react'
import './ScreenGuard.css'

/**
 * Soft content deterrence only.
 *
 * Deliberately NOT doing (removed on the owner's request — opening the
 * developer console used to blank the whole screen):
 *   • no screen blanking on window blur / tab hidden / PrintScreen
 *   • no DevTools detection, no page lockdown, no debugger trap
 *   • no blocking of F12 / Ctrl+Shift+I|J|C — the console is free to open
 *   • no blanking of print / save-as-PDF
 *
 * Kept (mild, and they never touch the visible page):
 *   • image drag-save blocked (pointer still reaches the clickable card)
 *   • right-click context menu suppressed (no "Save image as…")
 *   • copied/cut text leaves marked, not as site content (forms stay clean)
 *   • Ctrl/Cmd+S (save page) and Ctrl/Cmd+U (view source) suppressed
 *
 * Automation (navigator.webdriver — the e2e runner) bypasses the guard.
 */

const isBot = typeof navigator !== 'undefined' && navigator.webdriver

export default function ScreenGuard() {
  useEffect(() => {
    if (isBot) return
    document.body.classList.add('screen-guard')

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
      return (e.ctrlKey || e.metaKey) && !e.shiftKey && ['s', 'u'].includes(key)
    }
    const onKeyDown = (e) => {
      if (isBlocked(e)) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    window.addEventListener('contextmenu', onContextMenu)
    window.addEventListener('dragstart', onDragStart)
    window.addEventListener('copy', onCopy, true)
    window.addEventListener('cut', onCopy, true)
    window.addEventListener('keydown', onKeyDown, true)

    return () => {
      document.body.classList.remove('screen-guard')
      window.removeEventListener('contextmenu', onContextMenu)
      window.removeEventListener('dragstart', onDragStart)
      window.removeEventListener('copy', onCopy, true)
      window.removeEventListener('cut', onCopy, true)
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [])

  return null
}
