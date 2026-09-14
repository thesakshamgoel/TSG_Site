import { useEffect, useState } from 'react'
import { firebaseEnabled } from '../firebase/config'
import { watchUser, watchOwner } from '../firebase/auth'
import './Footer.css'

export default function Footer({ profile, onOpenConsole }) {
  // Direct contact details are visitor-login-gated (see About). Mirror that
  // here so the footer's Email link doesn't leak the address when gated.
  const [user, setUser] = useState(null)
  const [owner, setOwner] = useState(null)
  useEffect(() => watchUser(setUser), [])
  useEffect(() => watchOwner(setOwner), [])
  const showEmail = !firebaseEnabled || !!user
  // With auth on, the console entry point exists only for the owner account.
  const showConsole = !firebaseEnabled || !!owner

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <span className="footer__name">{profile.name}</span>
          <span className="footer__tag">{profile.tagline}</span>
        </div>

        <div className="footer__links">
          {profile.socials?.map((s) => (
            <a key={s.label} href={s.url} target="_blank" rel="noreferrer">
              {s.label}
            </a>
          ))}
          {showEmail && <a href={`mailto:${profile.email}`}>Email</a>}
        </div>

        <div className="footer__bottom">
          <span>
            © {profile.name} — built with React, Three.js &amp; a lot of coffee.
          </span>
          {showConsole && (
            <button className="footer__console" onClick={onOpenConsole}>
              Developer console
            </button>
          )}
        </div>
      </div>
    </footer>
  )
}
