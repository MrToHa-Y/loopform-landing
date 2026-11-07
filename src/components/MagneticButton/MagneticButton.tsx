import { useRef } from "react"
import type { PointerEvent, ReactNode } from "react"
import { gsap } from "@/animation/gsap"
import { durations, eases } from "@/animation/tokens"
import { useScrollStore } from "@/state/scrollStore"
import styles from "./MagneticButton.module.scss"

interface MagneticButtonProps {
  children: ReactNode
  className?: string
}

const strength = 0.3

export function MagneticButton({ children, className }: MagneticButtonProps) {
  const ref = useRef<HTMLSpanElement>(null)

  const handleMove = (event: PointerEvent<HTMLSpanElement>) => {
    const element = ref.current

    if (!element || event.pointerType !== "mouse" || useScrollStore.getState().reducedMotion) {
      return
    }

    const bounds = element.getBoundingClientRect()
    const x = (event.clientX - bounds.left - bounds.width / 2) * strength
    const y = (event.clientY - bounds.top - bounds.height / 2) * strength

    gsap.to(element, { x, y, duration: durations.fast, ease: eases.out, overwrite: "auto" })
  }

  const handleLeave = () => {
    if (ref.current) {
      gsap.to(ref.current, { x: 0, y: 0, duration: durations.slow, ease: eases.elastic, overwrite: "auto" })
    }
  }

  return (
    <span
      ref={ref}
      className={`${styles.root} ${className ?? ""}`}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      {children}
    </span>
  )
}
