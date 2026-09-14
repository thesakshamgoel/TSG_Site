// Generate PWA/app icons from public/favicon.svg using headless Edge (no extra
// deps). Produces: icon-192.png, icon-512.png, icon-maskable-512.png (with a
// safe-zone padding so Android's mask never clips the mark), apple-touch-icon.png.
// Run once after changing the source SVG:  node scripts/gen-icons.mjs
import puppeteer from 'puppeteer-core'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pub = resolve(__dirname, '..', 'public')
const EDGE = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync)

const svg = readFileSync(resolve(pub, 'favicon.svg'), 'utf8')
const svgDataUri = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')

// bg matches the icon's own rounded-rect fill so padding is seamless
const BG = '#0b0a0e'

const targets = [
  { file: 'icon-192.png', size: 192, pad: 0 },
  { file: 'icon-512.png', size: 512, pad: 0 },
  { file: 'icon-maskable-512.png', size: 512, pad: 0.14 }, // ~86% safe zone
  { file: 'apple-touch-icon.png', size: 180, pad: 0.08 },
]

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 1 })

for (const t of targets) {
  const inner = Math.round(t.size * (1 - t.pad * 2))
  const html = `<!doctype html><html><body style="margin:0">
    <div style="width:${t.size}px;height:${t.size}px;background:${BG};display:flex;align-items:center;justify-content:center">
      <img src="${svgDataUri}" style="width:${inner}px;height:${inner}px;display:block"/>
    </div></body></html>`
  await page.setViewport({ width: t.size, height: t.size, deviceScaleFactor: 1 })
  await page.setContent(html, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    const img = document.querySelector('img')
    return img.complete ? true : img.decode().catch(() => {})
  })
  const el = await page.$('div')
  const buf = await el.screenshot({ type: 'png', omitBackground: false })
  writeFileSync(resolve(pub, t.file), buf)
  console.log('wrote', t.file, `(${t.size}px, pad ${t.pad})`)
}

await browser.close()
console.log('done')
