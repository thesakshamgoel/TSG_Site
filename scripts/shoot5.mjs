import puppeteer from 'puppeteer-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const OUT = process.argv[2] || '.'
const URL = 'http://localhost:5173/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: EDGE, headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--use-gl=angle',
    '--use-angle=swiftshader-webgl', '--enable-unsafe-swiftshader',
    '--hide-scrollbars', '--window-size=1440,900'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push('CONSOLE: ' + m.text()))
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 })

// 3D reel loader at two moments
await sleep(900)
await page.screenshot({ path: `${OUT}/s0-reel-early.png` })
await sleep(1400)
await page.screenshot({ path: `${OUT}/s1-reel-mid.png` })
console.log('shot reel')

await sleep(3200) // finish + unfold

const shootAt = async (name, y, mouse) => {
  await page.evaluate((yy) => window.scrollTo(0, yy), y)
  await sleep(1000)
  if (mouse) await page.mouse.move(mouse[0], mouse[1])
  await sleep(500)
  await page.screenshot({ path: `${OUT}/${name}.png` })
  console.log('shot', name)
}

const workY = await page.evaluate(() => document.getElementById('work').offsetTop)
const aboutY = await page.evaluate(() => document.getElementById('about').offsetTop)

await shootAt('s2-hero', 0, [700, 430])
await shootAt('s3-work', workY, [720, 470])
// hover a reel row
await page.evaluate(() => {
  const rows = document.querySelectorAll('.reelrow')
  if (rows[1]) {
    const r = rows[1].getBoundingClientRect()
    rows[1].dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }))
  }
})
await page.mouse.move(720, 500)
await sleep(900)
await page.screenshot({ path: `${OUT}/s4-work-hover.png` })
console.log('shot work-hover')

// rubberband test
await page.evaluate(() => window.scrollTo(0, 0))
await sleep(400)
await page.mouse.move(700, 450)
await page.mouse.wheel({ deltaY: 300 })
await sleep(1100)
const landed = await page.evaluate(() => Math.round(window.scrollY))
await sleep(1000)
const after = await page.evaluate(() => Math.round(window.scrollY))
console.log(`SCROLL landed=${landed} after=${after} workY=${Math.round(workY)} rubberband=${landed !== after}`)

await shootAt('s5-about', aboutY, [700, 430])

console.log('ERRORS:', errors.length ? JSON.stringify(errors, null, 2) : 'none')
await browser.close()
