import { useRef } from "react"
import { gsap, useGSAP } from "@/animation/gsap"
import { eases, sectionHeights } from "@/animation/tokens"
import { useSectionProgress } from "@/animation/useSectionProgress"
import { Counter } from "@/components/Counter/Counter"
import { SplitLines } from "@/components/SplitLines/SplitLines"
import { StackSection } from "@/components/StackSection/StackSection"
import { ru } from "@/content/ru"
import { useScrollStore } from "@/state/scrollStore"
import styles from "./Problem.module.scss"

export function Problem() {
  const sectionRef = useRef<HTMLElement>(null)
  const layoutReady = useScrollStore((state) => state.layoutReady)
  const reducedMotion = useScrollStore((state) => state.reducedMotion)
  const { problem } = ru

  useSectionProgress(sectionRef, "problem")

  useGSAP(
    () => {
      const section = sectionRef.current

      if (!layoutReady || reducedMotion || !section) {
        return
      }

      gsap.fromTo(
        "[data-problem-lead]",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          ease: eases.linear,
          scrollTrigger: {
            trigger: section,
            start: () => `top+=${window.innerHeight * 0.7} top`,
            end: () => `top+=${window.innerHeight * 1.1} top`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      )
    },
    { dependencies: [layoutReady, reducedMotion], scope: sectionRef },
  )

  return (
    <StackSection
      id="problem"
      theme="dark"
      label={ru.sections[4]?.title ?? ""}
      heightVh={sectionHeights.problem}
      sectionRef={sectionRef}
      className={styles.root}
      stickyClassName={styles.stage}
    >
      <SplitLines as="h2" className={styles.title}>
        {problem.title}
      </SplitLines>
      <ul className={styles.stats}>
        {problem.stats.map((stat) => (
          <li key={stat.label} className={styles.stat}>
            <Counter
              value={stat.value}
              decimals={stat.decimals}
              suffix={stat.suffix}
              display={stat.display}
              className={styles.value}
            />
            <p className={styles.label}>{stat.label}</p>
            {stat.source.url ? (
              <a href={stat.source.url} target="_blank" rel="noreferrer" className={styles.source}>
                {stat.source.label}
              </a>
            ) : (
              <span className={styles.source}>{stat.source.label}</span>
            )}
          </li>
        ))}
      </ul>
      <p data-problem-lead className={styles.lead}>
        {problem.lead}
      </p>
      <div data-anchor="problem-silhouette" className={styles.anchor} aria-hidden="true" />
    </StackSection>
  )
}
