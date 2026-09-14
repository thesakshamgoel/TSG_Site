import puppeteer from 'puppeteer-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const OUT = process.argv[2] || '.'
const URL = 'http://localhost:5173/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: [
    '--no-sandbox', '--disable-gpu', '--use-gl=angle',
    '--use-angle=swiftshader-webgl', '--enable-unsafe-swiftshader',
    '--hide-scrollbars', '--window-size=1440,900',
  ],
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 })

// catch the loader mid-count
await sleep(900)
await page.screenshot({ path: `${OUT}/00-loader.png` })
console.log('shot loader')

// let loader finish, then stop the tour and pin to top for a clean hero shot
await sleep(3600)
await page.evaluate(() => window.dispatchEvent(new WheelEvent('wheel', { deltaY: 1 })))
await page.evaluate(() => {
  if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true })
  else window.scrollTo(0, 0)
})
await sleep(600)
await page.evaluate(() => {
  if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true })
})
await sleep(500)
await page.screenshot({ path: `${OUT}/01-hero-clean.png` })
console.log('shot hero')

await browser.close()
