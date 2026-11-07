import { useRef } from "react"
import { gsap, useGSAP } from "@/animation/gsap"
import { durations, eases, sectionHeights, staggers } from "@/animation/tokens"
import { StackSection } from "@/components/StackSection/StackSection"
import { ru } from "@/content/ru"
import { useScrollStore } from "@/state/scrollStore"
import styles from "./Philosophy.module.scss"

export function Philosophy() {
  const sectionRef = useRef<HTMLElement>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const layoutReady = useScrollStore((state) => state.layoutReady)
  const reducedMotion = useScrollStore((state) => state.reducedMotion)
  const { philosophy } = ru

  useGSAP(
    () => {
      if (!layoutReady || reducedMotion || !listRef.current) {
        return
      }

      gsap.from("[data-principle]", {
        y: 48,
        opacity: 0,
        duration: durations.base,
        stagger: staggers.cards,
        ease: eases.out,
        scrollTrigger: { trigger: listRef.current, start: "top 86%", once: true },
      })
    },
    { dependencies: [layoutReady, reducedMotion], scope: sectionRef },
  )

  return (
    <StackSection
      id="philosophy"
      theme="dark"
      label={ru.sections[10]?.title ?? ""}
      overlap
      sectionRef={sectionRef}
      className={styles.root}
    >
      <div className={styles.inner} style={{ minHeight: `${sectionHeights.philosophy}vh` }}>
        <p className={styles.eyebrow}>{philosophy.eyebrow}</p>
        <h2 className={styles.title}>{philosophy.title}</h2>
        <h3 className={styles.lead}>{philosophy.lead}</h3>
        <div className={styles.columns}>
          {philosophy.paragraphs.map((paragraph) => (
            <p key={paragraph} className={styles.paragraph}>
              {paragraph}
            </p>
          ))}
        </div>
        <ol ref={listRef} className={styles.principles}>
          {philosophy.principles.map((principle, index) => (
            <li key={principle.title} data-principle className={styles.principle}>
              <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
              <h3 className={styles.principleTitle}>{principle.title}</h3>
              <p className={styles.principleText}>{principle.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </StackSection>
  )
}
