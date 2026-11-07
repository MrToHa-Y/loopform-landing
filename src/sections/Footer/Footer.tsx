import { useRef } from "react"
import { ScrollTrigger, gsap, useGSAP } from "@/animation/gsap"
import { scrollToSection } from "@/animation/lenis"
import { durations } from "@/animation/tokens"
import { useSectionProgress } from "@/animation/useSectionProgress"
import { FitText } from "@/components/FitText/FitText"
import { ru } from "@/content/ru"
import type { FooterColumnLink } from "@/content/types"
import { useScrollStore } from "@/state/scrollStore"
import styles from "./Footer.module.scss"

const printSteps = 12

function ColumnLink({ link }: { link: FooterColumnLink }) {
  const { target, url, label } = link

  if (url) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className={styles.link}>
        {label}
      </a>
    )
  }

  if (target) {
    return (
      <a
        href={`#${target}`}
        className={styles.link}
        onClick={(event) => {
          event.preventDefault()
          scrollToSection(target)
        }}
      >
        {label}
      </a>
    )
  }

  return <span>{label}</span>
}

export function Footer() {
  const footerRef = useRef<HTMLElement>(null)
  const logoRef = useRef<HTMLElement>(null)
  const layoutReady = useScrollStore((state) => state.layoutReady)
  const reducedMotion = useScrollStore((state) => state.reducedMotion)
  const { footer } = ru

  useSectionProgress(footerRef, "footer")

  useGSAP(
    () => {
      const footerElement = footerRef.current
      const logo = logoRef.current

      if (!layoutReady || !footerElement || !logo) {
        return
      }

      ScrollTrigger.create({
        trigger: logo,
        start: "top 110%",
        end: "bottom -20%",
        onToggle: (self) => useScrollStore.getState().set({ footerActive: self.isActive }),
      })

      if (reducedMotion) {
        return
      }

      gsap.fromTo(
        logo,
        { clipPath: "inset(100% 0 0 0)" },
        {
          clipPath: "inset(0% 0 0 0)",
          duration: durations.hero,
          ease: `steps(${printSteps})`,
          scrollTrigger: { trigger: footerElement, start: "top 70%", once: true },
        },
      )
    },
    { dependencies: [layoutReady, reducedMotion], scope: footerRef },
  )

  return (
    <footer ref={footerRef} data-section="footer" data-theme="light" className={styles.root}>
      <div className={styles.columns}>
        {footer.columns.map((column) => (
          <nav key={column.title} className={styles.column} aria-label={column.title}>
            <h2 className={styles.columnTitle}>{column.title}</h2>
            <ul>
              {column.links.map((link) => (
                <li key={link.label}>
                  <ColumnLink link={link} />
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div data-footer-logo className={styles.logoWrap}>
        <FitText rootRef={logoRef} as="p" lines={[footer.logo]} widthVw={98} masked={false} className={styles.logo} />
      </div>
      <div className={styles.bottom}>
        <p>{footer.disclaimer}</p>
        <p>{footer.copyright}</p>
      </div>
    </footer>
  )
}
