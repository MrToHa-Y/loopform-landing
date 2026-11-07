import { useRef } from "react"
import type { ElementType, ReactNode } from "react"
import { SplitText, gsap, useGSAP } from "@/animation/gsap"
import { durations, eases, staggers } from "@/animation/tokens"
import { useScrollStore } from "@/state/scrollStore"

interface SplitLinesProps {
  as?: ElementType
  className?: string
  children: ReactNode
}

export function SplitLines({ as: Tag = "div", className, children }: SplitLinesProps) {
  const ref = useRef<HTMLElement | null>(null)
  const layoutReady = useScrollStore((state) => state.layoutReady)
  const reducedMotion = useScrollStore((state) => state.reducedMotion)

  useGSAP(
    () => {
      const element = ref.current

      if (!layoutReady || !element) {
        return
      }

      if (reducedMotion) {
        gsap.from(element, {
          opacity: 0,
          duration: durations.fast,
          scrollTrigger: { trigger: element, start: "top 90%", once: true },
        })
        return
      }

      const split = SplitText.create(element, {
        type: "lines",
        mask: "lines",
        linesClass: "split-line",
        aria: "auto",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 105,
            duration: durations.reveal,
            stagger: staggers.lines,
            ease: eases.out,
            scrollTrigger: { trigger: element, start: "top 88%", once: true },
          }),
      })

      return () => split.revert()
    },
    { dependencies: [layoutReady, reducedMotion] },
  )

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}
