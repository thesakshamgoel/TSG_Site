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

const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push('CONSOLE: ' + m.text()))
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 })
await sleep(4200) // let loader finish

const toTop = async () => {
  await page.evaluate(() => window.__lenis && window.__lenis.scrollTo(0, { immediate: true }))
  await sleep(600)
}
const shoot = async (n) => { await sleep(700); await page.screenshot({ path: `${OUT}/${n}.png` }); console.log('shot', n) }
const gotoId = async (id) => {
  await page.evaluate((sid) => {
    const el = document.getElementById(sid)
    if (window.__lenis && el) window.__lenis.scrollTo(el, { immediate: true })
  }, id)
  await sleep(1300)
}

// hero (move mouse to center for cursor/glow)
await toTop()
await page.mouse.move(720, 420)
await shoot('n1-hero')

// work cards
await gotoId('work')
await page.mouse.move(400, 500)
await shoot('n2-work')

// open a category gallery by clicking the first work card
await page.evaluate(() => {
  const c = document.querySelector('.workcard')
  if (c) c.click()
})
await sleep(1600)
await shoot('n3-gallery')

// close gallery, go to about
await page.keyboard.press('Escape')
await sleep(900)
await gotoId('about')
await shoot('n4-about')

console.log('ERRORS:', errors.length ? JSON.stringify(errors, null, 2) : 'none')
await browser.close()
