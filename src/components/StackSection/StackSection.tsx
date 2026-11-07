import type { CSSProperties, ReactNode, RefObject } from "react"
import type { SectionId, ThemeName } from "@/content/types"
import styles from "./StackSection.module.scss"

interface StackSectionProps {
  id: SectionId
  theme: ThemeName
  label: string
  heightVh?: number
  overlap?: "always" | "desktop" | "none"
  flowOnMobile?: boolean
  themeOffsetVh?: number
  className?: string
  stickyClassName?: string
  sectionRef?: RefObject<HTMLElement | null>
  children: ReactNode
}

export function StackSection({
  id,
  theme,
  label,
  heightVh,
  overlap = "none",
  flowOnMobile = false,
  themeOffsetVh,
  className,
  stickyClassName,
  sectionRef,
  children,
}: StackSectionProps) {
  const style = {
    "--stack-height": heightVh ? `${heightVh}vh` : "auto",
    "--stack-layer": `var(--layer-${id})`,
  } as CSSProperties

  const sectionClasses = [
    styles.section,
    overlap === "always" ? styles.overlap : "",
    overlap === "desktop" ? styles.overlapDesktop : "",
    flowOnMobile ? styles.flowOnMobile : "",
    className ?? "",
  ]

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-label={label}
      data-section={id}
      data-theme={theme}
      data-theme-offset={themeOffsetVh}
      className={sectionClasses.join(" ")}
      style={style}
    >
      {heightVh ? (
        <div data-sticky className={`${styles.sticky} ${stickyClassName ?? ""}`}>
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  )
}
