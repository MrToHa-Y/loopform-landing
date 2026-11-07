import { goToSection } from "@/animation/presentation"
import { ru } from "@/content/ru"
import { useScrollStore } from "@/state/scrollStore"
import styles from "./ProgressRail.module.scss"

export function ProgressRail() {
  const presentationMode = useScrollStore((state) => state.presentationMode)
  const presentationSection = useScrollStore((state) => state.presentationSection)
  const { sections, presentation } = ru

  if (!presentationMode) {
    return null
  }

  const current = String(presentationSection + 1).padStart(2, "0")

  return (
    <>
      <nav className={styles.rail} aria-label={presentation.railLabel}>
        <ol>
          {sections.map((section, index) => (
            <li key={section.id}>
              <button
                type="button"
                className={`${styles.item} ${index === presentationSection ? styles.active : ""}`}
                aria-current={index === presentationSection ? "true" : undefined}
                onClick={() => goToSection(index)}
              >
                <span className={styles.label}>{section.title}</span>
                <span className={styles.tick} />
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <p className={styles.counter}>
        {current}
        {presentation.counterSeparator}
        {sections.length}
      </p>
    </>
  )
}
