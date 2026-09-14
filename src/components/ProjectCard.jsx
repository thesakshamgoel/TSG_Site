import { useRef } from 'react'
import { thumbHiFor, thumbFallbackFor } from '../data/media'
import { useImgFallback } from '../hooks/useImgFallback'
import './ProjectCard.css'

export default function ProjectCard({ project, onOpen, variant }) {
  const isVideo = project.mediaType !== 'image'
  const isFeatured = variant === 'featured'
  const ref = useRef(null)
  const thumb = useImgFallback(thumbHiFor(project), thumbFallbackFor(project))

  // subtle 3D tilt toward the pointer
  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    const max = isFeatured ? 5 : 8
    el.style.setProperty('--rx', `${(-py * max).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${(px * max).toFixed(2)}deg`)
    el.style.setProperty('--mx', `${((px + 0.5) * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${((py + 0.5) * 100).toFixed(1)}%`)
  }
  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  return (
    <button
      ref={ref}
      className={`card ${isFeatured ? 'card--featured' : ''}`}
      onClick={() => onOpen(project)}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <span className="card__glow" />
      <div className="card__inner">
        <div className="card__media">
          {!thumb.broken ? (
            <img src={thumb.src} alt={project.title} loading="lazy" onError={thumb.onError} />
          ) : (
            <div className="card__placeholder">
              <span className="card__placeholder-title">{project.title}</span>
            </div>
          )}
          <div className="card__overlay" />

          {isVideo && (
            <span className="card__play" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="30" height="30">
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
            </span>
          )}

          {project.featured && <span className="card__badge">Showreel</span>}

          {project.award && (
            <span className="card__award" title="Award-winning">
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <path
                  d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.9 7.2 17.4l.9-5.4L4.2 8.2l5.4-.8L12 2z"
                  fill="currentColor"
                />
              </svg>
              Award-Winning
            </span>
          )}

          {project.tags?.length > 0 && (
            <div className="card__tags">
              {project.tags.slice(0, 3).map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          )}
        </div>

        <div className="card__body">
          <div className="card__row">
            <h3 className="card__title">{project.title}</h3>
            {project.year && <span className="card__year">{project.year}</span>}
          </div>
          {project.role && <p className="card__role">{project.role}</p>}
          <span className="card__cta">
            {isVideo ? 'Watch' : 'View'} <span className="card__arrow">→</span>
          </span>
        </div>
      </div>
    </button>
  )
}
