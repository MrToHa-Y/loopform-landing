import { useEffect, useRef, useState } from "react"
import { ScrollTrigger, useGSAP } from "@/animation/gsap"
import { setScrollLocked } from "@/animation/lenis"
import { sectionHeights, segments } from "@/animation/tokens"
import { useSectionProgress } from "@/animation/useSectionProgress"
import { MagneticButton } from "@/components/MagneticButton/MagneticButton"
import { StackSection } from "@/components/StackSection/StackSection"
import { ru } from "@/content/ru"
import { sectionTitle } from "@/content/sectionTitle"
import { useScrollStore } from "@/state/scrollStore"
import styles from "./Passport.module.scss"

export function Passport() {
  const sectionRef = useRef<HTMLElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [activeItem, setActiveItem] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const layoutReady = useScrollStore((state) => state.layoutReady)
  const reducedMotion = useScrollStore((state) => state.reducedMotion)
  const { passport } = ru
  const allActive = reducedMotion

  useSectionProgress(sectionRef, "passport")

  useGSAP(
    () => {
      const section = sectionRef.current

      if (!layoutReady || !section || allActive) {
        return
      }

      const [from, to] = segments.passport.passportList

      ScrollTrigger.create({
        trigger: section,
        start: () => `top+=${(from / 100) * window.innerHeight} top`,
        end: () => `top+=${(to / 100) * window.innerHeight} top`,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          setActiveItem(Math.min(passport.items.length - 1, Math.floor(self.progress * passport.items.length)))
        },
      })
    },
    { dependencies: [layoutReady, allActive], scope: sectionRef, revertOnUpdate: true },
  )

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) {
      return
    }

    if (modalOpen && !dialog.open) {
      dialog.showModal()
      setScrollLocked(true)
    }

    if (!modalOpen && dialog.open) {
      dialog.close()
      setScrollLocked(false)
    }
  }, [modalOpen])

  return (
    <StackSection
      id="passport"
      theme="dark"
      label={sectionTitle("passport")}
      heightVh={sectionHeights.passport}
      overlap
      sectionRef={sectionRef}
      className={styles.root}
      stickyClassName={styles.stage}
    >
      <div className={styles.visual}>
        <div data-anchor="passport-chair" className={styles.chairAnchor} aria-hidden="true" />
        <div data-anchor="passport-stool" className={styles.stoolAnchor} aria-hidden="true" />
      </div>
      <div className={styles.copy}>
        <h2 className={styles.title}>
          {passport.titleLines.map((line) => (
            <span key={line} className={styles.titleLine}>
              {line}
            </span>
          ))}
        </h2>
        <ul className={styles.list}>
          {passport.items.map((item, index) => (
            <li
              key={item.title}
              className={`${styles.item} ${allActive || index === activeItem ? styles.itemActive : ""}`}
            >
              <h3 className={styles.itemTitle}>{item.title}</h3>
              <p className={styles.itemText}>{item.text}</p>
            </li>
          ))}
        </ul>
        <MagneticButton>
          <button type="button" className={styles.action} onClick={() => setModalOpen(true)}>
            {passport.linkLabel}
          </button>
        </MagneticButton>
      </div>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="passport-dialog-title"
        data-lenis-prevent
        onClose={() => setModalOpen(false)}
      >
        <div className={styles.dialogBody}>
          <p className={styles.dialogNote}>{passport.modal.note}</p>
          <h3 id="passport-dialog-title" className={styles.dialogTitle}>
            {passport.modal.title}
          </h3>
          <p className={styles.dialogModel}>{passport.modal.model}</p>
          <dl className={styles.fields}>
            {passport.modal.fields.map((field) => (
              <div key={field.label} className={styles.field}>
                <dt>{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>
          <button type="button" className={styles.action} onClick={() => setModalOpen(false)}>
            {passport.modal.closeLabel}
          </button>
        </div>
      </dialog>
    </StackSection>
  )
}
