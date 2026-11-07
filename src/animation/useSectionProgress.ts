import type { RefObject } from "react"
import { ScrollTrigger, useGSAP } from "@/animation/gsap"
import { segments } from "@/animation/tokens"
import type { SegmentKey, SegmentSection } from "@/animation/tokens"
import { progress, useScrollStore } from "@/state/scrollStore"

const isDebug = window.location.search.includes("debug")

function offset(vh: number) {
  const pixels = Math.round((vh / 100) * window.innerHeight)
  return pixels >= 0 ? `top+=${pixels} top` : `top-=${Math.abs(pixels)} top`
}

export function useSectionProgress(ref: RefObject<HTMLElement | null>, section: SegmentSection) {
  const layoutReady = useScrollStore((state) => state.layoutReady)

  useGSAP(
    () => {
      const trigger = ref.current

      if (!layoutReady || !trigger) {
        return
      }

      const entries = Object.entries(segments[section]) as [SegmentKey, readonly [number, number]][]

      entries.forEach(([key, [from, to]]) => {
        ScrollTrigger.create({
          trigger,
          start: () => offset(from),
          end: () => offset(to),
          invalidateOnRefresh: true,
          markers: isDebug,
          id: key,
          onUpdate: (self) => {
            progress[key] = self.progress
          },
          onRefresh: (self) => {
            progress[key] = self.progress
          },
        })
      })
    },
    { dependencies: [layoutReady, section] },
  )
}
