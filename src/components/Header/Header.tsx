import { ScrollTrigger, useGSAP } from "@/animation/gsap"
import { scrollToSection } from "@/animation/lenis"
import { ru } from "@/content/ru"
import type { NavLink, SectionId, ThemeName } from "@/content/types"
import { useScrollStore } from "@/state/scrollStore"
import styles from "./Header.module.scss"

function resolveTheme(theme: ThemeName, section: SectionId, activeModel: number) {
  if (section === "business") {
    return "ink"
  }

  if (section === "collection") {
    const background = ru.collection.models[activeModel]?.background

    if (background === "cap-red") {
      return "ink"
    }

    if (background === "sand") {
      return "light"
    }
  }

  return theme
}

function HeaderLink({ link, label, className }: { link: NavLink; label?: string; className?: string }) {
  return (
    <a
      href={`#${link.target}`}
      className={`${styles.link} ${className ?? ""}`}
      onClick={(event) => {
        event.preventDefault()
        scrollToSection(link.target)
      }}
    >
      {label ?? link.label}
    </a>
  )
}

export function Header() {
  const layoutReady = useScrollStore((state) => state.layoutReady)
  const headerTheme = useScrollStore((state) => state.headerTheme)
  const headerSection = useScrollStore((state) => state.headerSection)
  const activeModel = useScrollStore((state) => state.activeModel)
  const presentationMode = useScrollStore((state) => state.presentationMode)
  const { header } = ru

  useGSAP(
    () => {
      if (!layoutReady) {
        return
      }

      const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-theme]"))
      const headerMiddle = 27

      sections.forEach((section, index) => {
        const apply = (element: HTMLElement) => {
          useScrollStore.getState().set({
            headerTheme: element.dataset.theme as ThemeName,
            headerSection: element.dataset.section as SectionId,
          })
        }
        const offsetVh = Number(section.dataset.themeOffset ?? 0)
        const previous = sections[index - 1]

        ScrollTrigger.create({
          trigger: section,
          start: () => `top+=${(offsetVh / 100) * window.innerHeight} ${headerMiddle}`,
          onEnter: () => apply(section),
          onLeaveBack: () => {
            if (previous) {
              apply(previous)
            }
          },
        })
      })
    },
    { dependencies: [layoutReady] },
  )

  const theme = resolveTheme(headerTheme, headerSection, activeModel)

  return (
    <header className={`${styles.root} ${presentationMode ? styles.hidden : ""}`} data-header-theme={theme}>
      <nav className={styles.side} aria-label={header.logo}>
        {header.leftNav.map((link, index) => (
          <HeaderLink key={link.target} link={link} className={index > 0 ? styles.desktopOnly : undefined} />
        ))}
      </nav>
      <a
        href="#intro"
        className={styles.logo}
        onClick={(event) => {
          event.preventDefault()
          scrollToSection("intro")
        }}
      >
        {header.logo}
      </a>
      <div className={`${styles.side} ${styles.sideEnd}`}>
        {header.rightNav.map((link) => (
          <HeaderLink key={link.target} link={link} className={styles.desktopOnly} />
        ))}
        <HeaderLink link={header.order} label={`${header.order.label} (${header.orderCount})`} />
      </div>
    </header>
  )
}
