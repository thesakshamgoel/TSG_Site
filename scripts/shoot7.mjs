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
await sleep(4200)
const shootAt = async (name, id, mouse) => {
  await page.evaluate((sid) => { const el = document.getElementById(sid); if (el) window.scrollTo(0, el.offsetTop) }, id)
  await sleep(1200); if (mouse) await page.mouse.move(mouse[0], mouse[1]); await sleep(400)
  await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('shot', name)
}
await shootAt('u1-highlights', 'highlights', [700, 450])
await shootAt('u2-about', 'about', [700, 430])
await shootAt('u3-insta', 'insta', [700, 430])
console.log('ERRORS:', errors.length ? JSON.stringify(errors, null, 2) : 'none')
await browser.close()
