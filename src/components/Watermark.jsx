import './Watermark.css'

/**
 * A faint, tiled ownership watermark drawn over the whole viewport. It does NOT
 * prevent screenshots (nothing can) — but every capture comes out visibly
 * marked as yours and traceable. Purely decorative overlay: pointer-events off,
 * so it never interferes with interaction.
 *
 * Tune `label` / opacity in Watermark.css. Remove <Watermark/> from App to
 * turn it off entirely.
 */
export default function Watermark({ label = 'Saksham Goel · @thesakshamgoel' }) {
  const tile = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='210'>` +
      `<text x='16' y='120' transform='rotate(-30 180 105)' ` +
      `font-family='Inter, Arial, sans-serif' font-size='17' font-weight='600' ` +
      `letter-spacing='2' fill='rgb(233,184,114)'>${label}</text></svg>`
  )
  return (
    <div
      className="watermark"
      aria-hidden="true"
      style={{ backgroundImage: `url("data:image/svg+xml,${tile}")` }}
    />
  )
}
