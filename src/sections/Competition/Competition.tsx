import { useRef } from "react"
import { gsap, useGSAP } from "@/animation/gsap"
import { durations, eases, staggers } from "@/animation/tokens"
import { StackSection } from "@/components/StackSection/StackSection"
import { ru } from "@/content/ru"
import { useScrollStore } from "@/state/scrollStore"
import styles from "./Competition.module.scss"

export function Competition() {
  const sectionRef = useRef<HTMLElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  const layoutReady = useScrollStore((state) => state.layoutReady)
  const reducedMotion = useScrollStore((state) => state.reducedMotion)
  const { competition } = ru

  useGSAP(
    () => {
      if (!layoutReady || reducedMotion || !tableRef.current) {
        return
      }

      gsap.from("[data-competitor]", {
        y: 32,
        opacity: 0,
        duration: durations.base,
        stagger: staggers.cards,
        ease: eases.out,
        scrollTrigger: { trigger: tableRef.current, start: "top 86%", once: true },
      })
    },
    { dependencies: [layoutReady, reducedMotion], scope: sectionRef },
  )

  return (
    <StackSection id="competition" theme="dark" label={ru.sections[14]?.title ?? ""} sectionRef={sectionRef} className={styles.root}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>{competition.eyebrow}</p>
        <h2 className={styles.title}>{competition.title}</h2>
        <p className={styles.lead}>{competition.lead}</p>

        <div ref={tableRef} className={styles.table} role="table" aria-label={competition.title}>
          <div className={`${styles.row} ${styles.head}`} role="row">
            <span role="columnheader">{competition.columns.name}</span>
            <span role="columnheader">{competition.columns.fact}</span>
            <span role="columnheader">{competition.columns.answer}</span>
          </div>
          {competition.rows.map((row) => (
            <div key={row.name} data-competitor className={styles.row} role="row">
              <div className={styles.who} role="cell">
                <p className={styles.name}>{row.name}</p>
                <p className={styles.place}>{row.place}</p>
              </div>
              <p className={styles.cell} role="cell">
                {row.fact}{" "}
                <a href={row.source.url} target="_blank" rel="noreferrer" className={styles.source}>
                  {row.source.label}
                </a>
              </p>
              <p className={styles.answer} role="cell">
                {row.answer}
              </p>
            </div>
          ))}
        </div>

        <p className={styles.note}>{competition.note}</p>

        <h3 className={styles.eyebrow}>{competition.demandTitle}</h3>
        <ul className={styles.demand}>
          {competition.demand.map((figure) => (
            <li key={figure.value} className={styles.figure}>
              <span className={styles.value}>{figure.value}</span>
              <p className={styles.cell}>
                {figure.label}{" "}
                <a href={figure.source.url} target="_blank" rel="noreferrer" className={styles.source}>
                  {figure.source.label}
                </a>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </StackSection>
  )
}
