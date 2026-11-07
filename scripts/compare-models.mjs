import { spawn } from "node:child_process"
import { mkdirSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { chromium } from "playwright"

const port = 4191
const folder = "shots/models"
const views = {
  tolqyn: { yaw: -48, pitch: 11, fill: 0.78 },
  tas: { yaw: 0, pitch: 7, fill: 0.72 },
  qum: { yaw: -62, pitch: 16, fill: 0.68 },
  kol: { yaw: 0, pitch: 11, fill: 0.82 },
  saule: { yaw: 0, pitch: 2, fill: 0.62 },
  japyraq: { yaw: 0, pitch: 14, fill: 0.68 },
  saiabaq: { yaw: -36, pitch: 24, fill: 0.68 },
  ornek: { yaw: 0, pitch: 3, fill: 0.8 },
  uya: { yaw: -22, pitch: 5, fill: 0.56 },
  biik: { yaw: 0, pitch: 7, fill: 0.72 },
}
const only = process.argv.slice(2)
const ids = only.length ? only : Object.keys(views)
const server = spawn("npx", ["vite", "--port", String(port), "--strictPort"], { shell: true, stdio: "ignore" })

await new Promise((done) => setTimeout(done, 3500))
mkdirSync(folder, { recursive: true })

const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=d3d11", "--ignore-gpu-blocklist"] })

for (const id of ids) {
  const view = views[id]
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } })

  page.on("pageerror", (error) => console.log(id, error.message))
  page.on("console", (message) => {
    if (message.type() === "error") {
      console.log(id, message.text().slice(0, 400))
    }
  })
  await page.goto(`http://localhost:${port}/?test=print&model=${id}&yaw=${view.yaw}&pitch=${view.pitch}&fill=${view.fill}`)
  await page.waitForFunction(() => window.__studioReady === true, undefined, { timeout: 40000 })
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${folder}/${id}.png` })
  await page.close()
}

const cells = ids
  .map((id) => {
    const photo = id === "biik" ? "" : pathToFileURL(resolve(`public/images/products/${id}.webp`)).href
    const render = pathToFileURL(resolve(`${folder}/${id}.png`)).href

    return `<div><img src="${photo}"><img src="${render}"></div>`
  })
  .join("")

writeFileSync(
  `${folder}/compare.html`,
  `<!doctype html><style>body{margin:0;background:#fff}div{display:inline-flex}img{width:480px;height:480px;object-fit:contain;background:#eee}</style>${cells}`,
)

const sheet = await browser.newPage({ viewport: { width: ids.length > 1 ? 1920 : 960, height: 480 } })

await sheet.goto(pathToFileURL(resolve(`${folder}/compare.html`)).href)
await sheet.waitForTimeout(500)
await sheet.screenshot({ path: `${folder}/compare.png`, fullPage: true })
await browser.close()
server.kill()
process.exit(0)
