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

// 1) countdown leader mid-way
await sleep(1200)
await page.screenshot({ path: `${OUT}/r0-leader.png` })
console.log('shot leader')

// wait for loader to finish
await sleep(3400)

const shootAt = async (name, y) => {
  await page.evaluate((yy) => window.scrollTo(0, yy), y)
  await sleep(1100)
  await page.mouse.move(700, 430)
  await sleep(300)
  await page.screenshot({ path: `${OUT}/${name}.png` })
  console.log('shot', name)
}

const workY = await page.evaluate(() => document.getElementById('work').offsetTop)
const aboutY = await page.evaluate(() => document.getElementById('about').offsetTop)

await shootAt('r1-hero', 0)
await shootAt('r2-work', workY)

// rubberband test: fire a wheel gesture, land, then confirm it stays put
await page.evaluate(() => window.scrollTo(0, 0))
await sleep(400)
await page.mouse.move(700, 450)
await page.mouse.wheel({ deltaY: 300 })
await sleep(1100)
const landed = await page.evaluate(() => Math.round(window.scrollY))
await sleep(900)
const after = await page.evaluate(() => Math.round(window.scrollY))
console.log(`SCROLL landed=${landed} after=${after} workY=${Math.round(workY)} rubberband=${landed !== after}`)

await shootAt('r3-about', aboutY)

console.log('ERRORS:', errors.length ? JSON.stringify(errors, null, 2) : 'none')
await browser.close()
