import { useEffect, useRef, useState } from "react"
import { gsap } from "@/animation/gsap"
import { setScrollLocked } from "@/animation/lenis"
import { durations, eases, staggers } from "@/animation/tokens"
import { ru } from "@/content/ru"
import { loadState, useScrollStore } from "@/state/scrollStore"
import styles from "./Preloader.module.scss"

const bandCount = 8
const printSteps = 12
const stageTimeoutMs = 6000

function formatLayer(value: number) {
  return String(value).padStart(3, "0")
}

export function Preloader() {
  const [mounted, setMounted] = useState(true)
  const rootRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLParagraphElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const { preloader } = ru

  useEffect(() => {
    const start = performance.now()
    let shown = 0
    let leaving = false

    setScrollLocked(true)

    const leave = () => {
      leaving = true
      gsap.ticker.remove(update)

      const store = useScrollStore.getState()
      const bands = gsap.utils.toArray<HTMLElement>("[data-band]", rootRef.current)
      const timeline = gsap.timeline({
        onComplete: () => {
          setScrollLocked(false)
          setMounted(false)
        },
      })

      window.__loopformReady = true

      if (store.reducedMotion) {
        timeline.to(rootRef.current, { opacity: 0, duration: durations.fast })
        timeline.call(() => store.set({ preloaderDone: true }), [], 0)
        return
      }

      timeline.to(contentRef.current, { opacity: 0, duration: durations.instant, ease: eases.linear })
      timeline.call(() => store.set({ preloaderDone: true }))
      bands.forEach((band, index) => {
        timeline.to(
          band,
          {
            xPercent: index % 2 === 0 ? -101 : 101,
            duration: durations.print,
            ease: eases.inOut,
          },
          durations.instant + index * staggers.bands,
        )
      })
    }

    const update = () => {
      const state = useScrollStore.getState()
      const elapsed = (performance.now() - start) / 1000
      const stageTimedOut = performance.now() - start > stageTimeoutMs
      const stage = state.stageReady || stageTimedOut ? 1 : 0
      const fonts = state.fontsReady ? 1 : 0
      const assets = stageTimedOut ? 1 : loadState.assets
      const real = fonts * 0.3 + stage * 0.4 + assets * 0.3
      const paced = Math.min(elapsed / durations.preloaderMinimum, 1)
      const target = Math.min(real, paced)

      shown += (target - shown) * 0.2

      if (target >= 1 && shown > 0.985) {
        shown = 1
      }

      const layer = Math.max(1, Math.round(shown * preloader.layerTotal))
      const step = Math.round(shown * printSteps)

      if (counterRef.current) {
        counterRef.current.textContent = formatLayer(layer)
      }

      if (logoRef.current) {
        logoRef.current.style.clipPath = `inset(${100 - (step / printSteps) * 100}% 0 0 0)`
      }

      if (shown === 1 && !leaving) {
        leave()
      }
    }

    gsap.ticker.add(update)

    return () => {
      gsap.ticker.remove(update)
    }
  }, [preloader.layerTotal])

  if (!mounted) {
    return null
  }

  return (
    <div ref={rootRef} className={styles.root} role="status" aria-label={preloader.brand}>
      {Array.from({ length: bandCount }, (_, index) => (
        <span key={index} data-band className={styles.band} />
      ))}
      <div ref={contentRef} className={styles.content}>
        <p ref={logoRef} className={styles.logo}>
          {preloader.brand}
        </p>
        <p className={styles.counter}>
          {preloader.layerLabel} <span ref={counterRef}>001</span> / {preloader.layerTotal}
        </p>
      </div>
    </div>
  )
}
