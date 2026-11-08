import { useRef } from "react"
import { gsap, useGSAP } from "@/animation/gsap"
import { durations, eases, staggers } from "@/animation/tokens"
import { StackSection } from "@/components/StackSection/StackSection"
import { ru } from "@/content/ru"
import { sectionTitle } from "@/content/sectionTitle"
import { useScrollStore } from "@/state/scrollStore"
import styles from "./Advantages.module.scss"

export function Advantages() {
  const sectionRef = useRef<HTMLElement>(null)
  const gridRef = useRef<HTMLUListElement>(null)
  const layoutReady = useScrollStore((state) => state.layoutReady)
  const reducedMotion = useScrollStore((state) => state.reducedMotion)
  const { advantages } = ru

  useGSAP(
    () => {
      if (!layoutReady || reducedMotion || !gridRef.current) {
        return
      }

      gsap.from("[data-advantage]", {
        y: 48,
        opacity: 0,
        duration: durations.base,
        stagger: staggers.cards,
        ease: eases.out,
        scrollTrigger: { trigger: gridRef.current, start: "top 86%", once: true },
      })
    },
    { dependencies: [layoutReady, reducedMotion], scope: sectionRef },
  )

  return (
    <StackSection
      id="advantages"
      theme="light"
      label={sectionTitle("advantages")}
      overlap
      sectionRef={sectionRef}
      className={styles.root}
      leading={<div data-anchor="advantages-top" className={styles.seam} aria-hidden="true" />}
    >
      <div className={styles.inner}>
        <p className={styles.eyebrow}>{advantages.eyebrow}</p>
        <h2 className={styles.title}>{advantages.title}</h2>
        <ul ref={gridRef} className={styles.grid}>
          {advantages.items.map((item, index) => (
            <li key={item.title} data-advantage className={styles.item}>
              <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
              <h3 className={styles.itemTitle}>{item.title}</h3>
              <p className={styles.itemText}>{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </StackSection>
  )
}
