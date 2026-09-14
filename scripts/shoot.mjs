import puppeteer from 'puppeteer-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const OUT = process.argv[2] || '.'
const URL = 'http://localhost:5173/'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-gpu',
    '--use-gl=angle',
    '--use-angle=swiftshader-webgl',
    '--enable-unsafe-swiftshader',
    '--hide-scrollbars',
    '--window-size=1440,900',
  ],
})

const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })

const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('CONSOLE: ' + m.text())
})
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 })

// wait for the loader to finish (2.2s counter + ~1s reveal) then settle
await sleep(4200)

async function shoot(name) {
  await sleep(900)
  await page.screenshot({ path: `${OUT}/${name}.png` })
  console.log('shot', name)
}

async function goto(id) {
  await page.evaluate((sid) => {
    const el = document.getElementById(sid)
    if (window.__lenis && el) window.__lenis.scrollTo(el, { immediate: true })
    else if (el) el.scrollIntoView()
  }, id)
  // give lazy images time to load
  await sleep(1400)
}

await shoot('01-hero')
await goto('film')
await shoot('02-film')
await goto('post')
await shoot('03-post')
await goto('design')
await shoot('04-design')
await goto('about')
await shoot('05-about')

console.log('ERRORS:', errors.length ? JSON.stringify(errors, null, 2) : 'none')

await browser.close()
