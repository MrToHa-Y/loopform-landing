import { useRef } from "react"
import { gsap, useGSAP } from "@/animation/gsap"
import { durations, eases } from "@/animation/tokens"
import { formatNumber } from "@/components/Counter/formatNumber"
import { useScrollStore } from "@/state/scrollStore"

interface CounterProps {
  value: number
  decimals: number
  prefix?: string
  suffix?: string
  display: string
  className?: string
}

export function Counter({ value, decimals, prefix = "", suffix = "", display, className }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const layoutReady = useScrollStore((state) => state.layoutReady)
  const reducedMotion = useScrollStore((state) => state.reducedMotion)

  useGSAP(
    () => {
      const element = ref.current

      if (!layoutReady || !element || reducedMotion) {
        return
      }

      const state = { current: 0 }
      const write = () => {
        element.textContent = `${prefix}${formatNumber(state.current, decimals)}${suffix}`
      }

      write()
      gsap.to(state, {
        current: value,
        duration: durations.counter,
        ease: eases.out,
        onUpdate: write,
        onComplete: () => {
          element.textContent = display
        },
        scrollTrigger: { trigger: element, start: "top 92%", once: true },
      })
    },
    { dependencies: [layoutReady, reducedMotion] },
  )

  return (
    <>
      <span className="sr-only">{display}</span>
      <span ref={ref} className={className} aria-hidden="true">
        {display}
      </span>
    </>
  )
}
