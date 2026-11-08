import { useRef } from "react"
import { sectionHeights } from "@/animation/tokens"
import { useSectionProgress } from "@/animation/useSectionProgress"
import { StackSection } from "@/components/StackSection/StackSection"
import { ru } from "@/content/ru"
import { sectionTitle } from "@/content/sectionTitle"
import styles from "./Melt.module.scss"

export function Melt() {
  const sectionRef = useRef<HTMLElement>(null)
  const { melt } = ru

  useSectionProgress(sectionRef, "melt")

  return (
    <StackSection
      id="melt"
      theme="dark"
      label={sectionTitle("melt")}
      heightVh={sectionHeights.melt}
      sectionRef={sectionRef}
      className={styles.root}
      stickyClassName={styles.stage}
      leading={<div data-anchor="melt-top" className={styles.seam} aria-hidden="true" />}
    >
      <h2 className={styles.title}>
        {melt.lines.map((line) => (
          <span key={line} className={styles.titleLine}>
            {line}
          </span>
        ))}
      </h2>
      <div data-anchor="melt-product" className={styles.anchor} aria-hidden="true" />
    </StackSection>
  )
}
