import { useEffect, useLayoutEffect } from "react"
import type { ReactNode } from "react"
import { ScrollTrigger } from "@/animation/gsap"
import { createLenis, destroyLenis } from "@/animation/lenis"
import { usePresentation } from "@/animation/presentation"
import { useScrollStore } from "@/state/scrollStore"

const mobileQuery = "(max-width: 767.98px)"
const reducedQuery = "(prefers-reduced-motion: reduce)"

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  const set = useScrollStore((state) => state.set)
  const fontsReady = useScrollStore((state) => state.fontsReady)

  useLayoutEffect(() => {
    history.scrollRestoration = "manual"
    window.scrollTo(0, 0)

    const mobile = window.matchMedia(mobileQuery)
    const reduced = window.matchMedia(reducedQuery)
    const sync = () => set({ compact: mobile.matches, reducedMotion: reduced.matches })

    sync()
    mobile.addEventListener("change", sync)
    reduced.addEventListener("change", sync)

    if (!reduced.matches) {
      createLenis()
    }

    document.fonts.ready.then(() => set({ fontsReady: true }))

    return () => {
      mobile.removeEventListener("change", sync)
      reduced.removeEventListener("change", sync)
      destroyLenis()
    }
  }, [set])

  useEffect(() => {
    if (!fontsReady) {
      return
    }

    const frame = requestAnimationFrame(() => {
      set({ layoutReady: true })
      ScrollTrigger.refresh()
    })

    return () => cancelAnimationFrame(frame)
  }, [fontsReady, set])

  useEffect(() => {
    let timer = 0
    let width = window.innerWidth

    const handleResize = () => {
      if (window.innerWidth === width) {
        return
      }

      width = window.innerWidth
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        useScrollStore.setState((state) => ({ viewportVersion: state.viewportVersion + 1 }))
        ScrollTrigger.refresh()
      }, 160)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  usePresentation()

  return children
}
