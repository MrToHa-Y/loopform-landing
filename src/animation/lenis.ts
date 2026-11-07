import Lenis from "lenis"
import { ScrollTrigger, gsap } from "@/animation/gsap"
import { lenisOptions } from "@/animation/tokens"

declare global {
  interface Window {
    __lenis?: Lenis
    __loopformReady?: boolean
  }
}

let instance: Lenis | null = null
let tick: ((time: number) => void) | null = null

export function createLenis() {
  if (instance) {
    return instance
  }

  const lenis = new Lenis({ ...lenisOptions })

  lenis.on("scroll", ScrollTrigger.update)
  tick = (time: number) => lenis.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  instance = lenis

  if (import.meta.env.DEV || window.location.search.includes("shoot")) {
    window.__lenis = lenis
  }

  return lenis
}

export function destroyLenis() {
  if (tick) {
    gsap.ticker.remove(tick)
    tick = null
  }

  instance?.destroy()
  instance = null
}

export function getLenis() {
  return instance
}

export function getScrollVelocity() {
  return instance?.velocity ?? 0
}

export function scrollToPosition(target: number, options?: { duration?: number; immediate?: boolean; onComplete?: () => void }) {
  if (instance) {
    instance.scrollTo(target, {
      duration: options?.duration ?? 1.2,
      immediate: options?.immediate ?? false,
      force: true,
      onComplete: options?.onComplete,
    })
    return
  }

  window.scrollTo({ top: target })
  options?.onComplete?.()
}

export function scrollToSection(id: string, options?: { duration?: number }) {
  const element = document.querySelector<HTMLElement>(`[data-section="${id}"]`)

  if (!element) {
    return
  }

  const top = element.getBoundingClientRect().top + window.scrollY
  scrollToPosition(top, options)
}

export function setScrollLocked(locked: boolean) {
  if (locked) {
    instance?.stop()
    return
  }

  instance?.start()
}
