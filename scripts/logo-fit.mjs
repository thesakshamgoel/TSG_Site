import puppeteer from 'puppeteer-core'
import fs from 'fs'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const LOGO = 'C:\\Users\\Saksham Goel\\portfolio\\public\\logo.svg'
const FAV = 'C:\\Users\\Saksham Goel\\portfolio\\public\\favicon.svg'

let svg = fs.readFileSync(LOGO, 'utf8')

const browser = await puppeteer.launch({
  executablePath: EDGE, headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
})
const page = await browser.newPage()
await page.setContent(`<!doctype html><body>${svg}</body>`)
const b = await page.evaluate(() => {
  const g = document.querySelector('svg g#mark')
  const r = g.getBBox()
  return { x: r.x, y: r.y, width: r.width, height: r.height }
})
await browser.close()

const pad = 14
const x0 = b.x - pad, y0 = b.y - pad, w = b.width + 2 * pad, h = b.height + 2 * pad
svg = svg.replace(/viewBox="[^"]*"/, `viewBox="${x0.toFixed(1)} ${y0.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}"`)
fs.writeFileSync(LOGO, svg)

// favicon: dark rounded tile with the mark centered
const inner = svg.substring(svg.indexOf('<defs'), svg.lastIndexOf('</svg>'))
const s = 56 / w
const tx = 4 - x0 * s
const ty = (64 - h * s) / 2 - y0 * s
const fav = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="14" fill="#0b0a0e"/>
<g transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${s.toFixed(5)})">
${inner}
</g>
</svg>
`
fs.writeFileSync(FAV, fav)
console.log('bbox', JSON.stringify(b), '-> viewBox', `${x0.toFixed(1)} ${y0.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`)
