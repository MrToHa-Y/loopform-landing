import { useLayoutEffect, useRef } from "react"
import type { ElementType, RefObject } from "react"
import { useScrollStore } from "@/state/scrollStore"
import styles from "./FitText.module.scss"

interface FitTextProps {
  as?: ElementType
  lines: string[]
  widthVw: number
  maxHeightVh?: number
  lineHeight?: number
  lineCapsVw?: number[]
  className?: string
  masked?: boolean
  rootRef?: RefObject<HTMLElement | null>
}

const probeSize = 100

export function FitText({
  as: Tag = "div",
  lines,
  widthVw,
  maxHeightVh,
  lineHeight = 0.82,
  lineCapsVw,
  className,
  masked = true,
  rootRef,
}: FitTextProps) {
  const ownRef = useRef<HTMLElement | null>(null)
  const ref = rootRef ?? ownRef
  const fontsReady = useScrollStore((state) => state.fontsReady)
  const viewportVersion = useScrollStore((state) => state.viewportVersion)
  const capsKey = lineCapsVw?.join("|")
  const linesKey = lines.join("|")

  useLayoutEffect(() => {
    const root = ref.current

    if (!root) {
      return
    }

    const lineElements = Array.from(root.querySelectorAll<HTMLElement>("[data-fit-line]"))
    const maskElements = Array.from(root.querySelectorAll<HTMLElement>("[data-fit-mask]"))
    const viewportWidth = document.documentElement.clientWidth
    const targetWidth = (widthVw / 100) * viewportWidth

    root.style.fontSize = `${probeSize}px`
    maskElements.forEach((element) => {
      element.style.fontSize = ""
    })

    const widths = lineElements.map((element) => element.getBoundingClientRect().width)

    if (capsKey) {
      maskElements.forEach((element, index) => {
        const fitted = (probeSize * targetWidth) / (widths[index] || 1)
        const cap = ((Number(capsKey.split("|")[index]) || widthVw) / 100) * viewportWidth
        element.style.fontSize = `${Math.min(fitted, cap)}px`
      })
      return
    }

    let size = (probeSize * targetWidth) / Math.max(...widths, 1)

    if (maxHeightVh) {
      const limit = ((maxHeightVh / 100) * window.innerHeight) / (lineElements.length * lineHeight)
      size = Math.min(size, limit)
    }

    root.style.fontSize = `${size}px`
  }, [ref, widthVw, maxHeightVh, lineHeight, capsKey, linesKey, fontsReady, viewportVersion])

  return (
    <Tag
      ref={ref}
      className={`${styles.root} ${className ?? ""}`}
      style={{ lineHeight }}
    >
      <span className="sr-only">{lines.join(" ")}</span>
      {lines.map((line) => (
        <span key={line} data-fit-mask className={masked ? styles.mask : styles.plain} aria-hidden="true">
          <span data-line className={styles.line}>
            <span data-fit-line data-line-inner className={styles.inner}>
              {line}
            </span>
          </span>
        </span>
      ))}
    </Tag>
  )
}
