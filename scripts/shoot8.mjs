import puppeteer from 'puppeteer-core'
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const OUT = process.argv[2] || '.'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({
  executablePath: EDGE, headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--use-gl=angle', '--use-angle=swiftshader-webgl',
    '--enable-unsafe-swiftshader', '--hide-scrollbars', '--window-size=1440,900'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push('CONSOLE: ' + m.text()))
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 })
await sleep(4400)
const shootAt = async (name, id, mouse) => {
  await page.evaluate((sid) => { const el = document.getElementById(sid); if (el) window.scrollTo(0, el.offsetTop) }, id)
  await sleep(1300); if (mouse) await page.mouse.move(mouse[0], mouse[1]); await sleep(500)
  await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('shot', name)
}
await page.evaluate(() => window.scrollTo(0, 0)); await sleep(800)
await page.screenshot({ path: `${OUT}/v1-hero.png` }); console.log('shot v1-hero')
await shootAt('v2-stills', 'stills', [720, 460])
await shootAt('v3-work', 'work', [430, 480])
await shootAt('v4-about', 'about', [700, 430])
// certificates chapter
await page.evaluate(() => {
  const els = [...document.querySelectorAll('.chapter__title')]
  const c = els.find((e) => /Credentials/.test(e.textContent))
  if (c) window.scrollTo(0, c.getBoundingClientRect().top + window.scrollY - 120)
})
await sleep(1100)
await page.screenshot({ path: `${OUT}/v5-certs.png` }); console.log('shot v5-certs')
console.log('ERRORS:', errors.length ? JSON.stringify(errors, null, 2) : 'none')
await browser.close()
