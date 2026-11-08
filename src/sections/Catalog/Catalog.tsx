import { useCallback, useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { gsap, useGSAP } from "@/animation/gsap"
import { scrollToPosition } from "@/animation/lenis"
import { catalogPreview, durations, eases, sectionHeights, staggers } from "@/animation/tokens"
import { SplitLines } from "@/components/SplitLines/SplitLines"
import { StackSection } from "@/components/StackSection/StackSection"
import { productPhotos } from "@/content/images"
import { ru } from "@/content/ru"
import { sectionTitle } from "@/content/sectionTitle"
import { productViews, thumbnails, useScrollStore } from "@/state/scrollStore"
import { capsFromWeight, previewBlock } from "./catalogLayout"
import type { BlockRect } from "./catalogLayout"
import styles from "./Catalog.module.scss"

const products = ru.catalog.items.filter((item) => item.kind === "product")

function crossPolygon(centerX: number, centerY: number, armX: number, armY: number) {
  const left = centerX - armX / 2
  const right = centerX + armX / 2
  const top = centerY - armY / 2
  const bottom = centerY + armY / 2

  return `polygon(${left}% 0%, ${right}% 0%, ${right}% ${top}%, 100% ${top}%, 100% ${bottom}%, ${right}% ${bottom}%, ${right}% 100%, ${left}% 100%, ${left}% ${bottom}%, 0% ${bottom}%, 0% ${top}%, ${left}% ${top}%)`
}

export function Catalog() {
  const sectionRef = useRef<HTMLElement>(null)
  const gridRef = useRef<HTMLUListElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const maskRef = useRef<HTMLDivElement>(null)
  const detailsRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const hoverTimer = useRef(0)
  const [active, setActive] = useState<number | null>(null)
  const [block, setBlock] = useState<BlockRect | null>(null)
  const [frame, setFrame] = useState(0)
  const [hoverMode, setHoverMode] = useState(true)
  const layoutReady = useScrollStore((state) => state.layoutReady)
  const reducedMotion = useScrollStore((state) => state.reducedMotion)
  useScrollStore((state) => state.thumbnailsVersion)
  const { catalog } = ru
  const item = active === null ? null : products[active]
  const slug = item?.slug ?? null
  const photo = slug ? productPhotos[slug] : undefined
  const gallery = slug ? [...(photo ? [photo] : []), ...(productViews.get(slug) ?? (photo ? [] : [thumbnails.get(slug) ?? ""]))].filter(Boolean) : []

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)")
    const update = () => setHoverMode(query.matches)

    update()
    query.addEventListener("change", update)

    return () => query.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    const section = sectionRef.current

    if (!section) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          useScrollStore.setState({ catalogViewsWanted: true })
          observer.disconnect()
        }
      },
      { rootMargin: "100% 0px" },
    )

    observer.observe(section)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (active === null || gallery.length < 2) {
      return
    }

    const timer = window.setInterval(() => setFrame((value) => value + 1), catalogPreview.galleryStepMs)

    return () => window.clearInterval(timer)
  }, [active, gallery.length])

  const close = useCallback(() => {
    window.clearTimeout(hoverTimer.current)

    const timeline = timelineRef.current

    if (!timeline || reducedMotion) {
      timeline?.progress(0).kill()
      timelineRef.current = null
      setActive(null)
      return
    }

    timeline.eventCallback("onReverseComplete", () => {
      timeline.kill()
      timelineRef.current = null
      setActive(null)
    })
    timeline.timeScale(catalogPreview.closeSpeed).reverse()
  }, [reducedMotion])

  const open = useCallback(
    (index: number) => {
      const grid = gridRef.current

      if (!grid || index === active) {
        return
      }

      timelineRef.current?.progress(0).kill()
      timelineRef.current = null

      const next = previewBlock(grid, index, catalogPreview.rowSpan)
      const gridTop = grid.getBoundingClientRect().top
      const blockTop = gridTop + next.top
      const blockBottom = blockTop + next.height

      if (!hoverMode && (blockTop < 0 || blockBottom > window.innerHeight)) {
        const headerBottom = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0
        const offset = Math.max((window.innerHeight - next.height) / 2, headerBottom)

        scrollToPosition(window.scrollY + blockTop - offset, { duration: durations.base })
      }

      setBlock(next)
      setFrame(0)
      setActive(index)
    },
    [active, hoverMode],
  )

  useGSAP(
    () => {
      const grid = gridRef.current
      const preview = previewRef.current
      const mask = maskRef.current
      const details = detailsRef.current

      if (active === null || !block || !grid || !preview || !mask || !details) {
        return
      }

      const neighbours = block.members
        .filter((member) => member !== active)
        .map((member) => grid.children[member])
        .filter((node): node is HTMLElement => node instanceof HTMLElement)

      if (reducedMotion) {
        gsap.set(preview, { autoAlpha: 1 })
        gsap.set(mask, { clipPath: crossPolygon(block.crossX, block.crossY, 0, 0) })
        return
      }

      const shift = (window.innerWidth * catalogPreview.shiftVw) / 100
      const timeline = gsap.timeline({ defaults: { ease: eases.inOut, duration: durations.medium } })

      timeline
        .fromTo(preview, { autoAlpha: 0, scale: catalogPreview.startScale }, { autoAlpha: 1, scale: 1 }, 0)
        .fromTo(
          mask,
          { clipPath: crossPolygon(block.crossX, block.crossY, block.armX, block.armY) },
          { clipPath: crossPolygon(block.crossX, block.crossY, 0, 0) },
          0,
        )
        .to(
          neighbours,
          {
            autoAlpha: 0,
            x: (_, node: HTMLElement) => (node.offsetLeft + node.offsetWidth / 2 < block.centerX ? shift : -shift),
            y: (_, node: HTMLElement) => (node.offsetTop + node.offsetHeight / 2 < block.centerY ? shift : -shift),
          },
          0,
        )
        .fromTo(details.children, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, stagger: staggers.lines, duration: durations.fast, ease: eases.out }, durations.fast)

      timeline.eventCallback("onReverseComplete", () => gsap.set(neighbours, { clearProps: "opacity,visibility,transform" }))
      timelineRef.current = timeline

      return () => {
        gsap.set(neighbours, { clearProps: "opacity,visibility,transform" })
      }
    },
    { dependencies: [active, block, reducedMotion], scope: sectionRef },
  )

  useEffect(() => {
    if (active === null) {
      return
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close()
      }
    }

    const start = { x: 0, y: 0 }

    const handleDown = (event: PointerEvent) => {
      start.x = event.clientX
      start.y = event.clientY
    }

    const handleUp = (event: PointerEvent) => {
      const tapped = Math.hypot(event.clientX - start.x, event.clientY - start.y) < catalogPreview.tapSlop

      if (!hoverMode && tapped && previewRef.current && !previewRef.current.contains(event.target as Node)) {
        close()
      }
    }

    window.addEventListener("keydown", handleKey)
    window.addEventListener("pointerdown", handleDown)
    window.addEventListener("pointerup", handleUp)

    return () => {
      window.removeEventListener("keydown", handleKey)
      window.removeEventListener("pointerdown", handleDown)
      window.removeEventListener("pointerup", handleUp)
    }
  }, [active, close, hoverMode])

  useEffect(() => {
    if (active === null) {
      return
    }

    const width = window.innerWidth
    const handleResize = () => {
      if (window.innerWidth !== width) {
        close()
      }
    }

    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [active, close])

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
        clearProps: "transform,opacity",
        scrollTrigger: { trigger: gridRef.current, start: "top 88%", once: true },
      })
    },
    { dependencies: [layoutReady, reducedMotion], scope: sectionRef },
  )

  const enterCard = (index: number) => {
    if (!hoverMode) {
      return
    }

    window.clearTimeout(hoverTimer.current)
    hoverTimer.current = window.setTimeout(() => open(index), catalogPreview.hoverDelayMs)
  }

  const leaveCard = () => {
    window.clearTimeout(hoverTimer.current)
  }

  const previewStyle = block
    ? ({
        left: `${block.left}px`,
        top: `${block.top}px`,
        width: `${block.width}px`,
        height: `${block.height}px`,
      } as CSSProperties)
    : undefined
  const current = gallery.length > 0 ? frame % gallery.length : 0
  const showsPhoto = Boolean(photo) && current === 0

  return (
    <StackSection id="catalog" theme="light" label={sectionTitle("catalog")} overlap sectionRef={sectionRef} className={styles.root}>
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
          <p className={styles.hint}>{hoverMode ? catalog.preview.hoverHint : catalog.preview.tapHint}</p>
        </div>

        <div className={styles.stage}>
          <ul ref={gridRef} className={styles.grid}>
            {products.map((product, index) => {
              const image = product.slug ? (productPhotos[product.slug] ?? thumbnails.get(product.slug)) : undefined

              return (
                <li key={product.model} data-card className={styles.card} onPointerEnter={() => enterCard(index)} onPointerLeave={leaveCard}>
                  <span className={styles.photo}>
                    {image ? <img src={image} alt={`${product.model}, ${product.type}`} loading="lazy" draggable={false} /> : null}
                  </span>
                  <h3 className={styles.cardName}>{product.model}</h3>
                  <p className={styles.cardPrice}>{product.priceLabel}</p>
                  <button
                    type="button"
                    className={styles.hit}
                    aria-label={`${catalog.preview.openLabel}: ${product.model}`}
                    aria-expanded={active === index}
                    onClick={() => open(index)}
                  />
                </li>
              )
            })}
          </ul>

          {item ? (
            <div
              ref={previewRef}
              className={styles.preview}
              style={previewStyle}
              role="region"
              aria-label={item.model}
              onPointerLeave={hoverMode ? close : undefined}
            >
              <div className={styles.gallery}>
                {gallery.map((source, index) => (
                  <img
                    key={source}
                    src={source}
                    alt={index === 0 && photo ? `${item.model}, ${item.type}` : ""}
                    className={index === current ? styles.galleryActive : undefined}
                    draggable={false}
                  />
                ))}
              </div>
              <span className={styles.badge}>{showsPhoto ? catalog.preview.photoLabel : catalog.preview.modelLabel}</span>
              {gallery.length > 1 ? (
                <span className={styles.dots} aria-hidden="true">
                  {gallery.map((source, index) => (
                    <span key={source} className={index === current ? styles.dotActive : styles.dot} />
                  ))}
                </span>
              ) : null}
              <div ref={detailsRef} className={styles.details}>
                <div className={styles.detailsHead}>
                  <p className={styles.detailsName}>{item.model}</p>
                  <p className={styles.detailsPrice}>{item.priceLabel}</p>
                </div>
                <p className={styles.detailsType}>{item.type}</p>
                <dl className={styles.specs}>
                  <div>
                    <dt>{catalog.preview.specs.size}</dt>
                    <dd>{item.size}</dd>
                  </div>
                  <div>
                    <dt>{catalog.preview.specs.weight}</dt>
                    <dd>{item.weight}</dd>
                  </div>
                  <div>
                    <dt>{catalog.preview.specs.printTime}</dt>
                    <dd>{item.printTime}</dd>
                  </div>
                  <div>
                    <dt>{catalog.preview.specs.caps}</dt>
                    <dd>{capsFromWeight(item.weight, ru.configurator.capWeightGrams)}</dd>
                  </div>
                  <div className={styles.specWide}>
                    <dt>{catalog.preview.specs.material}</dt>
                    <dd>{item.material}</dd>
                  </div>
                </dl>
                <a href={catalog.buyUrl} target="_blank" rel="noreferrer" className={styles.buy}>
                  {catalog.buyLabel}
                </a>
              </div>
              {hoverMode ? null : (
                <button type="button" className={styles.close} aria-label={catalog.preview.closeLabel} onClick={close}>
                  ×
                </button>
              )}
              <div ref={maskRef} className={styles.mask} aria-hidden="true" />
            </div>
          ) : null}
        </div>
      </div>
    </StackSection>
  )
}
