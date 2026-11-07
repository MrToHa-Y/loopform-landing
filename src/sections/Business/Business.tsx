import { useRef } from "react"
import { Flip, ScrollTrigger, gsap, useGSAP } from "@/animation/gsap"
import { scrollToSection } from "@/animation/lenis"
import { durations, eases, sectionHeights, staggers } from "@/animation/tokens"
import { MagneticButton } from "@/components/MagneticButton/MagneticButton"
import { SplitLines } from "@/components/SplitLines/SplitLines"
import { StackSection } from "@/components/StackSection/StackSection"
import { ru } from "@/content/ru"
import { useScrollStore } from "@/state/scrollStore"
import styles from "./Business.module.scss"

export function Business() {
  const sectionRef = useRef<HTMLElement>(null)
  const gridRef = useRef<HTMLUListElement>(null)
  const layoutReady = useScrollStore((state) => state.layoutReady)
  const reducedMotion = useScrollStore((state) => state.reducedMotion)
  const compact = useScrollStore((state) => state.compact)
  const { business } = ru

  useGSAP(
    () => {
      const grid = gridRef.current

      if (!layoutReady || !grid || reducedMotion) {
        return
      }

      const cards = gsap.utils.toArray<HTMLElement>("[data-business-card]", grid)

      if (compact) {
        gsap.from(cards, {
          yPercent: (index: number) => -100 * index,
          duration: durations.slow,
          stagger: staggers.cards,
          ease: eases.out,
          scrollTrigger: { trigger: grid, start: "top 82%", toggleActions: "play none none reverse" },
        })
        return
      }

      const toggle = (spread: boolean) => {
        const state = Flip.getState(cards)

        grid.classList.toggle(styles.stacked ?? "", !spread)
        Flip.from(state, {
          duration: durations.slow,
          ease: eases.out,
          stagger: staggers.cards,
          absolute: false,
        })
      }

      grid.classList.add(styles.stacked ?? "")

      const trigger = ScrollTrigger.create({
        trigger: grid,
        start: "top 72%",
        onEnter: () => toggle(true),
        onLeaveBack: () => toggle(false),
      })

      return () => {
        trigger.kill()
        grid.classList.remove(styles.stacked ?? "")
      }
    },
    { dependencies: [layoutReady, reducedMotion, compact], scope: sectionRef },
  )

  return (
    <StackSection
      id="business"
      theme="accent"
      label={ru.sections[12]?.title ?? ""}
      sectionRef={sectionRef}
      className={styles.root}
    >
      <div className={styles.inner} style={{ minHeight: `${sectionHeights.business}vh` }}>
        <SplitLines as="h2" className={styles.title}>
          {business.title}
        </SplitLines>
        <ul ref={gridRef} className={styles.grid}>
          {business.cards.map((card) => (
            <li key={card.number} data-business-card className={styles.card}>
              <p className={styles.number}>{card.number}</p>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.text}>{card.text}</p>
              <MagneticButton>
                <button type="button" className={styles.action} onClick={() => scrollToSection("cta")}>
                  {business.actionLabel}
                </button>
              </MagneticButton>
            </li>
          ))}
        </ul>
      </div>
    </StackSection>
  )
}
