import { useEffect } from "react"
import { scrollToPosition } from "@/animation/lenis"
import { presentationPoints, presentationTransition } from "@/animation/tokens"
import { ru } from "@/content/ru"
import type { SectionId } from "@/content/types"
import { useScrollStore } from "@/state/scrollStore"

interface Frame {
  y: number
  section: number
}

let moving = false
let queued = 0

function sectionTop(id: SectionId) {
  const element = document.querySelector<HTMLElement>(`[data-section="${id}"]`)
  return element ? element.getBoundingClientRect().top + window.scrollY : 0
}

function vh(value: number) {
  return (value / 100) * window.innerHeight
}

function sectionIndex(id: SectionId) {
  return ru.sections.findIndex((section) => section.id === id)
}

export function buildFrames() {
  const { reducedMotion } = useScrollStore.getState()
  const frames: Frame[] = []
  const add = (id: SectionId, y: number) => frames.push({ y, section: sectionIndex(id) })
  const points = presentationPoints
  const detailed = !reducedMotion

  add("intro", 0)

  if (detailed) {
    add("hero", vh(points.heroStart))
    add("hero", vh(points.heroEnd))

    const collection = sectionTop("collection")

    for (let step = 0; step < points.collectionSteps; step += 1) {
      add("collection", collection + vh(step * points.collectionStep + 5))
    }

    add("catalog", sectionTop("catalog"))

    const problem = sectionTop("problem")

    add("problem", problem)
    add("problem", problem + vh(points.problemHeap))
    add("problem", problem + vh(points.problemShape))

    const melt = sectionTop("melt")

    add("melt", melt)
    add("melt", melt + vh(points.meltDeep))

    const process = sectionTop("process")

    for (let step = 0; step < points.processSteps; step += 1) {
      add("process", process + vh((points.processSpan * step) / (points.processSteps - 1)))
    }

    const passport = sectionTop("passport")

    for (let step = 0; step < points.passportItems; step += 1) {
      add("passport", passport + vh((points.passportSpan * (step + 0.5)) / points.passportItems))
    }
  } else {
    const ids: SectionId[] = ["hero", "collection", "catalog", "problem", "melt", "process", "passport"]
    ids.forEach((id) => add(id, sectionTop(id)))
  }

  const tail: SectionId[] = ["configurator", "manifesto", "business", "market", "faq", "cta"]
  tail.forEach((id) => add(id, sectionTop(id)))

  frames.push({
    y: document.documentElement.scrollHeight - window.innerHeight,
    section: sectionIndex("footer"),
  })

  return frames
}

function syncSection() {
  const frames = buildFrames()
  const position = window.scrollY + 8
  const current = frames.filter((frame) => frame.y <= position).at(-1)

  if (current) {
    useScrollStore.getState().set({ presentationSection: current.section })
  }
}

function moveTo(target: number) {
  moving = true
  scrollToPosition(target, {
    duration: presentationTransition.duration,
    onComplete: () => {
      moving = false
      syncSection()

      if (queued !== 0) {
        const direction = queued
        queued = 0
        step(direction)
      }
    },
  })
}

function step(direction: number) {
  if (moving) {
    queued = direction
    return
  }

  const frames = buildFrames()
  const position = window.scrollY
  const target =
    direction > 0
      ? frames.find((frame) => frame.y > position + 4)
      : frames.filter((frame) => frame.y < position - 4).at(-1)

  if (target) {
    moveTo(target.y)
  }
}

export function goToSection(index: number) {
  const target = buildFrames().find((frame) => frame.section === index)

  if (target) {
    queued = 0
    moveTo(target.y)
  }
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen()
    return
  }

  document.documentElement.requestFullscreen()
}

export function usePresentation() {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement

      if (target.closest("input, textarea, select, dialog")) {
        return
      }

      const store = useScrollStore.getState()
      const key = event.key.toLowerCase()

      if (key === "p" || key === "з") {
        store.set({ presentationMode: !store.presentationMode })
        syncSection()
        return
      }

      if (key === "f" || key === "а") {
        toggleFullscreen()
        return
      }

      if (!store.presentationMode) {
        return
      }

      const frames = buildFrames()

      if (event.key === "ArrowRight" || event.key === " " || event.key === "PageDown") {
        event.preventDefault()
        step(1)
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault()
        step(-1)
      } else if (event.key === "Home") {
        event.preventDefault()
        moveTo(frames[0]?.y ?? 0)
      } else if (event.key === "End") {
        event.preventDefault()
        moveTo(frames.at(-1)?.y ?? 0)
      }
    }

    const handleScroll = () => {
      if (useScrollStore.getState().presentationMode) {
        syncSection()
      }
    }

    window.addEventListener("keydown", handleKey)
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("keydown", handleKey)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])
}
