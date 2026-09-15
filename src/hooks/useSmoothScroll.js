import { useEffect, useRef, useCallback } from 'react'

/**
 * Full-page section scrolling: one wheel gesture / arrow key jumps straight to
 * the next section — no gaps, no free-scroll dead zone. The last section
 * ("about") is a tall free-scroll tail so its content + footer stay reachable.
 *
 * @param {string[]} snapIds  full-screen sections that hard-snap, in order
 * @param {string}   tailId   id where free scrolling resumes (tall content)
 * @param {boolean}  ready    start after the loader is gone
 * @param {boolean}  paused   suspend (an overlay is open)
 */
export function useSmoothScroll(snapIds, tailId, ready, paused) {
  const indexRef = useRef(0) // 0..snapIds.length (== length means "in tail")
  const animatingRef = useRef(false)
  const rafRef = useRef(null)

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const offsetOf = (id) => {
    const el = document.getElementById(id)
    return el ? el.offsetTop : 0
  }

  const animateTo = useCallback((targetY, dur = 1000) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const startY = window.scrollY
    const dist = targetY - startY
    if (Math.abs(dist) < 2) return
    animatingRef.current = true
    let startT = null
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
    const step = (ts) => {
      if (startT == null) startT = ts
      const t = Math.min((ts - startT) / dur, 1)
      window.scrollTo(0, startY + dist * ease(t))
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        animatingRef.current = false
        rafRef.current = null
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }, [])

  const goToIndex = useCallback(
    (i) => {
      const max = snapIds.length // tail index
      const clamped = Math.max(0, Math.min(i, max))
      indexRef.current = clamped
      const id = clamped >= snapIds.length ? tailId : snapIds[clamped]
      animateTo(offsetOf(id))
    },
    [snapIds, tailId, animateTo]
  )

  const scrollToId = useCallback(
    (id) => {
      const idx = id === 'top' ? 0 : snapIds.indexOf(id)
      if (idx >= 0) goToIndex(idx)
      else if (id === tailId) goToIndex(snapIds.length)
      else animateTo(offsetOf(id))
    },
    [snapIds, tailId, goToIndex, animateTo]
  )

  // ── wheel / keys / touch drive the section index ──────────────────────────
  useEffect(() => {
    if (!ready || prefersReduced) return

    const inTail = () => indexRef.current >= snapIds.length
    const atTailTop = () =>
      window.scrollY <= offsetOf(tailId) + window.innerHeight * 0.15

    let wheelCooldown = 0

    const onWheel = (e) => {
      if (paused) return
      const dir = e.deltaY > 0 ? 1 : -1

      // Free-scroll inside the tail section (about + footer), except when at the
      // very top scrolling up → snap back to the last full-screen section.
      if (inTail()) {
        if (dir < 0 && atTailTop() && !animatingRef.current) {
          e.preventDefault()
          goToIndex(snapIds.length - 1)
          wheelCooldown = performance.now() + 900
        }
        return // allow native scroll through the tail
      }

      e.preventDefault()
      if (animatingRef.current || performance.now() < wheelCooldown) return
      if (Math.abs(e.deltaY) < 8) return
      goToIndex(indexRef.current + dir)
      wheelCooldown = performance.now() + 900
    }

    const onKey = (e) => {
      if (paused) return
      const down = ['ArrowDown', 'PageDown', ' '].includes(e.key)
      const up = ['ArrowUp', 'PageUp'].includes(e.key)
      if (!down && !up) return
      if (inTail() && !(up && atTailTop())) return // let tail scroll freely
      e.preventDefault()
      if (animatingRef.current) return
      goToIndex(indexRef.current + (down ? 1 : -1))
    }

    // Mobile (site breakpoint ≤720px, same as the nav / tab bar): no section
    // latching. Touch swipes must scroll natively and freely — the swipe-to-
    // snap below felt like the page was locking to each screen. Checked live
    // (not once at mount) so it also covers rotate / zoom across the break.
    const isMobile = () =>
      window.matchMedia && window.matchMedia('(max-width: 720px)').matches

    let touchY = null
    const onTouchStart = (e) => (touchY = e.touches[0].clientY)
    const onTouchEnd = (e) => {
      if (isMobile() || paused || touchY == null) return
      const dy = touchY - e.changedTouches[0].clientY
      if (Math.abs(dy) < 45) return
      const dir = dy > 0 ? 1 : -1
      if (inTail() && !(dir < 0 && atTailTop())) return
      if (animatingRef.current) return
      goToIndex(indexRef.current + dir)
      touchY = null
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [ready, paused, prefersReduced, snapIds, tailId, goToIndex])

  return { scrollToId, disabled: prefersReduced, indexRef }
}
