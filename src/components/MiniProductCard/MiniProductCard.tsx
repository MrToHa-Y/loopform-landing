import { useLayoutEffect, useRef } from "react"
import { Flip } from "@/animation/gsap"
import { durations, eases } from "@/animation/tokens"
import { scrollToSection } from "@/animation/lenis"
import { productPhotos } from "@/content/images"
import { ru } from "@/content/ru"
import { thumbnails, useScrollStore } from "@/state/scrollStore"
import styles from "./MiniProductCard.module.scss"

export function MiniProductCard() {
  const activeModel = useScrollStore((state) => state.activeModel)
  const collectionActive = useScrollStore((state) => state.collectionActive)
  const presentationMode = useScrollStore((state) => state.presentationMode)
  const reducedMotion = useScrollStore((state) => state.reducedMotion)
  useScrollStore((state) => state.thumbnailsVersion)
  const contentRef = useRef<HTMLDivElement>(null)
  const flipState = useRef<ReturnType<typeof Flip.getState> | null>(null)
  const model = ru.collection.models[activeModel]

  if (contentRef.current && !reducedMotion) {
    flipState.current = Flip.getState(contentRef.current.children)
  }

  useLayoutEffect(() => {
    if (flipState.current) {
      Flip.from(flipState.current, {
        duration: durations.swift,
        ease: eases.out,
        absolute: false,
      })
      flipState.current = null
    }
  }, [activeModel])

  if (!model) {
    return null
  }

  const thumbnail = productPhotos[model.id] ?? thumbnails.get(model.id)
  const visible = collectionActive && !presentationMode

  return (
    <aside className={`${styles.root} ${visible ? styles.visible : ""}`} aria-hidden={!visible} aria-label={model.name}>
      <div className={styles.thumb}>{thumbnail ? <img src={thumbnail} alt="" loading="lazy" /> : null}</div>
      <div ref={contentRef} className={styles.content}>
        <p data-flip-id="mini-name" className={styles.name}>
          {model.name}
        </p>
        <p data-flip-id="mini-price" className={styles.price}>
          {model.price}
        </p>
      </div>
      <button
        type="button"
        className={styles.action}
        tabIndex={visible ? 0 : -1}
        onClick={() => scrollToSection("configurator")}
      >
        {ru.collection.buyLabel}
      </button>
    </aside>
  )
}
