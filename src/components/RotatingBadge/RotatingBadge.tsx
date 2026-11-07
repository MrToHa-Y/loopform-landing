import { useRef } from "react"
import { gsap, useGSAP } from "@/animation/gsap"
import { getScrollVelocity } from "@/animation/lenis"
import { ru } from "@/content/ru"
import { useScrollStore } from "@/state/scrollStore"
import styles from "./RotatingBadge.module.scss"

const baseSpeed = 0.25
const velocityGain = 0.12
const maxBoost = 6

export function RotatingBadge() {
  const ringRef = useRef<SVGSVGElement>(null)
  const reducedMotion = useScrollStore((state) => state.reducedMotion)
  const presentationMode = useScrollStore((state) => state.presentationMode)
  const collectionActive = useScrollStore((state) => state.collectionActive)

  useGSAP(
    () => {
      const ring = ringRef.current

      if (!ring || reducedMotion) {
        return
      }

      let rotation = 0
      const setRotation = gsap.quickSetter(ring, "rotation", "deg")
      const spin = () => {
        const boost = Math.min(Math.abs(getScrollVelocity()) * velocityGain, maxBoost)
        rotation += baseSpeed + boost
        setRotation(rotation)
      }

      gsap.ticker.add(spin)

      return () => gsap.ticker.remove(spin)
    },
    { dependencies: [reducedMotion] },
  )

  return (
    <div
      className={`${styles.root} ${presentationMode ? styles.hidden : ""} ${collectionActive ? styles.lifted : ""}`}
      aria-hidden="true"
    >
      <svg ref={ringRef} className={styles.ring} viewBox="0 0 100 100">
        <defs>
          <path id="badge-circle" d="M50 50m-38 0a38 38 0 1 1 76 0a38 38 0 1 1-76 0" />
        </defs>
        <text className={styles.text}>
          <textPath href="#badge-circle" textLength="236">
            {ru.brand.badge}
          </textPath>
        </text>
      </svg>
      <span className={styles.monogram}>{ru.brand.monogram}</span>
    </div>
  )
}
