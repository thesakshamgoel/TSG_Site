import { useEffect, useState } from 'react'
import './MobileTabBar.css'

/**
 * App-style bottom tab bar — shown only on phones/small screens. Three tabs,
 * deliberately minimal: Home (left), Works (centre, the quiet star of the bar),
 * About (right). Works scrolls to the Two Reels section with the Film and
 * Graphics panels. Sits above the iOS home indicator via safe-area insets,
 * with a frosted-glass bar like a native app.
 */
const TABS = [
  { id: 'top', label: 'Home', icon: HomeIcon },
  { id: 'work', label: 'Works', icon: FilmIcon, featured: true },
  { id: 'about', label: 'About', icon: UserIcon },
]

export default function MobileTabBar({ galleryCat, onNavigate }) {
  const [active, setActive] = useState('top')

  // Derive the active tab from scroll position (or the open gallery overlay).
  useEffect(() => {
    if (galleryCat === 'film' || galleryCat === 'graphics') {
      setActive('work') // a reel is open — you're inside Works
      return
    }
    const onScroll = () => {
      const mid = window.innerHeight * 0.5
      const about = document.getElementById('about')
      const work = document.getElementById('work')
      if (about && about.getBoundingClientRect().top < mid) setActive('about')
      else if (work && work.getBoundingClientRect().top < mid) setActive('work')
      else setActive('top')
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [galleryCat])

  return (
    <nav className="mtab" aria-label="Primary">
      {TABS.map((t) => {
        const Icon = t.icon
        return (
          <button
            key={t.id}
            type="button"
            className={`mtab__btn ${t.featured ? 'is-featured ' : ''}${active === t.id ? 'is-active' : ''}`}
            onClick={() => onNavigate(t.id)}
            aria-current={active === t.id ? 'page' : undefined}
          >
            <span className="mtab__icon">
              <Icon />
            </span>
            <span className="mtab__label">{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

/* ── icons (stroke, inherit currentColor) ─────────────────────────────────── */
function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </svg>
  )
}
function FilmIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
    </svg>
  )
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
    </svg>
  )
}
