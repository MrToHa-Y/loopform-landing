import { useRef } from "react"
import { ScrollTrigger, gsap, useGSAP } from "@/animation/gsap"
import { scrollToPosition } from "@/animation/lenis"
import { durations, eases, motion, sectionHeights, staggers } from "@/animation/tokens"
import { useSectionProgress } from "@/animation/useSectionProgress"
import { FitText } from "@/components/FitText/FitText"
import { StackSection } from "@/components/StackSection/StackSection"
import { productPhotos } from "@/content/images"
import { ru } from "@/content/ru"
import type { CollectionModel } from "@/content/types"
import { collectionRig, thumbnails, useScrollStore } from "@/state/scrollStore"
import { readColor } from "@/styles/readToken"
import styles from "./Collection.module.scss"

function foregroundFor(model: CollectionModel) {
  if (model.background === "sand") {
    return { large: readColor("graphite"), small: readColor("graphite") }
  }

  if (model.background === "cap-red") {
    return { large: readColor("bone"), small: readColor("ink") }
  }

  return { large: readColor("bone"), small: readColor("bone") }
}

export function Collection() {
  const sectionRef = useRef<HTMLElement>(null)
  const layoutReady = useScrollStore((state) => state.layoutReady)
  const compact = useScrollStore((state) => state.compact)
  const reducedMotion = useScrollStore((state) => state.reducedMotion)
  const activeModel = useScrollStore((state) => state.activeModel)
  const stacked = compact || reducedMotion
  useScrollStore((state) => state.thumbnailsVersion)
  const { collection } = ru
  const displayed = useRef(0)
  const running = useRef<gsap.core.Timeline | null>(null)

  useSectionProgress(sectionRef, "collection")

  useGSAP(
    () => {
      const section = sectionRef.current

      if (!layoutReady || !section) {
        return
      }

      ScrollTrigger.create({
        trigger: section,
        start: "top 45%",
        end: () => (stacked ? "bottom top" : `top+=${window.innerHeight * 4.3} top`),
        invalidateOnRefresh: true,
        onToggle: (self) => useScrollStore.getState().set({ collectionActive: self.isActive }),
      })

      if (stacked) {
        const blocks = gsap.utils.toArray<HTMLElement>("[data-model-block]", section)

        blocks.forEach((block, index) => {
          const rig = collectionRig.models[index]

          if (!rig) {
            return
          }

          rig.print = reducedMotion ? 1 : 0

          ScrollTrigger.create({
            trigger: block,
            start: "top 60%",
            end: "bottom 40%",
            onToggle: (self) => {
              if (self.isActive) {
                useScrollStore.getState().set({ activeModel: index })
                collectionRig.particleColorIndex = index
              }
            },
            onEnter: () => {
              if (!reducedMotion) {
                gsap.to(rig, { print: 1, duration: durations.slow, ease: eases.out })
              }
            },
          })
        })
        return
      }

      const models = collection.models
      const setStep = (value: number) => {
        const index = Math.min(models.length - 1, Math.floor(value * models.length))

        if (useScrollStore.getState().activeModel !== index) {
          useScrollStore.getState().set({ activeModel: index })
        }
      }

      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `top+=${window.innerHeight * 4} top`,
        invalidateOnRefresh: true,
        onUpdate: (self) => setStep(self.progress),
      })

      const settle = (index: number) => {
        models.forEach((_, modelIndex) => {
          const active = modelIndex === index
          const rig = collectionRig.models[modelIndex]

          gsap.set(`[data-name="${modelIndex}"]`, { autoAlpha: active ? 1 : 0 })
          gsap.set(`[data-meta="${modelIndex}"]`, { autoAlpha: active ? 1 : 0 })

          if (rig) {
            rig.print = active ? 1 : 0
          }
        })
      }

      const transition = (from: number, to: number) => {
        const next = models[to]
        const fromRig = collectionRig.models[from]
        const toRig = collectionRig.models[to]

        if (!next || !fromRig || !toRig) {
          return
        }

        const foreground = foregroundFor(next)
        const oldLines = gsap.utils.toArray<HTMLElement>(`[data-name="${from}"] [data-line]`, section)
        const newLines = gsap.utils.toArray<HTMLElement>(`[data-name="${to}"] [data-line]`, section)
        const oldMeta = gsap.utils.toArray<HTMLElement>(`[data-meta="${from}"]`, section)
        const newMeta = gsap.utils.toArray<HTMLElement>(`[data-meta="${to}"]`, section)

        collectionRig.particleColorIndex = to
        fromRig.direction = -1
        toRig.direction = 1

        const timeline = gsap.timeline({
          onComplete: () => {
            running.current = null
            displayed.current = to
            settle(to)

            const target = useScrollStore.getState().activeModel

            if (target !== to) {
              transition(to, target)
            }
          },
        })

        running.current = timeline

        timeline.to(
          section,
          {
            "--collection-bg": readColor(next.background),
            "--collection-fg": foreground.large,
            "--collection-fg-small": foreground.small,
            duration: durations.base,
            ease: eases.inOut,
          },
          0,
        )
        timeline.to(oldLines, { yPercent: -105, duration: durations.swift, stagger: staggers.nameLines, ease: eases.inOut }, 0)
        timeline.to(oldMeta, { autoAlpha: 0, duration: durations.instant }, 0)
        timeline.to(fromRig, { print: 0, duration: durations.swift, ease: eases.inOut }, 0)
        timeline.set(`[data-name="${to}"]`, { autoAlpha: 1 }, 0.2)
        timeline.fromTo(
          newLines,
          { yPercent: 105 },
          { yPercent: 0, duration: durations.smooth, stagger: staggers.nameLines, ease: eases.out },
          0.25,
        )
        timeline.to(newMeta, { autoAlpha: 1, duration: durations.fast }, 0.35)
        timeline.fromTo(toRig, { print: 0 }, { print: 1, duration: durations.print, ease: eases.out }, 0.3)
      }

      const unsubscribe = useScrollStore.subscribe((state, previous) => {
        if (state.activeModel === previous.activeModel) {
          return
        }

        if (running.current) {
          running.current.timeScale(motion.transitionBoost)
          return
        }

        if (state.activeModel !== displayed.current) {
          transition(displayed.current, state.activeModel)
        }
      })

      return () => {
        unsubscribe()
        running.current?.kill()
        running.current = null
      }
    },
    { dependencies: [layoutReady, stacked, reducedMotion], scope: sectionRef, revertOnUpdate: true },
  )

  const goToModel = (index: number) => {
    const section = sectionRef.current

    if (!section) {
      return
    }

    if (stacked) {
      section.querySelector(`[data-model-block="${index}"]`)?.scrollIntoView()
      return
    }

    const top = section.getBoundingClientRect().top + window.scrollY
    scrollToPosition(top + window.innerHeight * (index + 0.02), { duration: durations.slow })
  }

  if (stacked) {
    return (
      <StackSection
        id="collection"
        theme="accent"
        label={ru.sections[2]?.title ?? ""}
        overlap="always"
        sectionRef={sectionRef}
        className={styles.stackedRoot}
      >
        {collection.models.map((model, index) => (
          <div
            key={model.id}
            data-model-block={index}
            className={styles.block}
            style={{
              backgroundColor: `var(--color-${model.background})`,
              color: `var(--color-on-${model.background})`,
            }}
          >
            <p className={styles.translation}>{model.meaning}</p>
            <FitText as="h2" lines={[model.name]} widthVw={92} maxHeightVh={18} masked={false} className={styles.name} />
            <p className={styles.description}>{model.description}</p>
            <p className={styles.blockPrice}>{model.price}</p>
            <div data-anchor={`collection-product-${index}`} className={styles.blockAnchor} aria-hidden="true" />
          </div>
        ))}
      </StackSection>
    )
  }

  return (
    <StackSection
      id="collection"
      theme="accent"
      label={ru.sections[2]?.title ?? ""}
      heightVh={sectionHeights.collection}
      overlap="always"
      sectionRef={sectionRef}
      className={styles.root}
      stickyClassName={styles.stage}
    >
      {collection.models.map((model, index) => (
        <div key={model.id}>
          <p data-meta={index} className={styles.translation} style={index === 0 ? undefined : { opacity: 0, visibility: "hidden" }}>
            {model.meaning}
          </p>
          <div data-name={index} className={styles.nameBlock} style={index === 0 ? undefined : { visibility: "hidden" }}>
            <FitText
              as="h2"
              lines={[model.name, model.type]}
              widthVw={58}
              lineCapsVw={[19, 6]}
              className={styles.name}
            />
          </div>
          <p data-meta={index} className={styles.description} style={index === 0 ? undefined : { opacity: 0, visibility: "hidden" }}>
            {model.description}
          </p>
        </div>
      ))}
      <div data-anchor="collection-product" className={styles.anchor} aria-hidden="true" />
      <ul className={styles.thumbs}>
        {collection.models.map((model, index) => {
          const thumbnail = productPhotos[model.id] ?? thumbnails.get(model.id)

          return (
            <li key={model.id}>
              <button
                type="button"
                className={`${styles.thumb} ${activeModel === index ? styles.thumbActive : ""}`}
                aria-label={model.name}
                aria-pressed={activeModel === index}
                onClick={() => goToModel(index)}
              >
                {thumbnail ? <img src={thumbnail} alt="" loading="lazy" /> : null}
              </button>
            </li>
          )
        })}
      </ul>
      <p className={styles.step}>
        {String(activeModel + 1).padStart(2, "0")} / {String(collection.models.length).padStart(2, "0")}
      </p>
    </StackSection>
  )
}
