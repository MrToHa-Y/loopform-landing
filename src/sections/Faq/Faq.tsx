import { Accordion } from "@/components/Accordion/Accordion"
import { SplitLines } from "@/components/SplitLines/SplitLines"
import { StackSection } from "@/components/StackSection/StackSection"
import { ru } from "@/content/ru"
import styles from "./Faq.module.scss"

export function Faq() {
  const { faq } = ru

  return (
    <StackSection id="faq" theme="light" label={ru.sections[15]?.title ?? ""} className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.head}>
          <p className={styles.eyebrow}>{faq.eyebrow}</p>
          <SplitLines as="h2" className={styles.title}>
            {faq.title}
          </SplitLines>
        </div>
        <div className={styles.list}>
          <Accordion items={faq.items} />
        </div>
      </div>
    </StackSection>
  )
}
