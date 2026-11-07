import { spawn } from "node:child_process"
import { chromium } from "playwright"

const port = 4175
const url = `http://localhost:${port}/?shoot`
const results = []

function report(name, passed, detail = "") {
  results.push(passed)
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`)
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      if ((await fetch(`http://localhost:${port}/`)).ok) {
        return
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  throw new Error("Preview server did not start")
}

async function open(browser, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options })
  const page = await context.newPage()
  const errors = []

  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text())
    }
  })
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto(url)
  await page.waitForFunction(() => window.__loopformReady === true, undefined, { timeout: 30000 })
  await page.waitForFunction(() => document.querySelectorAll("[data-card] img").length >= 10, undefined, { timeout: 60000 })
  await page.waitForTimeout(1200)

  return { context, page, errors }
}

function jump(page, vh) {
  return page.evaluate((value) => {
    const y = (value / 100) * window.innerHeight

    if (window.__lenis) {
      window.__lenis.scrollTo(y, { immediate: true, force: true })
    } else {
      window.scrollTo(0, y)
    }
  }, vh)
}

const server = spawn("npx", ["vite", "preview", "--port", String(port), "--strictPort"], { shell: true, stdio: "ignore" })

try {
  await waitForServer()

  const browser = await chromium.launch({
    channel: "chrome",
    args: ["--use-angle=d3d11", "--ignore-gpu-blocklist"],
  })

  {
    const { context, page, errors } = await open(browser)

    await jump(page, 120)
    await page.waitForTimeout(500)
    const printed = await page.locator("text=/СЛОЙ/").first().textContent()
    await jump(page, 190)
    await page.waitForTimeout(500)
    const printedLater = await page.locator("text=/СЛОЙ/").first().textContent()
    await jump(page, 120)
    await page.waitForTimeout(500)
    const printedBack = await page.locator("text=/СЛОЙ/").first().textContent()
    report("hero print is reversible", printed === printedBack && printed !== printedLater, `${printed} | ${printedLater} | ${printedBack}`)

    await jump(page, 150)
    await page.waitForTimeout(900)
    const scattered = await page.evaluate(() => {
      const chars = [...document.querySelectorAll("h1 .split-char")]
      return chars.filter((char) => char.style.transform && char.style.transform !== "none").length / Math.max(chars.length, 1)
    })
    await jump(page, 60)
    await page.waitForTimeout(1200)
    const assembled = await page.evaluate(() => {
      const chars = [...document.querySelectorAll("h1 .split-char")]
      return chars.every((char) => !/rotate\((?!0deg)/.test(char.style.transform))
    })
    report("hero letters scatter and return", scattered > 0.9 && assembled, `moved ${(scattered * 100).toFixed(0)}%`)

    for (const vh of [205, 305, 405, 505, 205, 505, 305]) {
      await jump(page, vh)
      await page.waitForTimeout(60)
    }

    await page.waitForFunction(
      () =>
        getComputedStyle(document.querySelector("[data-section='collection']")).getPropertyValue("--collection-bg") === "rgb(47, 111, 78)" &&
        [...document.querySelectorAll("[data-name]")].filter((node) => getComputedStyle(node).visibility === "visible").length === 1,
      undefined,
      { timeout: 12000 },
    ).catch(() => undefined)
    await page.waitForTimeout(600)
    const state = await page.evaluate(() => ({
      background: getComputedStyle(document.querySelector("[data-section='collection']")).getPropertyValue("--collection-bg"),
      step: [...document.querySelectorAll("[data-section='collection'] p")].map((node) => node.textContent).find((text) => /^0\d \/ 04$/.test(text ?? "")),
      visibleNames: [...document.querySelectorAll("[data-name]")].filter((node) => getComputedStyle(node).visibility === "visible").length,
    }))
    report(
      "fast collection scroll settles on target",
      state.step === "02 / 04" && state.visibleNames === 1 && state.background === "rgb(47, 111, 78)",
      JSON.stringify(state),
    )

    await page.locator("[aria-label='QUM']").first().click({ force: true })
    await page.waitForTimeout(2600)
    const afterThumb = await page.evaluate(() => [...document.querySelectorAll("[data-section='collection'] p")].map((node) => node.textContent).find((text) => /^0\d \/ 04$/.test(text ?? "")))
    report("thumbnail click scrolls to model", afterThumb === "03 / 04", afterThumb)

    const heightBefore = await page.evaluate(() => document.documentElement.scrollHeight)
    await page.locator("button:has-text('Можно ставить на улице?')").evaluate((node) => node.click())
    await page.waitForTimeout(900)
    const expanded = await page.locator("button:has-text('Можно ставить на улице?')").getAttribute("aria-expanded")
    report("accordion opens", expanded === "true", `height ${heightBefore}`)

    await page.evaluate(() => document.querySelector("form button[type='submit']").click())
    await page.waitForTimeout(200)
    const invalid = await page.locator("input[aria-invalid='true']").count()
    await page.locator("input[name='name']").fill("Айгерим")
    await page.locator("input[name='contact']").fill("@demo")
    await page.locator("input[name='city']").fill("Астана")
    await page.evaluate(() => document.querySelector("form button[type='submit']").click())
    await page.waitForTimeout(300)
    const toast = await page.locator("[role='status']:has-text('Заявка отправлена')").count()
    report("form validates and shows toast", invalid === 3 && toast === 1, `invalid ${invalid}`)

    await page.evaluate(() => [...document.querySelectorAll("button")].find((node) => node.textContent === "Посмотреть паспорт").click())
    await page.waitForTimeout(400)
    const dialogOpen = await page.evaluate(() => document.querySelector("dialog").open)
    await page.evaluate(() => [...document.querySelectorAll("dialog button")].find((node) => node.textContent === "Закрыть").click())
    await page.waitForTimeout(300)
    const dialogClosed = await page.evaluate(() => !document.querySelector("dialog").open)
    report("passport modal opens and closes", dialogOpen && dialogClosed)

    await page.evaluate(() => {
      const click = (label) => [...document.querySelectorAll("[data-section='configurator'] button")].find((node) => node.textContent === label || node.getAttribute("aria-label") === label).click()
      click("Барный 75")
      click("Терраццо")
      click("Рельеф")
      click("Войлочная")
      click("135°")
    })
    await page.waitForTimeout(400)
    const configurator = await page.evaluate(() => ({
      price: document.querySelector("[data-section='configurator'] dd .sr-only").textContent,
      link: [...document.querySelectorAll("[data-section='configurator'] a")].find((node) => node.textContent === "Отправить заявку").href,
    }))
    const decoded = Buffer.from(configurator.link.split("start=")[1], "base64url").toString()
    report("configurator recalculates and builds link", configurator.price === "75 700 ₸" && decoded === "tolqyn.terrazzo.bar.relief.felt.135", `${configurator.price} ${decoded}`)

    const pageText = await page.evaluate(() => document.body.textContent)
    report("images carry no AI caption", !pageText.includes("Изображение создано ИИ"))

    const frames = await page.evaluate(() =>
      [...document.querySelectorAll("[data-section='process'] figure")].map((node) => {
        const box = node.getBoundingClientRect()

        return `${Math.round(box.width)}x${Math.round(box.height)}`
      }),
    )
    report("process steps share one layout", frames.length === 5 && new Set(frames).size === 1, frames.join(" "))

    const missing = await page.evaluate(async () => {
      const sources = [...document.querySelectorAll("[data-section='catalog'] img, [data-section='process'] img")].map((node) => node.src)
      const answers = await Promise.all(sources.filter((source) => !source.startsWith("blob:")).map((source) => fetch(source).then((response) => response.ok)))

      return { total: answers.length, failed: answers.filter((value) => !value).length }
    })
    report("catalog and process photos load", missing.total >= 13 && missing.failed === 0, JSON.stringify(missing))

    const added = await page.evaluate(() => ["philosophy", "advantages", "competition"].every((id) => document.querySelector(`[data-section='${id}']`)?.textContent.length > 200))
    report("business text sections are on the page", added)
    const tiles = await page.evaluate(() =>
      [...document.querySelectorAll("[data-section='configurator'] button[aria-pressed] img")].map((node) => {
        const box = node.parentElement.getBoundingClientRect()

        return `${Math.round(box.width)}x${Math.round(box.height)}`
      }),
    )
    report("configurator model tiles share one size", tiles.length === 10 && new Set(tiles).size === 1 && tiles[0].split("x")[0] === tiles[0].split("x")[1], [...new Set(tiles)].join(" "))
    const moved = await page.evaluate(async () => {
      const top = document.querySelector("[data-section='process']").getBoundingClientRect().top + window.scrollY

      window.__lenis.scrollTo(top, { immediate: true, force: true })
      await new Promise((resolve) => setTimeout(resolve, 900))

      return document.querySelector("[data-anchor='process-caps']").getBoundingClientRect().toJSON()
    })
    const clip = { x: moved.x, y: moved.y, width: moved.width, height: moved.height }
    const firstFrame = await page.screenshot({ clip })
    await page.waitForTimeout(1200)
    const secondFrame = await page.screenshot({ clip })
    report("process caps keep moving", !firstFrame.equals(secondFrame))
    report("no console errors on desktop", errors.length === 0, errors.slice(0, 3).join(" | "))
    await context.close()
  }

  {
    const { context, page, errors } = await open(browser)

    await page.keyboard.press("p")
    await page.waitForTimeout(1500)
    const headerHidden = await page.evaluate(() => getComputedStyle(document.querySelector("header")).opacity === "0")
    const seen = []
    let previous = -1

    for (let index = 0; index < 48; index += 1) {
      await page.keyboard.press("ArrowRight")
      await page.waitForTimeout(200)
      await page.waitForFunction(() => !window.__lenis.isScrolling, undefined, { timeout: 20000 })
      await page.waitForTimeout(150)

      const position = await page.evaluate(() => Math.round(window.scrollY))
      const counter = await page.evaluate(() => [...document.querySelectorAll("p")].map((node) => node.textContent).find((text) => /^\d\d \/ 18$/.test(text ?? "")))

      seen.push(counter)

      if (position === previous) {
        break
      }

      previous = position
    }

    const atEnd = await page.evaluate(() => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4)
    const unique = new Set(seen)
    report("presentation walks every section to the end", headerHidden && atEnd && unique.size >= 14, `frames ${seen.length}, sections ${unique.size}, end ${atEnd}`)

    await page.keyboard.press("ArrowLeft")
    await page.waitForTimeout(300)
    await page.waitForFunction(() => !window.__lenis.isScrolling, undefined, { timeout: 20000 })
    const back = await page.evaluate(() => window.scrollY + window.innerHeight < document.documentElement.scrollHeight - 4)
    await page.keyboard.press("Home")
    await page.waitForTimeout(300)
    await page.waitForFunction(() => !window.__lenis.isScrolling, undefined, { timeout: 30000 })
    await page.waitForTimeout(200)
    const home = await page.evaluate(() => window.scrollY < 4)
    report("presentation left and home keys work", back && home)
    report("no console errors in presentation", errors.length === 0, errors.slice(0, 3).join(" | "))
    await context.close()
  }

  {
    const { context, page, errors } = await open(browser, { reducedMotion: "reduce" })
    const state = await page.evaluate(() => ({
      lenis: Boolean(window.__lenis),
      sticky: getComputedStyle(document.querySelector("[data-sticky]")).position,
      height: document.documentElement.scrollHeight / window.innerHeight,
      split: document.querySelectorAll("h1 .split-char").length,
    }))
    report("reduced motion removes lenis, sticky and letter split", !state.lenis && state.sticky === "relative" && state.split === 0, JSON.stringify(state))
    report("no console errors with reduced motion", errors.length === 0, errors.slice(0, 3).join(" | "))
    await context.close()
  }

  {
    const { context, page, errors } = await open(browser, { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
    const sticky = await page.evaluate(() =>
      ["collection", "problem", "melt", "process", "passport", "configurator", "manifesto"].every(
        (id) => getComputedStyle(document.querySelector(`[data-section='${id}'] [data-sticky]`)).position === "sticky",
      ),
    )
    report("phone keeps every sticky scene", sticky)

    await jump(page, 305)
    await page.waitForFunction(
      () => getComputedStyle(document.querySelector("[data-section='collection']")).getPropertyValue("--collection-bg") === "rgb(47, 111, 78)",
      undefined,
      { timeout: 8000 },
    ).catch(() => undefined)
    const phoneBackground = await page.evaluate(() => getComputedStyle(document.querySelector("[data-section='collection']")).getPropertyValue("--collection-bg"))
    report("phone collection switches models", phoneBackground === "rgb(47, 111, 78)", phoneBackground)

    const processTop = await page.evaluate(() => (document.querySelector("[data-section='process']").getBoundingClientRect().top + window.scrollY) / window.innerHeight * 100)

    await jump(page, processTop + 100)
    await page.waitForTimeout(1200)
    const shift = await page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector("[data-section='process'] ol")).transform).m41)
    report("phone process moves horizontally", shift < -100, String(Math.round(shift)))

    const catalog = await page.evaluate(() => {
      const cards = [...document.querySelectorAll("[data-card]")].slice(0, 2).map((card) => card.getBoundingClientRect())
      const caption = document.querySelector("[data-card] h3").getBoundingClientRect()
      return { gap: cards[1].left - cards[0].right, inside: caption.right <= cards[0].right }
    })
    report("phone catalog captions stay inside their card", catalog.gap >= 12 && catalog.inside, JSON.stringify(catalog))
    const configuratorTop = await page.evaluate(() => (document.querySelector("[data-section='configurator']").getBoundingClientRect().top + window.scrollY) / window.innerHeight * 100)

    await jump(page, configuratorTop + 20)
    await page.waitForTimeout(1500)
    const fits = await page.evaluate(() => {
      const section = document.querySelector("[data-section='configurator']")
      const inside = (selector) => {
        const element = [...section.querySelectorAll(selector)].find((node) => node.getClientRects().length > 0)
        const rect = element?.getBoundingClientRect()
        return Boolean(rect) && rect.top >= 0 && rect.bottom <= window.innerHeight
      }

      return { anchor: inside("[data-anchor='configurator-product']"), tabs: inside("[role='tablist']"), results: inside("dl"), submit: inside("a") }
    })
    report("phone configurator fits one screen", Object.values(fits).every(Boolean), JSON.stringify(fits))

    const angleVisible = await page.evaluate(() => {
      const button = [...document.querySelectorAll("[data-section='configurator'] button")].find((node) => node.textContent === "90°")
      const rect = button.getBoundingClientRect()
      const anchor = document.querySelector("[data-anchor='configurator-product']").getBoundingClientRect()
      return rect.height > 0 && rect.bottom <= window.innerHeight && anchor.height > 200
    })
    report("phone angle buttons sit beside the model", angleVisible)

    await page.evaluate(() => [...document.querySelectorAll("[data-section='configurator'] button")].find((node) => node.textContent === "Модель").click())
    await page.evaluate(() => [...document.querySelectorAll("[data-section='configurator'] button")].find((node) => node.textContent.includes("QUM")).click())
    await page.waitForTimeout(1200)
    const switched = await page.evaluate(() => document.querySelector("[data-section='configurator'] h2").textContent + " | " + document.querySelector("[data-section='configurator'] dd .sr-only").textContent)
    report("phone configurator switches model", switched.includes("QUM") && switched.includes("189 000"), switched)
    report("no console errors on phone", errors.length === 0, errors.slice(0, 3).join(" | "))
    await context.close()
  }

  for (const width of [390, 768, 1024, 1440, 1920]) {
    const height = width < 768 ? 844 : 900
    const { context, page, errors } = await open(browser, { viewport: { width, height } })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    report(`no horizontal overflow at ${width}`, overflow <= 0 && errors.length === 0, `overflow ${overflow}`)
    await context.close()
  }

  await browser.close()
} finally {
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(server.pid), "/f", "/t"], { shell: true, stdio: "ignore" })
  } else {
    server.kill()
  }
}

console.log(`${results.filter(Boolean).length} / ${results.length} passed`)
