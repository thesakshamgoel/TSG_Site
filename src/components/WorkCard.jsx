import { useRef } from 'react'
import './WorkCard.css'

function coverFor(project) {
  if (!project) return ''
  if (project.mediaType === 'image') return project.image
  if (project.youtubeId)
    return `https://i.ytimg.com/vi/${project.youtubeId}/maxresdefault.jpg`
  return ''
}

/**
 * A large, text-forward "reel" row. Default state is pure typography; on hover
 * a preview frame reveals and the whole row animates. Click zooms into the reel.
 */
export default function WorkCard({ category, projects, index, onOpen }) {
  const ref = useRef(null)
  const cover = coverFor(projects.find((p) => p.featured) || projects[0])
  const count = projects.length

  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--rx', `${(-py * 5).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${(px * 5).toFixed(2)}deg`)
    // let the floating frame track the pointer a little
    el.style.setProperty('--tx', `${(px * 26).toFixed(1)}px`)
    el.style.setProperty('--ty', `${(py * 20).toFixed(1)}px`)
  }
  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
    el.style.setProperty('--tx', '0px')
    el.style.setProperty('--ty', '0px')
  }

  const onImgError = (e) => {
    const p = projects.find((x) => x.featured) || projects[0]
    if (p?.youtubeId && !e.currentTarget.dataset.fb) {
      e.currentTarget.dataset.fb = '1'
      e.currentTarget.src = `https://i.ytimg.com/vi/${p.youtubeId}/hqdefault.jpg`
    }
  }

  const handleClick = () => {
    const r = ref.current?.getBoundingClientRect()
    const origin = r
      ? {
          x: ((r.left + r.width / 2) / window.innerWidth) * 100,
          y: ((r.top + r.height / 2) / window.innerHeight) * 100,
        }
      : { x: 50, y: 50 }
    onOpen(category.id, origin)
  }

  const title = category.title

  return (
    <button
      ref={ref}
      className="reelrow"
      style={{ '--i': index }}
      onClick={handleClick}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <span className="reelrow__num">{category.number}</span>

      <span className="reelrow__perf perf-row" aria-hidden="true" />

      <div className="reelrow__text">
        <h3 className="reelrow__title" data-text={title}>
          <span className="reelrow__title-a">{title}</span>
          <span className="reelrow__title-b" aria-hidden="true">
            {title}
          </span>
        </h3>
        <div className="reelrow__meta">
          <span className="reelrow__tag">{category.tagline}</span>
          <span className="reelrow__dot">·</span>
          <span className="timecode">
            {count} {count === 1 ? 'scene' : 'scenes'}
          </span>
        </div>
      </div>

      {/* preview frame that reveals + floats on hover */}
      <div className="reelrow__frame" aria-hidden="true">
        {cover ? (
          <img src={cover} alt="" loading="lazy" onError={onImgError} />
        ) : (
          <span className="reelrow__ph">{category.number}</span>
        )}
      </div>

      <span className="reelrow__cta">
        View reel <span className="reelrow__arrow">→</span>
      </span>

      <span className="reelrow__line" aria-hidden="true" />
    </button>
  )
}
