import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import ProjectCard from './ProjectCard'
import Reveal from './Reveal'
import { projectsByCategory, groupBySubcategory } from '../data/store'
import './CategoryGallery.css'

/**
 * Full-screen overlay showing the ENTIRE body of work for one category,
 * sub-classified (e.g. Short Films · Commercials · Music Videos). A filter
 * bar jumps between sub-reels; the featured piece screens large up top.
 */
export default function CategoryGallery({
  categoryId,
  categories,
  projects,
  origin = { x: 50, y: 50 },
  onClose,
  onOpenProject,
}) {
  const category = categories.find((c) => c.id === categoryId)
  const [filter, setFilter] = useState('all')

  const all = useMemo(
    () => (category ? projectsByCategory(projects, category.id) : []),
    [projects, category]
  )
  const groups = useMemo(
    () => (category ? groupBySubcategory(projects, category) : []),
    [projects, category]
  )
  const featured = all.find((p) => p.featured)

  // Escape is handled centrally in App (closes only the topmost overlay).

  if (!category) return null

  const shownGroups = filter === 'all' ? groups : groups.filter((g) => g.id === filter)

  return (
    <motion.div
      className="gallery"
      data-lenis-prevent
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="gallery__sheet"
        style={{ transformOrigin: `${origin.x}% ${origin.y}%` }}
        initial={{ scale: 0.12, opacity: 0, filter: 'blur(6px)' }}
        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
        exit={{ scale: 0.12, opacity: 0, filter: 'blur(6px)' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <header className="gallery__top">
          <div className="container gallery__topbar">
            <button className="gallery__back" onClick={onClose}>
              <span className="gallery__backarrow">←</span> Back
            </button>
            <span className="gallery__crumb">
              Reel {category.number} · {category.tagline}
            </span>
            <button className="gallery__x" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </header>

        <div className="container gallery__body">
          <div className="gallery__hero">
            <h2 className="gallery__title">{category.title}</h2>
            <p className="gallery__desc">{category.description}</p>
            <span className="gallery__meta">
              {all.length} {all.length === 1 ? 'project' : 'projects'}
            </span>
          </div>

          {/* sub-reel filter */}
          <div className="gallery__filters">
            <button
              className={filter === 'all' ? 'is-on' : ''}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                className={filter === g.id ? 'is-on' : ''}
                onClick={() => setFilter(g.id)}
              >
                {g.label} <span>{g.items.length}</span>
              </button>
            ))}
          </div>

          {featured && filter === 'all' && (
            <div className="gallery__featured">
              <ProjectCard project={featured} onOpen={onOpenProject} variant="featured" />
            </div>
          )}

          {shownGroups.map((g) => {
            const items = g.items.filter((p) => !(p.featured && filter === 'all'))
            if (!items.length) return null
            return (
              <div className="gallery__group" key={g.id}>
                <div className="gallery__group-head">
                  <span className="slate">{g.label}</span>
                  <span className="timecode">{g.items.length}</span>
                  <span className="gallery__group-rule" />
                </div>
                <div className="gallery__grid">
                  {items.map((p, i) => (
                    <Reveal key={p.id} delay={0.04 * (i % 4)}>
                      <ProjectCard project={p} onOpen={onOpenProject} />
                    </Reveal>
                  ))}
                </div>
              </div>
            )
          })}

          {all.length === 0 && (
            <p className="gallery__empty">
              No projects here yet — add them from the developer console.
            </p>
          )}

          {all.length > 0 && filter !== 'all' && shownGroups.every((g) => !g.items.length) && (
            <p className="gallery__empty">
              Nothing published under "
              {groups.find((g) => g.id === filter)?.label}" yet — check back soon.
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
