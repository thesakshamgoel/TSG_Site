import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { embedFor } from '../data/media'
import './Lightbox.css'

export default function Lightbox({ project, onClose }) {
  // Escape is handled centrally in App (closes only the topmost overlay);
  // this just owns the body scroll-lock for as long as it's mounted.
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const isVideo = project.mediaType !== 'image'

  return (
    <AnimatePresence>
      <motion.div
        className="lb"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="lb__panel"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.94, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        >
          <button className="lb__close" onClick={onClose} aria-label="Close">
            ✕
          </button>

          <div className="lb__media">
            {isVideo ? (
              <iframe
                src={embedFor(project)}
                title={project.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <img src={project.image} alt={project.title} />
            )}
          </div>

          <div className="lb__info">
            <div>
              <h3>{project.title}</h3>
              {project.role && <p className="lb__role">{project.role}</p>}
            </div>
            <div className="lb__meta">
              {project.year && <span>{project.year}</span>}
              {project.tags?.map((t) => (
                <span key={t} className="lb__tag">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
