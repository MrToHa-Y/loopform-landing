import { useCallback, useRef, useState } from "react"
import type { CSSProperties, MouseEvent, PointerEvent } from "react"
import { Flip, gsap, useGSAP } from "@/animation/gsap"
import { durations, eases, sectionHeights, staggers } from "@/animation/tokens"
import { MagneticButton } from "@/components/MagneticButton/MagneticButton"
import { SplitLines } from "@/components/SplitLines/SplitLines"
import { StackSection } from "@/components/StackSection/StackSection"
import { productPhotos } from "@/content/images"
import { ru } from "@/content/ru"
import { thumbnails, useScrollStore } from "@/state/scrollStore"
import styles from "./Catalog.module.scss"

const products = ru.catalog.items.filter((item) => item.kind === "product")
const desktopCardsPerPage = 3
const dragThreshold = 6

export function Catalog() {
  const sectionRef = useRef<HTMLElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)
  const dragState = useRef({ active: false, startX: 0, startOffset: 0, moved: false })
  const [page, setPage] = useState(0)
  const layoutReady = useScrollStore((state) => state.layoutReady)
  const reducedMotion = useScrollStore((state) => state.reducedMotion)
  useScrollStore((state) => state.thumbnailsVersion)
  const compact = useScrollStore((state) => state.compact)
  const { catalog } = ru
  const cardsPerPage = compact ? 1 : desktopCardsPerPage
  const pages = Math.ceil(products.length / cardsPerPage)

  const maxOffset = useCallback(() => {
    const track = trackRef.current
    const viewport = viewportRef.current
    return track && viewport ? Math.max(0, track.scrollWidth - viewport.clientWidth) : 0
  }, [])

  const offsetForPage = useCallback(
    (index: number) => {
      const card = trackRef.current?.children[index * cardsPerPage] as HTMLElement | undefined
      return card ? Math.min(card.offsetLeft, maxOffset()) : 0
    },
    [cardsPerPage, maxOffset],
  )

  const moveTo = useCallback(
    (index: number) => {
      const track = trackRef.current

      if (!track) {
        return
      }

      const next = Math.max(0, Math.min(pages - 1, index))
      const state = Flip.getState(track)

      track.style.transform = `translateX(${-offsetForPage(next)}px)`
      Flip.from(state, {
        duration: useScrollStore.getState().reducedMotion ? 0 : durations.base,
        ease: eases.out,
        simple: true,
      })
      setPage(next)
    },
    [offsetForPage, pages],
  )

  const handleDown = (event: PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current

    if (!track) {
      return
    }

    gsap.killTweensOf(track)
    dragState.current = {
      active: true,
      startX: event.clientX,
      startOffset: offsetForPage(page),
      moved: false,
    }
  }

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current
    const drag = dragState.current

    if (!track || !drag.active) {
      return
    }

    const delta = event.clientX - drag.startX
    const offset = Math.max(0, Math.min(maxOffset(), drag.startOffset - delta))

    if (!drag.moved && Math.abs(delta) > dragThreshold) {
      drag.moved = true
      event.currentTarget.setPointerCapture(event.pointerId)
    }

    if (!drag.moved) {
      return
    }

    track.style.transform = `translateX(${-offset}px)`
  }

  const handleUp = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragState.current

    if (!drag.active) {
      return
    }

    drag.active = false

    if (!drag.moved) {
      return
    }

    const delta = event.clientX - drag.startX
    const threshold = 60
    const direction = Math.abs(delta) < threshold ? 0 : delta < 0 ? 1 : -1

    moveTo(page + direction)
  }

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (dragState.current.moved) {
      event.preventDefault()
      event.stopPropagation()
      dragState.current.moved = false
    }
  }

  useGSAP(
    () => {
      if (!layoutReady || reducedMotion) {
        return
      }

      gsap.from("[data-card]", {
        y: 60,
        opacity: 0,
        duration: durations.base,
        stagger: staggers.cards,
        ease: eases.out,
        scrollTrigger: { trigger: viewportRef.current, start: "top 88%", once: true },
      })
    },
    { dependencies: [layoutReady, reducedMotion], scope: sectionRef },
  )

  return (
    <StackSection
      id="catalog"
      theme="light"
      label={ru.sections[3]?.title ?? ""}
      overlap
      sectionRef={sectionRef}
      className={styles.root}
    >
      <div className={styles.inner} style={{ "--catalog-height": `${sectionHeights.catalog}vh` } as CSSProperties}>
        <div className={styles.head}>
          <p className={styles.eyebrow}>{catalog.eyebrow}</p>
          <SplitLines as="h2" className={styles.title}>
            {catalog.titleLines.map((line) => (
              <span key={line} className={styles.titleLine}>
                {line}
              </span>
            ))}
          </SplitLines>
        </div>

        <div
          ref={viewportRef}
          className={styles.viewport}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
          onClickCapture={handleClick}
        >
          <ul ref={trackRef} className={styles.track}>
            {products.map((item) => {
              const photo = item.slug ? productPhotos[item.slug] : undefined
              const thumbnail = photo ?? (item.slug ? thumbnails.get(item.slug) : undefined)

              return (
                <li key={item.model} data-card className={styles.card}>
                  <div className={styles.photo}>
                    {thumbnail ? (
                      <img src={thumbnail} alt={`${item.model}, ${item.type}`} loading="lazy" draggable={false} />
                    ) : null}
                    {photo ? <span className={styles.aiNote}>{ru.brand.aiImageNote}</span> : null}
                  </div>
                  <div className={styles.caption}>
                    <h3 className={styles.cardName}>{item.model}</h3>
                    <p className={styles.cardPrice}>{item.priceLabel}</p>
                  </div>
                  <a href={catalog.buyUrl} target="_blank" rel="noreferrer" className={styles.buy} draggable={false}>
                    {catalog.buyLabel}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>

        <div className={styles.controls}>
          <MagneticButton>
            <button
              type="button"
              className={styles.control}
              aria-label={catalog.previousLabel}
              disabled={page === 0}
              onClick={() => moveTo(page - 1)}
            >
              ←
            </button>
          </MagneticButton>
          <p className={styles.counter}>
            {page + 1} / {pages}
          </p>
          <MagneticButton>
            <button
              type="button"
              className={styles.control}
              aria-label={catalog.nextLabel}
              disabled={page === pages - 1}
              onClick={() => moveTo(page + 1)}
            >
              →
            </button>
          </MagneticButton>
        </div>
      </div>
    </StackSection>
  )
}
