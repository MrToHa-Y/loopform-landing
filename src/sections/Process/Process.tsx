import { useMemo, useRef } from "react"
import { gsap, useGSAP } from "@/animation/gsap"
import { eases, motion, sectionHeights } from "@/animation/tokens"
import { useSectionProgress } from "@/animation/useSectionProgress"
import { StackSection } from "@/components/StackSection/StackSection"
import { ru } from "@/content/ru"
import { useScrollStore } from "@/state/scrollStore"
import styles from "./Process.module.scss"

const zigzagWidth = 1000
const zigzagHeight = 40
const zigzagTeeth = 34

function buildZigzag() {
  const stepX = zigzagWidth / zigzagTeeth
  let path = `M0 ${zigzagHeight / 2}`

  for (let index = 1; index <= zigzagTeeth; index += 1) {
    const y = index % 2 === 0 ? zigzagHeight - 4 : 4
    path += ` L${(index * stepX).toFixed(1)} ${y}`
  }

  return path
}

export function Process() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLOListElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const runnerRef = useRef<HTMLSpanElement>(null)
  const layoutReady = useScrollStore((state) => state.layoutReady)
  const compact = useScrollStore((state) => state.compact)
  const reducedMotion = useScrollStore((state) => state.reducedMotion)
  const viewportVersion = useScrollStore((state) => state.viewportVersion)
  const zigzag = useMemo(buildZigzag, [])
  const { process } = ru
  const stacked = compact || reducedMotion

  useSectionProgress(sectionRef, "process")

  useGSAP(
    () => {
      const section = sectionRef.current
      const track = trackRef.current
      const path = pathRef.current
      const runner = runnerRef.current

      if (!layoutReady || !section || !track || !path || !runner || stacked) {
        return
      }

      const length = path.getTotalLength()

      path.style.strokeDasharray = `${length}`

      const draw = (value: number) => {
        const point = path.getPointAtLength(value * length)
        path.style.strokeDashoffset = `${length * (1 - value)}`
        runner.style.left = `${(point.x / zigzagWidth) * 100}%`
        runner.style.top = `${(point.y / zigzagHeight) * 100}%`
      }

      draw(0)

      gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: eases.linear,
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `top+=${window.innerHeight * 2} top`,
          scrub: motion.scrub,
          invalidateOnRefresh: true,
          onUpdate: (self) => draw(self.progress),
        },
      })
    },
    { dependencies: [layoutReady, stacked, viewportVersion], scope: sectionRef, revertOnUpdate: true },
  )

  return (
    <StackSection
      id="process"
      theme="light"
      label={ru.sections[5]?.title ?? ""}
      heightVh={sectionHeights.process}
      overlap="always"
      flowOnMobile
      sectionRef={sectionRef}
      className={styles.root}
      stickyClassName={styles.stage}
    >
      <h2 className={styles.title}>{process.title}</h2>
      <ol ref={trackRef} className={styles.track}>
        {process.steps.map((step, index) => (
          <li key={step.number} className={styles.panel}>
            <div className={styles.copy}>
              <p className={styles.number} aria-hidden="true">
                {step.number}
              </p>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.text}>{step.text}</p>
              {step.inset ? (
                <figure className={styles.inset}>
                  <img src={step.inset.src} alt={step.inset.alt} loading="lazy" />
                  <figcaption className={styles.aiNote}>{ru.brand.aiImageNote}</figcaption>
                </figure>
              ) : null}
            </div>
            {step.photo ? (
              <figure className={styles.frame}>
                <img src={step.photo.src} alt={step.photo.alt} loading="lazy" />
                <figcaption className={styles.aiNote}>{ru.brand.aiImageNote}</figcaption>
              </figure>
            ) : (
              <div data-anchor={`process-${index + 1}`} className={styles.anchor} aria-hidden="true" />
            )}
          </li>
        ))}
      </ol>
      <div className={styles.line} aria-hidden="true">
        <svg viewBox={`0 0 ${zigzagWidth} ${zigzagHeight}`} preserveAspectRatio="none">
          <path ref={pathRef} d={zigzag} />
        </svg>
        <span ref={runnerRef} className={styles.runner} />
      </div>
    </StackSection>
  )
}
