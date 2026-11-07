import { readdirSync, rmSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { chromium } from "playwright"

const folder = process.argv[2] ?? "shots/desktop"
const columns = Number(process.argv[3] ?? 4)
const perSheet = Number(process.argv[4] ?? 16)
const tileWidth = 1600 / columns
const files = readdirSync(folder).filter((name) => name.endsWith(".png") && !name.startsWith("sheet")).sort()
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })

for (let start = 0, sheet = 0; start < files.length; start += perSheet, sheet += 1) {
  const tiles = files
    .slice(start, start + perSheet)
    .map((name) => {
      const url = pathToFileURL(resolve(folder, name)).href
      return `<figure><img src="${url}"><figcaption>${name.replace(".png", "")}</figcaption></figure>`
    })
    .join("")

  const htmlPath = resolve(folder, "sheet.html")

  writeFileSync(
    htmlPath,
    `<style>body{margin:0;display:grid;grid-template-columns:repeat(${columns},${tileWidth}px);background:#333}figure{margin:0;position:relative}img{width:100%;display:block}figcaption{position:absolute;left:4px;top:4px;background:#000;color:#ff0;font:14px monospace;padding:1px 4px}</style>${tiles}`,
  )
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" })
  await page.screenshot({ path: `${folder}/sheet-${sheet}.png`, fullPage: true })
}

rmSync(resolve(folder, "sheet.html"), { force: true })
await browser.close()
