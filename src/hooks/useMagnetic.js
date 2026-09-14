import { useRef, useCallback } from 'react'

/**
 * Magnetic hover: the element leans up to `strength`px toward the cursor
 * while hovered, then eases back to rest on leave.
 *
 * Usage:
 *   const magnet = useMagnetic()
 *   <button ref={magnet.ref} onMouseMove={magnet.onMouseMove} onMouseLeave={magnet.onMouseLeave} />
 *
 * @param {number} strength  max translation in px (default 8)
 * @returns {{ ref: object, onMouseMove: function, onMouseLeave: function }}
 */
export function useMagnetic(strength = 8) {
  const ref = useRef(null)

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const onMouseMove = useCallback(
    (e) => {
      const el = ref.current
      if (!el || prefersReduced) return
      const rect = el.getBoundingClientRect()
      // cursor offset from the element's center, normalized to -1..1
      const nx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
      const ny = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
      const dx = Math.max(-1, Math.min(1, nx)) * strength
      const dy = Math.max(-1, Math.min(1, ny)) * strength
      el.style.transition = 'transform 0.15s ease-out'
      el.style.transform = `translate(${dx}px, ${dy}px)`
    },
    [strength, prefersReduced]
  )

  const onMouseLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.transition = 'transform 0.3s ease-out'
    el.style.transform = 'translate(0px, 0px)'
  }, [])

  return { ref, onMouseMove, onMouseLeave }
}

export default useMagnetic
