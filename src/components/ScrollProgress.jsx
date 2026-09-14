import { useEffect, useState } from 'react'
import './ScrollProgress.css'

/**
 * Premium right-side scroll indicator: a vertical track that fills with scroll
 * progress, labelled section nodes you can click to jump, and a live frame
 * read-out. Purely a nav aid — hidden on small screens.
 */
export default function ScrollProgress({ sections, onNavigate }) {
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState(0)

  useEffect(() => {
    let raf = null
    const update = () => {
      raf = null
      // Anchor the fill to the SAME section offsets as the (evenly-spaced) dots
      // so the line reaches a dot exactly when that section becomes active.
      // A plain scrollY/scrollHeight fraction drifts out of sync because the
      // sections aren't equal heights (the About tail is much taller).
      const n = sections.length
      const ref = window.scrollY + window.innerHeight * 0.3
      const tops = sections.map((s) => {
        const el = document.getElementById(s.id)
        return el ? el.offsetTop : 0
      })

      // continuous position along the section list [0 … n-1]
      let seg = 0
      for (let i = 0; i < n - 1; i++) {
        if (ref >= tops[i]) seg = i
      }
      let posIndex = seg
      if (seg < n - 1) {
        const span = tops[seg + 1] - tops[seg]
        const local = span > 0 ? (ref - tops[seg]) / span : 0
        posIndex = seg + Math.max(0, Math.min(1, local))
      }
      setProgress(n > 1 ? posIndex / (n - 1) : 0)

      // nearest section → active dot (use the same reference point)
      let best = 0
      let bestDist = Infinity
      tops.forEach((t, i) => {
        const d = Math.abs(t - ref)
        if (d < bestDist) {
          bestDist = d
          best = i
        }
      })
      setActive(best)
    }
    const onScroll = () => {
      if (raf == null) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [sections])

  return (
    <div className="sprog" aria-hidden="true">
      <div className="sprog__frame timecode">
        {String(active + 1).padStart(2, '0')}
        <span>/{String(sections.length).padStart(2, '0')}</span>
      </div>
      <div className="sprog__track">
        <div className="sprog__fill" style={{ height: `${progress * 100}%` }} />
        {sections.map((s, i) => (
          <button
            key={s.id}
            className={`sprog__node ${i === active ? 'is-on' : ''}`}
            style={{ top: `${(i / (sections.length - 1)) * 100}%` }}
            onClick={() => onNavigate(s.id)}
          >
            <span className="sprog__label">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
