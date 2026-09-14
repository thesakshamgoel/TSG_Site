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
await sleep(4200) // loader + unfold

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

await shootAt('t1-hero', 0, [700, 430])
await shootAt('t2-work', workY, [420, 470]) // hover left panel
// open the film gallery
await page.evaluate(() => document.getElementById('panel-film')?.click())
await sleep(1700)
await page.screenshot({ path: `${OUT}/t3-gallery.png` })
console.log('shot gallery')
// click a Commercials filter to test grouping
await page.evaluate(() => {
  const b = [...document.querySelectorAll('.gallery__filters button')].find((x) => /Commercial/.test(x.textContent))
  b && b.click()
})
await sleep(900)
await page.screenshot({ path: `${OUT}/t4-gallery-filter.png` })
console.log('shot gallery-filter')
await page.keyboard.press('Escape')
await sleep(900)

await shootAt('t5-about', aboutY + 400, [700, 430]) // scroll into about (form)

console.log('ERRORS:', errors.length ? JSON.stringify(errors, null, 2) : 'none')
await browser.close()
