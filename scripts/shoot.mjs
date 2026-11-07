import { spawn } from "node:child_process"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { chromium } from "playwright"

const port = 4174
const base = `http://localhost:${port}/?shoot`
const args = process.argv.slice(2)
const onlyDesktop = args.includes("--desktop")
const onlyMobile = args.includes("--mobile")
const pointsArg = args.find((value) => value.startsWith("--points="))
const customPoints = pointsArg ? pointsArg.slice(9).split(",").map(Number) : null
const reduced = args.includes("--reduced")

const logs = []

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://localhost:${port}/`)

      if (response.ok) {
        return
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  throw new Error("Preview server did not start")
}

async function capture(browser, name, viewport, stepVh) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    reducedMotion: reduced ? "reduce" : "no-preference",
  })
  const page = await context.newPage()
  const folder = `shots/${name}`

  mkdirSync(folder, { recursive: true })
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      logs.push(`[${name}] ${message.type()}: ${message.text()}`)
    }
  })
  page.on("pageerror", (error) => logs.push(`[${name}] pageerror: ${error.message}`))

  await page.goto(base)
  await page.waitForFunction(() => window.__loopformReady === true, undefined, { timeout: 30000 }).catch(() => {
    logs.push(`[${name}] preloader timeout`)
  })
  await page.waitForTimeout(2600)

  const total = await page.evaluate(() => document.documentElement.scrollHeight / window.innerHeight)
  const lastVh = Math.floor((total - 1) * 100)
  const points = customPoints ?? []

  if (!customPoints) {
    for (let vh = 0; vh <= lastVh; vh += stepVh) {
      points.push(vh)
    }

    points.push(lastVh)
  }

  logs.push(`[${name}] page height ${total.toFixed(2)} screens`)

  for (const vh of points) {
    await page.evaluate((value) => {
      const y = (value / 100) * window.innerHeight

      if (window.__lenis) {
        window.__lenis.scrollTo(y, { immediate: true, force: true })
      } else {
        window.scrollTo(0, y)
      }
    }, vh)
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${folder}/${String(vh).padStart(4, "0")}.png` })
  }

  await context.close()
}

const server = spawn("npx", ["vite", "preview", "--port", String(port), "--strictPort"], { shell: true, stdio: "ignore" })

try {
  await waitForServer()

  if (!customPoints) {
    rmSync("shots", { recursive: true, force: true })
  }

  mkdirSync("shots", { recursive: true })

  const browser = await chromium.launch({
    args: ["--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"],
  })

  if (!onlyMobile) {
    await capture(browser, reduced ? "reduced" : "desktop", { width: 1440, height: 900 }, 50)
  }

  if (!onlyDesktop) {
    await capture(browser, "mobile", { width: 390, height: 844 }, 100)
  }

  await browser.close()
  writeFileSync("shots/console.txt", logs.join("\n"))
  console.log(logs.join("\n"))
} finally {
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(server.pid), "/f", "/t"], { shell: true, stdio: "ignore" })
  } else {
    server.kill()
  }
}
