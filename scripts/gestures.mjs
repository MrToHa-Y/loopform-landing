import { spawn } from "node:child_process"
import { mkdirSync } from "node:fs"
import { chromium } from "playwright"

const port = 4179
const server = spawn("npx", ["vite", "preview", "--port", String(port), "--strictPort"], { shell: true, stdio: "ignore" })

await new Promise((resolve) => setTimeout(resolve, 2500))

const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=d3d11", "--ignore-gpu-blocklist"] })
const folder = "shots/gestures"

mkdirSync(folder, { recursive: true })

async function open(options) {
  const page = await (await browser.newContext(options)).newPage()

  await page.goto(`http://localhost:${port}/?shoot`)
  await page.waitForFunction(() => window.__loopformReady === true, undefined, { timeout: 30000 })
  await page.waitForFunction(() => document.querySelectorAll("[data-card] img").length >= 10, undefined, { timeout: 60000 })
  await page.waitForTimeout(800)

  return page
}

const jump = (page, selector, offset) =>
  page.evaluate(
    ([target, shift]) => {
      const element = document.querySelector(target)
      const y = element.getBoundingClientRect().top + window.scrollY + (shift / 100) * window.innerHeight

      window.__lenis.scrollTo(y, { immediate: true, force: true })
    },
    [selector, offset],
  )

const touch = (page, type, x, y) =>
  page.evaluate(
    ([eventType, clientX, clientY]) => {
      const point = new Touch({ identifier: 1, target: document.body, clientX, clientY })
      const list = eventType === "touchend" ? [] : [point]

      window.dispatchEvent(new TouchEvent(eventType, { touches: list, targetTouches: list, changedTouches: [point] }))
    },
    [type, x, y],
  )

const phone = await open({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

await jump(phone, "[data-section='collection']", 305)
await phone.waitForTimeout(2200)
await phone.screenshot({ path: `${folder}/caps-before.png` })
await touch(phone, "touchstart", 80, 300)

for (let step = 0; step <= 24; step += 1) {
  await touch(phone, "touchmove", 80 + step * 10, 300 + Math.sin(step / 4) * 40)
  await phone.waitForTimeout(16)
}

await phone.screenshot({ path: `${folder}/caps-drag.png` })
await touch(phone, "touchend", 320, 300)
await phone.waitForTimeout(1400)
await phone.screenshot({ path: `${folder}/caps-after.png` })

await jump(phone, "[data-section='configurator']", 20)
await phone.waitForTimeout(1500)

const box = await phone.locator("[data-anchor='configurator-product']").boundingBox()
const client = await phone.context().newCDPSession(phone)
const centerX = box.x + box.width / 2
const centerY = box.y + box.height / 2
const send = (type, points) => client.send("Input.dispatchTouchEvent", { type, touchPoints: points })

await send("touchStart", [{ x: centerX, y: centerY, id: 1 }])

for (let step = 1; step <= 14; step += 1) {
  await send("touchMove", [{ x: centerX + step * 9, y: centerY + step * 3, id: 1 }])
  await phone.waitForTimeout(16)
}

await send("touchEnd", [])
await phone.waitForTimeout(900)
await phone.screenshot({ path: `${folder}/rotate.png` })

const rotated = await phone.evaluate(() => document.querySelector("[data-section='configurator'] [aria-hidden='true']:not([data-anchor])")?.textContent)

await send("touchStart", [{ x: centerX - 60, y: centerY, id: 1 }, { x: centerX + 60, y: centerY, id: 2 }])

for (let step = 1; step <= 12; step += 1) {
  await send("touchMove", [{ x: centerX - 60 - step * 3, y: centerY + step * 4, id: 1 }, { x: centerX + 60 + step * 3, y: centerY + step * 4, id: 2 }])
  await phone.waitForTimeout(16)
}

await send("touchEnd", [])
await phone.waitForTimeout(900)
await phone.screenshot({ path: `${folder}/pinch.png` })
console.log("angle after drag", rotated)

const desktop = await open({ viewport: { width: 1440, height: 900 } })

await jump(desktop, "[data-section='melt']", 25)
await desktop.waitForTimeout(1400)
await desktop.mouse.move(640, 300)
await desktop.waitForTimeout(100)
await desktop.mouse.move(700, 340, { steps: 8 })
await desktop.waitForTimeout(700)
await desktop.screenshot({ path: `${folder}/blob-press.png` })

await browser.close()
spawn("taskkill", ["/pid", String(server.pid), "/f", "/t"], { shell: true, stdio: "ignore" })
