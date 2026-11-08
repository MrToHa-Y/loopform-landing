import { useRef } from "react"
import { gsap, useGSAP } from "@/animation/gsap"
import { durations, eases, staggers } from "@/animation/tokens"
import { useSectionProgress } from "@/animation/useSectionProgress"
import { FitText } from "@/components/FitText/FitText"
import { ru } from "@/content/ru"
import { sectionTitle } from "@/content/sectionTitle"
import { useScrollStore } from "@/state/scrollStore"
import styles from "./Intro.module.scss"

export function Intro() {
  const sectionRef = useRef<HTMLElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const layoutReady = useScrollStore((state) => state.layoutReady)
  const preloaderDone = useScrollStore((state) => state.preloaderDone)
  const reducedMotion = useScrollStore((state) => state.reducedMotion)
  const { intro } = ru

  useSectionProgress(sectionRef, "intro")

  useGSAP(
    () => {
      if (!layoutReady || reducedMotion) {
        return
      }

      gsap.set("[data-line]", { yPercent: 105 })
      gsap.set("[data-intro-meta]", { opacity: 0 })
    },
    { dependencies: [layoutReady, reducedMotion], scope: sectionRef },
  )

  useGSAP(
    () => {
      if (!preloaderDone || reducedMotion) {
        return
      }

      gsap.to("[data-line]", {
        yPercent: 0,
        duration: durations.reveal,
        stagger: staggers.lines,
        ease: eases.out,
      })
      gsap.to("[data-intro-meta]", {
        opacity: 1,
        duration: durations.base,
        delay: durations.fast,
      })
    },
    { dependencies: [preloaderDone, reducedMotion], scope: sectionRef },
  )

  useGSAP(
    () => {
      const section = sectionRef.current

      if (!layoutReady || reducedMotion || !section) {
        return
      }

      gsap.to(textRef.current, {
        y: () => -window.innerHeight * 0.3,
        ease: eases.linear,
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true,
        },
      })

      gsap.to("[data-line-inner]", {
        yPercent: -115,
        ease: eases.linear,
        stagger: 0.2,
        scrollTrigger: {
          trigger: section,
          start: () => `top+=${window.innerHeight * 0.4} top`,
          end: () => `top+=${window.innerHeight * 0.9} top`,
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
    },
    { dependencies: [layoutReady, reducedMotion], scope: sectionRef },
  )

  return (
    <section ref={sectionRef} data-section="intro" data-theme="dark" className={styles.root} aria-label={sectionTitle("intro")}>
      <div ref={textRef} className={styles.text}>
        <FitText as="p" lines={intro.lines} widthVw={92} maxHeightVh={62} className={styles.title} />
      </div>
      <div className={styles.meta}>
        <p data-intro-meta>{intro.eyebrowLeft}</p>
        <p data-intro-meta>{intro.eyebrowRight}</p>
      </div>
    </section>
  )
}
