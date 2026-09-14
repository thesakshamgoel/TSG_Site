import { useEffect, useRef, useState } from 'react'
import './Cursor.css'

/**
 * Custom camera cursor + a soft glow that follows the pointer so the whole
 * site reacts to where the mouse is. Disabled on touch / coarse pointers and
 * when the user prefers reduced motion (falls back to the native cursor).
 */
export default function Cursor() {
  const dotRef = useRef(null)
  const glowRef = useRef(null)
  const [enabled, setEnabled] = useState(false)
  const [hot, setHot] = useState(false) // over an interactive element

  useEffect(() => {
    const fine =
      window.matchMedia &&
      window.matchMedia('(pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine) return
    setEnabled(true)
    document.body.classList.add('has-custom-cursor')

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const pos = { ...target }
    const glow = { ...target }

    const onMove = (e) => {
      target.x = e.clientX
      target.y = e.clientY
      // expose pointer position to the whole page for ambient glow + parallax
      document.documentElement.style.setProperty('--px', `${e.clientX}px`)
      document.documentElement.style.setProperty('--py', `${e.clientY}px`)
      document.documentElement.style.setProperty(
        '--pnx',
        `${(e.clientX / window.innerWidth - 0.5) * 2}`
      )
      document.documentElement.style.setProperty(
        '--pny',
        `${(e.clientY / window.innerHeight - 0.5) * 2}`
      )

      const interactive = e.target.closest(
        'a, button, [role="button"], input, select, textarea, .card, .workcard'
      )
      setHot(!!interactive)
    }

    let raf
    const loop = () => {
      pos.x += (target.x - pos.x) * 0.28
      pos.y += (target.y - pos.y) * 0.28
      glow.x += (target.x - glow.x) * 0.12
      glow.y += (target.y - glow.y) * 0.12
      if (dotRef.current)
        // anchor the pointer hotspot on the red REC dot (rendered at 35,15
        // inside the 60×40 camera svg), not the camera's geometric centre
        dotRef.current.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-35px, -15px)`
      if (glowRef.current)
        glowRef.current.style.transform = `translate(${glow.x}px, ${glow.y}px) translate(-50%, -50%)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const onDown = () => dotRef.current?.classList.add('is-down')
    const onUp = () => dotRef.current?.classList.remove('is-down')
    const onLeave = () => dotRef.current?.classList.add('is-hidden')
    const onEnter = () => dotRef.current?.classList.remove('is-hidden')

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)

    return () => {
      cancelAnimationFrame(raf)
      document.body.classList.remove('has-custom-cursor')
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
    }
  }, [])

  if (!enabled) return null

  return (
    <>
      <div ref={glowRef} className="cursor-glow" aria-hidden="true" />
      <div
        ref={dotRef}
        className={`cursor-cam ${hot ? 'is-hot' : ''}`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 48 32" width="60" height="40">
          <rect x="1" y="7" width="34" height="22" rx="4" fill="none"
            stroke="currentColor" strokeWidth="2.4" />
          <path d="M35 14l11-6v16l-11-6z" fill="none" stroke="currentColor"
            strokeWidth="2.4" strokeLinejoin="round" />
          <circle cx="14" cy="18" r="6" fill="none" stroke="currentColor"
            strokeWidth="2.4" />
          <circle cx="14" cy="18" r="1.8" fill="currentColor" />
          <rect x="7" y="3" width="8" height="5" rx="1.5" fill="currentColor" />
          <circle className="cursor-rec" cx="28" cy="12" r="2" fill="#ff4444" />
        </svg>
      </div>
    </>
  )
}
