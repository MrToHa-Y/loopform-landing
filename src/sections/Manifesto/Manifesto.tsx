import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { gsap, useGSAP } from "@/animation/gsap"
import { eases, sectionHeights, segments } from "@/animation/tokens"
import { useSectionProgress } from "@/animation/useSectionProgress"
import { FitText } from "@/components/FitText/FitText"
import { StackSection } from "@/components/StackSection/StackSection"
import { ru } from "@/content/ru"
import { sectionTitle } from "@/content/sectionTitle"
import { useScrollStore } from "@/state/scrollStore"
import styles from "./Manifesto.module.scss"

const bandCount = 10
const drift = 6

export function Manifesto() {
  const sectionRef = useRef<HTMLElement>(null)
  const [hasPhoto, setHasPhoto] = useState(false)
  const layoutReady = useScrollStore((state) => state.layoutReady)
  const reducedMotion = useScrollStore((state) => state.reducedMotion)
  const { manifesto } = ru

  useSectionProgress(sectionRef, "manifesto")

  useEffect(() => {
    const image = new Image()
    image.onload = () => setHasPhoto(true)
    image.src = manifesto.imagePath
  }, [manifesto.imagePath])

  useGSAP(
    () => {
      const section = sectionRef.current

      if (!layoutReady || reducedMotion || !section) {
        return
      }

      const [linesFrom, linesTo] = segments.manifesto.manifestoLines
      const [photoFrom, photoTo] = segments.manifesto.manifestoPhoto
      const at = (vh: number) => {
        const pixels = (vh / 100) * window.innerHeight
        return pixels >= 0 ? `top+=${pixels} top` : `top-=${Math.abs(pixels)} top`
      }

      gsap.utils.toArray<HTMLElement>("[data-line]", section).forEach((line, index) => {
        gsap.fromTo(
          line,
          { x: () => ((index % 2 === 0 ? drift : -drift) * window.innerWidth) / 100 },
          {
            x: () => ((index % 2 === 0 ? -drift : drift) * window.innerWidth) / 100,
            ease: eases.linear,
            scrollTrigger: {
              trigger: section,
              start: () => at(linesFrom),
              end: () => at(linesTo),
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        )
      })

      const reveal = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: () => at(photoFrom),
          end: () => at(photoTo),
          scrub: true,
          invalidateOnRefresh: true,
        },
      })

      reveal.fromTo("[data-photo-label]", { autoAlpha: 0 }, { autoAlpha: 1, ease: eases.linear, duration: 0.15 }, 0.1)
      reveal.fromTo("[data-photo]", { yPercent: 40 }, { yPercent: 0, ease: eases.linear, duration: 1 }, 0)
      reveal.fromTo(
        "[data-band]",
        { clipPath: "inset(0% 0% 100% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", ease: eases.linear, duration: 0.3, stagger: 0.07 },
        0,
      )
    },
    { dependencies: [layoutReady, reducedMotion], scope: sectionRef },
  )

  const photoStyle = {
    "--photo": hasPhoto ? `url("${manifesto.imagePath}")` : undefined,
  } as CSSProperties

  return (
    <StackSection
      id="manifesto"
      theme="light"
      label={sectionTitle("manifesto")}
      heightVh={sectionHeights.manifesto}
      sectionRef={sectionRef}
      className={styles.root}
      stickyClassName={styles.stage}
    >
      <FitText as="h2" lines={manifesto.lines} widthVw={96} maxHeightVh={62} masked={false} className={styles.title} />
      <figure
        data-photo
        className={`${styles.photo} ${hasPhoto ? styles.withPhoto : ""}`}
        style={photoStyle}
        role="img"
        aria-label={manifesto.imageAlt}
      >
        {Array.from({ length: bandCount }, (_, index) => (
          <span
            key={index}
            data-band
            className={styles.band}
            style={{ "--band-index": index } as CSSProperties}
          />
        ))}
        <p data-photo-label className={styles.pilot}>
          {manifesto.pilotCall}
        </p>
      </figure>
    </StackSection>
  )
}
