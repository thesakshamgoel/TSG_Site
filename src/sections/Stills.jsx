import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import './Stills.css'

const INTERVAL = 4800

/**
 * "Latest Stills" — a full-bleed cinematic slideshow (up to 5 frames), larger
 * than the featured reel. Click a frame to view it full-size in the lightbox.
 * Frames load from public/stills/still-N.jpg; missing files show an elegant
 * empty-frame placeholder until you drop the images in.
 */
export default function Stills({ stills, onOpenImage }) {
  const slides = (stills || []).slice(0, 5)
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const [broken, setBroken] = useState({})
  const timer = useRef(null)

  const go = useCallback(
    (n) => setI((p) => (n + slides.length) % slides.length),
    [slides.length]
  )

  useEffect(() => {
    if (paused || slides.length < 2) return
    timer.current = setTimeout(() => go(i + 1), INTERVAL)
    return () => clearTimeout(timer.current)
  }, [i, paused, go, slides.length])

  if (!slides.length) return null
  const s = slides[i]
  const isBroken = broken[s.id]

  return (
    <section
      className="stills section"
      id="stills"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container stills__head">
        <span className="slate">Latest Stills</span>
        <h2 className="section-title">
          Frames from <span className="gradient-text">the field.</span>
        </h2>
      </div>

      <div className="stills__stage">
        <span className="perf-row stills__perf" aria-hidden="true" />
        <button
          className="stills__frame"
          onClick={() =>
            !isBroken &&
            onOpenImage({ title: s.title, image: s.image, mediaType: 'image' })
          }
          aria-label={`View ${s.title}`}
        >
          <AnimatePresence mode="wait">
            {isBroken ? (
              <motion.div
                key={s.id + '-ph'}
                className="stills__ph"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="stills__ph-num">{String(i + 1).padStart(2, '0')}</span>
                <span>Drop this still at</span>
                <span className="timecode">public{s.image}</span>
              </motion.div>
            ) : (
              <motion.img
                key={s.id}
                src={s.image}
                alt={s.title}
                onError={() => setBroken((b) => ({ ...b, [s.id]: true }))}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
          </AnimatePresence>

          <span className="stills__shade" aria-hidden="true" />
          <span className="stills__counter timecode">
            STILL {String(i + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </span>
          {!isBroken && <span className="stills__zoom">⛶ View</span>}
        </button>
        <span className="perf-row stills__perf" aria-hidden="true" />
      </div>

      <div className="stills__controls">
        <button className="stills__arrow" onClick={() => go(i - 1)} aria-label="Previous still">
          ←
        </button>
        <div className="stills__dots">
          {slides.map((sl, n) => (
            <button
              key={sl.id}
              className={`stills__dot ${n === i ? 'is-on' : ''}`}
              onClick={() => setI(n)}
              aria-label={`Still ${n + 1}`}
            />
          ))}
        </div>
        <button className="stills__arrow" onClick={() => go(i + 1)} aria-label="Next still">
          →
        </button>
      </div>
    </section>
  )
}
