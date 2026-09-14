import { useState } from 'react'
import { motion } from 'framer-motion'
import Reveal from '../components/Reveal'
import { projectsByCategory } from '../data/store'
import { thumbHiFor, thumbFallbackFor } from '../data/media'
import { useImgFallback } from '../hooks/useImgFallback'
import './Work.css'

function Panel({ category, projects, active, dimmed, index, onHover, onLeave, onOpen }) {
  const coverProject = projects.find((p) => p.featured) || projects[0]
  const cover = useImgFallback(thumbHiFor(coverProject), thumbFallbackFor(coverProject))
  const count = projects.length

  const onMove = (e) => {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    el.style.setProperty('--px', `${((e.clientX - r.left) / r.width - 0.5) * 2}`)
    el.style.setProperty('--py', `${((e.clientY - r.top) / r.height - 0.5) * 2}`)
  }
  const onMoveLeave = (e) => {
    e.currentTarget.style.setProperty('--px', '0')
    e.currentTarget.style.setProperty('--py', '0')
    onLeave()
  }

  const handleClick = () => {
    const r = document.getElementById(`panel-${category.id}`)?.getBoundingClientRect()
    const origin = r
      ? {
          x: ((r.left + r.width / 2) / window.innerWidth) * 100,
          y: ((r.top + r.height / 2) / window.innerHeight) * 100,
        }
      : { x: 50, y: 50 }
    onOpen(category.id, origin)
  }

  return (
    <motion.button
      id={`panel-${category.id}`}
      className={`panel ${active ? 'is-active' : ''} ${dimmed ? 'is-dimmed' : ''}`}
      onMouseEnter={onHover}
      onMouseLeave={onMoveLeave}
      onMouseMove={onMove}
      onClick={handleClick}
      initial={{ opacity: 0, y: 60, rotateX: 8 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      transformTemplate={(_, generated) =>
        `rotateX(var(--panel-rx, 0deg)) rotateY(var(--panel-ry, 0deg)) ${
          generated === 'none' ? '' : generated
        }`.trim()
      }
    >
      <div className="panel__media">
        {!coverProject ? (
          <span className="panel__ph">{category.number}</span>
        ) : !cover.broken ? (
          <img src={cover.src} alt="" onError={cover.onError} loading="lazy" />
        ) : (
          <div className="panel__ph panel__ph--title">{coverProject.title}</div>
        )}
        <span className="panel__scan" />
        <span className="panel__grad" />
      </div>

      <div className="panel__content">
        <div className="panel__top">
          <span className="panel__no slate">Reel {category.number}</span>
          <span className="timecode">{count} projects</span>
        </div>

        <div className="panel__bottom">
          <h3 className="panel__title">{category.title}</h3>
          <p className="panel__tag">{category.tagline}</p>

          <ul className="panel__subs">
            {(category.subcats || []).map((s) => (
              <li key={s.id}>{s.label}</li>
            ))}
          </ul>

          <span className="panel__enter">
            Enter reel <span className="panel__arrow">→</span>
          </span>
        </div>
      </div>

      <span className="panel__ring" aria-hidden="true" />
    </motion.button>
  )
}

export default function Work({ categories, projects, onOpenCategory }) {
  const [hover, setHover] = useState(null)

  return (
    <section className="work section" id="work">
      <div className="container">
        <Reveal>
          <div className="work__head">
            <span className="slate">Two Reels</span>
            <h2 className="section-title">
              Pick a reel, <span className="gradient-text">step inside.</span>
            </h2>
          </div>
        </Reveal>

        <div className="work__panels">
          {categories.map((cat, i) => (
            <Panel
              key={cat.id}
              category={cat}
              index={i}
              projects={projectsByCategory(projects, cat.id)}
              active={hover === cat.id}
              dimmed={hover && hover !== cat.id}
              onHover={() => setHover(cat.id)}
              onLeave={() => setHover(null)}
              onOpen={onOpenCategory}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
