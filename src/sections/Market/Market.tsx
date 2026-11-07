import { useRef } from "react"
import { gsap, useGSAP } from "@/animation/gsap"
import { eases, sectionHeights } from "@/animation/tokens"
import { Counter } from "@/components/Counter/Counter"
import { StackSection } from "@/components/StackSection/StackSection"
import { ru } from "@/content/ru"
import { useScrollStore } from "@/state/scrollStore"
import styles from "./Market.module.scss"

export function Market() {
  const sectionRef = useRef<HTMLElement>(null)
  const lineRef = useRef<SVGLineElement>(null)
  const layoutReady = useScrollStore((state) => state.layoutReady)
  const reducedMotion = useScrollStore((state) => state.reducedMotion)
  const { market } = ru

  useGSAP(
    () => {
      const line = lineRef.current

      if (!layoutReady || !line || reducedMotion) {
        return
      }

      gsap.fromTo(
        line,
        { strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          ease: eases.linear,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 50%",
            end: "top top",
            scrub: true,
          },
        },
      )
      gsap.from("[data-stage]", {
        scale: 0,
        ease: eases.linear,
        stagger: 0.2,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 50%",
          end: "top top",
          scrub: true,
        },
      })
    },
    { dependencies: [layoutReady, reducedMotion], scope: sectionRef },
  )

  return (
    <StackSection
      id="market"
      theme="light"
      label={ru.sections[13]?.title ?? ""}
      sectionRef={sectionRef}
      className={styles.root}
    >
      <div className={styles.inner} style={{ minHeight: `${sectionHeights.market}vh` }}>
        <h2 className={styles.eyebrow}>{market.title}</h2>
        <ul className={styles.figures}>
          {market.figures.map((figure) => (
            <li key={figure.label} className={styles.figure}>
              <Counter
                value={figure.value}
                decimals={figure.decimals}
                prefix={figure.prefix}
                suffix={figure.suffix}
                display={figure.display}
                className={styles.value}
              />
              <p className={styles.label}>{figure.label}</p>
            </li>
          ))}
        </ul>
        <div className={styles.roadmap}>
          <p className={styles.eyebrow}>{market.roadmap.title}</p>
          <div className={styles.track}>
            <svg className={styles.line} aria-hidden="true">
              <line ref={lineRef} x1="0" y1="50%" x2="100%" y2="50%" pathLength={1} strokeDasharray={1} />
            </svg>
            <ol className={styles.stages}>
              {market.roadmap.stages.map((stage) => (
                <li key={stage.label} className={styles.stage}>
                  <span data-stage className={styles.dot} />
                  <span className={styles.stageLabel}>{stage.label}</span>
                </li>
              ))}
            </ol>
          </div>
          <p className={styles.note}>{market.roadmap.note}</p>
        </div>
        <ul className={styles.streams}>
          {market.revenueStreams.map((stream) => (
            <li key={stream.direction} className={styles.stream}>
              {stream.direction}
            </li>
          ))}
        </ul>
      </div>
    </StackSection>
  )
}
