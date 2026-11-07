import { useId, useRef, useState } from "react"
import { ScrollTrigger, gsap, useGSAP } from "@/animation/gsap"
import { durations, eases } from "@/animation/tokens"
import type { FaqItem } from "@/content/types"
import { useScrollStore } from "@/state/scrollStore"
import styles from "./Accordion.module.scss"

interface AccordionProps {
  items: FaqItem[]
}

export function Accordion({ items }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const baseId = useId()

  useGSAP(
    () => {
      const panels = gsap.utils.toArray<HTMLElement>("[data-panel]")
      const duration = useScrollStore.getState().reducedMotion ? 0 : durations.swift

      panels.forEach((panel, index) => {
        gsap.to(panel, {
          height: index === openIndex ? "auto" : 0,
          duration,
          ease: eases.inOut,
          overwrite: true,
          onComplete: () => ScrollTrigger.refresh(),
        })
      })
    },
    { dependencies: [openIndex], scope: rootRef },
  )

  return (
    <div ref={rootRef} className={styles.root}>
      {items.map((item, index) => {
        const open = index === openIndex
        const buttonId = `${baseId}-button-${index}`
        const panelId = `${baseId}-panel-${index}`

        return (
          <div key={item.question} className={styles.item}>
            <h3 className={styles.heading}>
              <button
                id={buttonId}
                type="button"
                className={styles.trigger}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : index)}
              >
                <span>{item.question}</span>
                <span className={`${styles.icon} ${open ? styles.iconOpen : ""}`} aria-hidden="true" />
              </button>
            </h3>
            <div id={panelId} data-panel role="region" aria-labelledby={buttonId} className={styles.panel}>
              <p className={styles.answer}>{item.answer}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
