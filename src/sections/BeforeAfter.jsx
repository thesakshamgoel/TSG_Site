import { useCallback, useEffect, useRef, useState } from 'react'
import './BeforeAfter.css'

/**
 * "Before / After" — the colour-grading reveal slider. Each pair layers the
 * graded "after" frame under the ungraded "before", clipped by a handle the
 * viewer drags left↔right. Prev/next arrows and dots step through the pairs
 * (max 6). Editable live from the developer console's Before/After tab.
 */
export default function BeforeAfter({ comparisons, onOpenImage }) {
  const pairs = (comparisons || []).slice(0, 6)
  const [i, setI] = useState(0)
  const [pos, setPos] = useState(50) // reveal %, 0 = all "before", 100 = all "after"
  const [broken, setBroken] = useState({})
  const stageRef = useRef(null)
  const dragging = useRef(false)

  const go = useCallback(
    (n) => setI((p) => (n + pairs.length) % pairs.length),
    [pairs.length]
  )

  // reset the reveal to centre whenever the pair changes
  useEffect(() => {
    setPos(50)
  }, [i])

  const setFromClientX = useCallback((clientX) => {
    const el = stageRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const p = ((clientX - r.left) / r.width) * 100
    setPos(Math.max(0, Math.min(100, p)))
  }, [])

  const onPointerDown = (e) => {
    dragging.current = true
    stageRef.current?.setPointerCapture?.(e.pointerId)
    setFromClientX(e.clientX)
  }
  const onPointerMove = (e) => {
    if (dragging.current) setFromClientX(e.clientX)
  }
  const endDrag = () => {
    dragging.current = false
  }

  const onHandleKey = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setPos((p) => Math.max(0, p - 4))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      setPos((p) => Math.min(100, p + 4))
    }
  }

  if (!pairs.length) return null
  const c = pairs[i]
  const brokenAfter = broken[c.id + '-a']
  const brokenBefore = broken[c.id + '-b']
  const mark = (key) => setBroken((b) => ({ ...b, [key]: true }))

  return (
    <section className="ba section" id="grade">
      <div className="container ba__head">
        <span className="slate">Before / After</span>
        <h2 className="section-title">
          The grade, <span className="gradient-text">revealed.</span>
        </h2>
        <p className="ba__sub">Drag the handle to reveal the colour grade.</p>
      </div>

      <div className="ba__reel">
        <span className="perf-row ba__perf" aria-hidden="true" />
        <div
          className="ba__stage"
          ref={stageRef}
          style={{ '--pos': pos + '%' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {/* AFTER — graded, full frame underneath */}
          <div className="ba__layer ba__after">
            {brokenAfter ? (
              <div className="ba__ph">Add public{c.after}</div>
            ) : (
              <img
                src={c.after}
                alt={`${c.title} — after`}
                draggable="false"
                onError={() => mark(c.id + '-a')}
              />
            )}
            <span className="ba__tag ba__tag--after">After</span>
          </div>

          {/* BEFORE — ungraded, clipped to the left of the handle */}
          <div className="ba__layer ba__before">
            {brokenBefore ? (
              <div className="ba__ph ba__ph--before">Add public{c.before}</div>
            ) : (
              <img
                src={c.before}
                alt={`${c.title} — before`}
                draggable="false"
                onError={() => mark(c.id + '-b')}
              />
            )}
            <span className="ba__tag ba__tag--before">Before</span>
          </div>

          {/* the draggable divider */}
          <div
            className="ba__handle"
            role="slider"
            tabIndex={0}
            aria-label="Reveal amount"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pos)}
            onKeyDown={onHandleKey}
          >
            <span className="ba__handle-line" />
            <span className="ba__handle-grip">‹ ›</span>
          </div>

          <span className="ba__vignette" aria-hidden="true" />
          <span className="ba__title timecode">{c.title}</span>
          <span className="ba__frame timecode">
            FRAME {String(i + 1).padStart(2, '0')} / {String(pairs.length).padStart(2, '0')}
          </span>
          {!brokenAfter && (
            <button
              type="button"
              className="ba__expand"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() =>
                onOpenImage?.({ title: `${c.title} — graded`, image: c.after, mediaType: 'image' })
              }
              aria-label="View graded frame full size"
            >
              ⛶ View
            </button>
          )}
        </div>
        <span className="perf-row ba__perf" aria-hidden="true" />
      </div>

      {pairs.length > 1 && (
        <div className="ba__controls">
          <button className="ba__arrow" onClick={() => go(i - 1)} aria-label="Previous comparison">
            ←
          </button>
          <div className="ba__dots">
            {pairs.map((p, n) => (
              <button
                key={p.id}
                className={`ba__dot ${n === i ? 'is-on' : ''}`}
                onClick={() => setI(n)}
                aria-label={`Comparison ${n + 1}`}
              />
            ))}
          </div>
          <button className="ba__arrow" onClick={() => go(i + 1)} aria-label="Next comparison">
            →
          </button>
        </div>
      )}
    </section>
  )
}
