import { useRef } from "react"
import { gsap, useGSAP } from "@/animation/gsap"
import { ru } from "@/content/ru"
import { readProgress, useScrollStore } from "@/state/scrollStore"
import styles from "./MeltHeading.module.scss"

function ramp(value: number, from: number, to: number) {
  return Math.min(1, Math.max(0, (value - from) / (to - from)))
}

export function MeltHeading() {
  const rootRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useScrollStore((state) => state.reducedMotion)

  useGSAP(
    () => {
      const root = rootRef.current

      if (!root || reducedMotion) {
        return
      }

      const lines = gsap.utils.toArray<HTMLElement>("[data-melt-line]", root)

      const update = () => {
        const flow = readProgress("meltFlow")
        const visible = flow > 0.06 && flow < 0.86

        root.style.visibility = visible ? "visible" : "hidden"

        if (!visible) {
          return
        }

        lines.forEach((line, index) => {
          const reveal = ramp(flow, 0.08 + index * 0.035, 0.22 + index * 0.035)
          const leave = ramp(flow, 0.64 + index * 0.025, 0.76 + index * 0.025)

          line.style.transform = `translateY(${(1 - reveal) * 105 - leave * 105}%)`
        })
      }

      gsap.ticker.add(update)

      return () => gsap.ticker.remove(update)
    },
    { dependencies: [reducedMotion] },
  )

  return (
    <div ref={rootRef} className={styles.root} aria-hidden="true">
      {ru.melt.lines.map((line) => (
        <span key={line} className={styles.mask}>
          <span data-melt-line className={styles.line}>
            {line}
          </span>
        </span>
      ))}
    </div>
  )
}
