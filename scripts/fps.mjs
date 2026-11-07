import { spawn } from "node:child_process"
import { chromium } from "playwright"

const port = 4177
const server = spawn("npx", ["vite", "preview", "--port", String(port), "--strictPort"], { shell: true, stdio: "ignore" })

await new Promise((resolve) => setTimeout(resolve, 2500))

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu-rasterization", "--disable-frame-rate-limit=false"],
})
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()

await page.goto(`http://localhost:${port}/?shoot`)
await page.waitForFunction(() => window.__loopformReady === true, undefined, { timeout: 30000 })
await page.waitForTimeout(2000)

const renderer = await page.evaluate(() => {
  const gl = document.createElement("canvas").getContext("webgl2")
  const info = gl.getExtension("WEBGL_debug_renderer_info")
  return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : "unknown"
})

console.log("renderer", renderer)

for (const [name, from, to] of [
  ["hero", 40, 190],
  ["collection", 205, 590],
  ["problem", 830, 980],
  ["melt", 1090, 1300],
  ["process", 1380, 1580],
  ["passport", 1680, 1810],
  ["configurator", 1880, 1960],
  ["footer", 2500, 2567],
]) {
  const fps = await page.evaluate(
    async ([startVh, endVh]) => {
      const height = window.innerHeight
      const lenis = window.__lenis

      lenis.scrollTo((startVh / 100) * height, { immediate: true, force: true })
      await new Promise((resolve) => setTimeout(resolve, 500))

      const durationMs = 3500
      const frames = []
      const start = performance.now()
      let last = start

      lenis.scrollTo((endVh / 100) * height, { duration: durationMs / 1000, force: true, easing: (value) => value })

      await new Promise((resolve) => {
        const tick = (now) => {
          frames.push(now - last)
          last = now

          if (now - start < durationMs) {
            requestAnimationFrame(tick)
          } else {
            resolve()
          }
        }

        requestAnimationFrame(tick)
      })

      const sorted = [...frames].sort((a, b) => a - b)

      return {
        average: Math.round(1000 / (frames.reduce((sum, value) => sum + value, 0) / frames.length)),
        p95ms: Math.round(sorted[Math.floor(sorted.length * 0.95)]),
      }
    },
    [from, to],
  )

  console.log(name, JSON.stringify(fps))
}

await browser.close()
spawn("taskkill", ["/pid", String(server.pid), "/f", "/t"], { shell: true, stdio: "ignore" })
