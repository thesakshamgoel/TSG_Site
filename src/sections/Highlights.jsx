import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { thumbHiFor, thumbFallbackFor } from '../data/media'
import { useImgFallback } from '../hooks/useImgFallback'
import './Highlights.css'

const INTERVAL = 5200

/**
 * Home-page "highlighted work" — a cinematic 3-slide auto-advancing reel.
 * `projects` is the already-curated featured set (chosen in the console, with a
 * sensible fallback), so it renders exactly those in order.
 */
export default function Highlights({ projects, onOpenProject }) {
  const slides = projects || []
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef(null)

  const go = useCallback(
    (n) => setI((prev) => (n + slides.length) % slides.length),
    [slides.length]
  )

  useEffect(() => {
    if (paused || slides.length < 2) return
    timer.current = setTimeout(() => go(i + 1), INTERVAL)
    return () => clearTimeout(timer.current)
  }, [i, paused, go, slides.length])

  const s = slides[i] || null
  const thumb = useImgFallback(s && thumbHiFor(s), s && thumbFallbackFor(s), s?.id)

  if (!slides.length) return null

  return (
    <section
      className="hl section"
      id="highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container">
        <div className="hl__head">
          <span className="slate">Featured Reel</span>
          <h2 className="section-title">
            Highlighted <span className="gradient-text">work.</span>
          </h2>
        </div>

        <div className="hl__stage">
          <span className="perf-row hl__perf" aria-hidden="true" />
          <button className="hl__frame" onClick={() => onOpenProject(s)}>
            <AnimatePresence mode="wait">
              {!thumb.broken ? (
                <motion.img
                  key={s.id}
                  src={thumb.src}
                  alt={s.title}
                  onError={thumb.onError}
                  initial={{ opacity: 0, scale: 1.06 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                />
              ) : (
                <motion.div
                  key={s.id + '-ph'}
                  className="hl__ph"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span>{s.title}</span>
                </motion.div>
              )}
            </AnimatePresence>
            <span className="hl__shade" />
            <span className="hl__play" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="30" height="30">
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
            </span>

            <AnimatePresence mode="wait">
              <motion.div
                key={s.id + '-meta'}
                className="hl__meta"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5 }}
              >
                <div className="hl__tags">
                  {s.award && (
                    <span className="hl__award">★ Award-Winning</span>
                  )}
                  {(s.tags || []).map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
                <h3 className="hl__title">{s.title}</h3>
                <p className="hl__role">{s.role}</p>
              </motion.div>
            </AnimatePresence>
          </button>
          <span className="perf-row hl__perf" aria-hidden="true" />
        </div>

        <div className="hl__controls">
          <button className="hl__arrow" onClick={() => go(i - 1)} aria-label="Previous">
            ←
          </button>
          <div className="hl__dots">
            {slides.map((sl, n) => (
              <button
                key={sl.id}
                className={`hl__dot ${n === i ? 'is-on' : ''}`}
                onClick={() => setI(n)}
                aria-label={`Slide ${n + 1}`}
              >
                <span
                  className="hl__dot-fill"
                  style={{ animationPlayState: n === i && !paused ? 'running' : 'paused' }}
                />
              </button>
            ))}
          </div>
          <button className="hl__arrow" onClick={() => go(i + 1)} aria-label="Next">
            →
          </button>
        </div>
      </div>
    </section>
  )
}
