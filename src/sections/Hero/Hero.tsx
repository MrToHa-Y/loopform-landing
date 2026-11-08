import { useRef } from "react"
import { ScrollTrigger, SplitText, gsap, useGSAP } from "@/animation/gsap"
import { durations, eases, motion, scatter, sectionHeights, staggers } from "@/animation/tokens"
import { useSectionProgress } from "@/animation/useSectionProgress"
import { FitText } from "@/components/FitText/FitText"
import { StackSection } from "@/components/StackSection/StackSection"
import { ru } from "@/content/ru"
import { sectionTitle } from "@/content/sectionTitle"
import { heroRig, readProgress, useScrollStore } from "@/state/scrollStore"
import { createRandom } from "@/three/random"
import styles from "./Hero.module.scss"

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const layerRef = useRef<HTMLSpanElement>(null)
  const layoutReady = useScrollStore((state) => state.layoutReady)
  const preloaderDone = useScrollStore((state) => state.preloaderDone)
  const reducedMotion = useScrollStore((state) => state.reducedMotion)
  const viewportVersion = useScrollStore((state) => state.viewportVersion)
  const { hero } = ru

  useSectionProgress(sectionRef, "hero")

  useGSAP(
    () => {
      const section = sectionRef.current

      if (!layoutReady || !preloaderDone || !section) {
        return
      }

      if (reducedMotion) {
        heroRig.entrance = 1
        return
      }

      const masks = gsap.utils.toArray<HTMLElement>("[data-fit-mask]", section)
      const lines = gsap.utils.toArray<HTMLElement>("[data-line]", section)
      const inners = gsap.utils.toArray<HTMLElement>("[data-line-inner]", section)
      const split = SplitText.create(inners, { type: "chars", charsClass: "split-char", aria: "none" })
      const random = createRandom(motion.scatterSeed)

      gsap.set(lines, { yPercent: 105 })

      const entrance = gsap.timeline({
        paused: true,
        onComplete: () => {
          gsap.set(masks, { overflow: "visible" })
        },
      })

      entrance.to(lines, {
        yPercent: 0,
        duration: durations.reveal,
        stagger: staggers.lines,
        ease: eases.out,
      })
      entrance.to(heroRig, { entrance: 1, duration: durations.hero, ease: eases.out }, 0)

      const entranceTrigger = ScrollTrigger.create({
        trigger: section,
        start: () => `top+=${window.innerHeight * 0.06} top`,
        once: true,
        onEnter: () => {
          entrance.play()
        },
      })

      const scatterTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: () => `top+=${window.innerHeight * 1.1} top`,
          end: () => `top+=${window.innerHeight * 1.9} top`,
          scrub: motion.scrub,
          invalidateOnRefresh: true,
          onEnter: () => {
            entrance.progress(1)
            gsap.set(masks, { overflow: "visible" })
          },
        },
      })

      split.chars.forEach((char) => {
        scatterTimeline.to(
          char,
          {
            x: () => ((random() * 2 - 1) * scatter.xVw * window.innerWidth) / 100,
            y: () => ((random() * (scatter.yVhUp + scatter.yVhDown) - scatter.yVhUp) * window.innerHeight) / 100,
            rotation: (random() * 2 - 1) * scatter.rotation,
            scale: scatter.scaleMin + random() * (scatter.scaleMax - scatter.scaleMin),
            ease: eases.linear,
          },
          0,
        )
      })

      scatterTimeline.to("[data-hero-meta]", { opacity: 0, ease: eases.linear, duration: 0.4 }, 0)

      return () => {
        entranceTrigger.kill()
        split.revert()
      }
    },
    { dependencies: [layoutReady, preloaderDone, reducedMotion, viewportVersion], scope: sectionRef, revertOnUpdate: true },
  )

  useGSAP(
    () => {
      const update = () => {
        if (layerRef.current) {
          const layer = Math.round(readProgress("heroPrint") * hero.layerTotal)
          layerRef.current.textContent = String(layer).padStart(3, "0")
        }
      }

      gsap.ticker.add(update)

      return () => gsap.ticker.remove(update)
    },
    { dependencies: [hero.layerTotal] },
  )

  return (
    <StackSection
      id="hero"
      theme="light"
      label={sectionTitle("hero")}
      heightVh={sectionHeights.hero}
      themeOffsetVh={100}
      sectionRef={sectionRef}
      className={styles.root}
      stickyClassName={styles.stage}
    >
      <FitText as="h1" lines={hero.titleLines} widthVw={92} maxHeightVh={56} className={styles.title} />
      <div className={styles.footer}>
        <p data-hero-meta className={styles.subtitle}>
          {hero.subtitle}
        </p>
        <p data-hero-meta className={styles.slogan}>
          {hero.slogan}
        </p>
      </div>
      <p className={styles.layer}>
        {hero.layerLabel} <span ref={layerRef}>000</span> / {hero.layerTotal}
      </p>
      <div data-anchor="hero-product" className={styles.anchor} aria-hidden="true" />
    </StackSection>
  )
}
