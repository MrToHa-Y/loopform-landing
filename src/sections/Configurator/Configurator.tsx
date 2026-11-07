import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { gsap } from "@/animation/gsap"
import { durations, eases, sectionHeights } from "@/animation/tokens"
import { useSectionProgress } from "@/animation/useSectionProgress"
import { DrumNumber } from "@/components/DrumNumber/DrumNumber"
import { MagneticButton } from "@/components/MagneticButton/MagneticButton"
import { StackSection } from "@/components/StackSection/StackSection"
import { productPhotos } from "@/content/images"
import { ru } from "@/content/ru"
import type { CatalogModelId, ConfiguratorGroupId } from "@/content/types"
import { configuratorRig, configuratorView, thumbnails, useScrollStore } from "@/state/scrollStore"
import { buildTelegramLink, computeResult, findModel } from "./configuratorResult"
import { PanelGroup } from "./PanelGroup"
import { Segmented } from "./Segmented"
import { useViewGestures } from "./useViewGestures"
import styles from "./Configurator.module.scss"

const fullTurn = 360

function normalizeAngle(value: number) {
  return ((value % fullTurn) + fullTurn) % fullTurn
}

export function Configurator() {
  const sectionRef = useRef<HTMLElement>(null)
  const angleRef = useRef<HTMLSpanElement>(null)
  const [activeGroup, setActiveGroup] = useState<ConfiguratorGroupId>("model")
  const [touched, setTouched] = useState(false)
  const state = useScrollStore((store) => store.configurator)
  const setConfigurator = useScrollStore((store) => store.setConfigurator)
  useScrollStore((store) => store.thumbnailsVersion)
  const { configurator } = ru
  const model = findModel(state)
  const adjustable = model?.adjustable ?? false
  const result = computeResult(state)
  const angles: number[] = []

  for (let angle = configurator.angle.min; angle <= configurator.angle.max; angle += configurator.angle.step) {
    angles.push(angle)
  }

  const groups: ConfiguratorGroupId[] = adjustable
    ? ["model", "color", "height", "texture", "cushion"]
    : ["model", "color", "texture"]

  useSectionProgress(sectionRef, "configurator")

  const syncAngle = () => {
    const exact = normalizeAngle(configuratorView.yaw)
    const nearest = normalizeAngle(Math.round(exact / configurator.angle.step) * configurator.angle.step)

    if (angleRef.current) {
      angleRef.current.textContent = `${Math.round(exact)}${configurator.angle.unit}`
    }

    if (useScrollStore.getState().configurator.angle !== nearest) {
      setConfigurator({ angle: nearest })
    }
  }

  const gestures = useViewGestures(() => {
    setTouched(true)
    syncAngle()
  })

  const resetView = () => {
    configuratorView.yaw = 0
    configuratorView.pitch = 0
    configuratorView.x = 0
    configuratorView.y = 0
    configuratorView.zoom = 1
    syncAngle()
  }

  const selectAngle = (angle: number) => {
    const current = normalizeAngle(configuratorView.yaw)
    const shortest = ((angle - current + fullTurn * 1.5) % fullTurn) - fullTurn / 2

    configuratorView.yaw += shortest
    syncAngle()
  }

  const selectModel = (id: CatalogModelId) => {
    if (id === state.model) {
      return
    }

    gsap.to(configuratorRig, {
      print: 0,
      duration: durations.fast,
      ease: eases.inOut,
      overwrite: true,
      onComplete: () => {
        setConfigurator({ model: id, height: "dining", cushion: "none" })
        resetView()
        gsap.to(configuratorRig, { print: 1, duration: durations.print, ease: eases.out })
      },
    })
  }

  useEffect(() => {
    if (!groups.includes(activeGroup)) {
      setActiveGroup("model")
    }
  }, [activeGroup, groups])

  return (
    <StackSection
      id="configurator"
      theme="light"
      label={ru.sections[8]?.title ?? ""}
      heightVh={sectionHeights.configurator}
      overlap
      sectionRef={sectionRef}
      className={styles.root}
      stickyClassName={styles.stage}
      leading={<div data-anchor="configurator-seam" className={styles.seam} aria-hidden="true" />}
    >
      <div className={styles.preview}>
        <h2 className={styles.title}>
          {configurator.titlePrefix} {model?.name}
        </h2>
        <div className={styles.viewport}>
          <div data-anchor="configurator-product" className={styles.anchor} {...gestures} onDoubleClick={resetView} />
          <span ref={angleRef} className={styles.angleReadout} aria-hidden="true">
            0{configurator.angle.unit}
          </span>
          <button type="button" className={styles.reset} onClick={resetView}>
            {configurator.resetLabel}
          </button>
          <p className={`${styles.hint} ${touched ? styles.hintHidden : ""}`}>{configurator.gestureHint}</p>
        </div>
        <dl className={styles.results}>
          <div>
            <dt>{configurator.result.price}</dt>
            <dd>
              <DrumNumber text={result.price} />
            </dd>
          </div>
          <div>
            <dt>{configurator.result.weight}</dt>
            <dd>
              <DrumNumber text={result.weight} />
            </dd>
          </div>
          <div>
            <dt>{configurator.result.caps}</dt>
            <dd>
              <DrumNumber text={result.caps} />
            </dd>
          </div>
        </dl>
      </div>

      <div className={styles.side}>
        <div className={styles.panel}>
          <div className={styles.tabs} role="tablist" aria-label={configurator.titlePrefix}>
            {groups.map((group) => (
              <button
                key={group}
                type="button"
                role="tab"
                aria-selected={group === activeGroup}
                className={`${styles.tab} ${group === activeGroup ? styles.tabActive : ""}`}
                onClick={() => setActiveGroup(group)}
              >
                {configurator.tabs[group]}
              </button>
            ))}
          </div>

          <PanelGroup title={configurator.groups.model} active={activeGroup === "model"}>
            <div className={styles.models} data-lenis-prevent>
              {configurator.models.map((item) => {
                const image = productPhotos[item.id] ?? thumbnails.get(item.id)

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.model} ${item.id === state.model ? styles.modelActive : ""}`}
                    aria-pressed={item.id === state.model}
                    onClick={() => selectModel(item.id)}
                  >
                    <span className={styles.modelThumb}>{image ? <img src={image} alt="" loading="lazy" /> : null}</span>
                    <span className={styles.modelName}>{item.name}</span>
                  </button>
                )
              })}
            </div>
          </PanelGroup>

          <PanelGroup title={configurator.groups.color} active={activeGroup === "color"}>
            <div className={styles.swatches}>
              {configurator.colors.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  className={`${styles.swatch} ${color.id === "terrazzo" ? styles.terrazzo : ""} ${
                    color.id === state.color ? styles.swatchActive : ""
                  }`}
                  style={{ "--swatch": `var(--color-${color.token})` } as CSSProperties}
                  aria-label={color.label}
                  aria-pressed={color.id === state.color}
                  onClick={() => setConfigurator({ color: color.id })}
                />
              ))}
            </div>
          </PanelGroup>

          {adjustable ? (
            <PanelGroup title={configurator.groups.height} active={activeGroup === "height"}>
              <Segmented
                options={configurator.heights}
                value={state.height}
                onChange={(height) => setConfigurator({ height })}
              />
            </PanelGroup>
          ) : null}

          <PanelGroup title={configurator.groups.texture} active={activeGroup === "texture"}>
            <Segmented
              options={configurator.textures}
              value={state.texture}
              onChange={(texture) => setConfigurator({ texture })}
            />
          </PanelGroup>

          {adjustable ? (
            <PanelGroup title={configurator.groups.cushion} active={activeGroup === "cushion"}>
              <Segmented
                options={configurator.cushions}
                value={state.cushion}
                onChange={(cushion) => setConfigurator({ cushion })}
              />
            </PanelGroup>
          ) : null}

          <PanelGroup title={configurator.groups.angle} active pinned>
            <div className={styles.angles}>
              {angles.map((angle) => (
                <button
                  key={angle}
                  type="button"
                  className={`${styles.angle} ${angle === state.angle ? styles.segmentActive : ""}`}
                  aria-pressed={angle === state.angle}
                  onClick={() => selectAngle(angle)}
                >
                  {angle}
                  {configurator.angle.unit}
                </button>
              ))}
            </div>
          </PanelGroup>
        </div>

        <MagneticButton className={styles.submitWrap}>
          <a href={buildTelegramLink(state)} target="_blank" rel="noreferrer" className={styles.submit}>
            {configurator.submitLabel}
          </a>
        </MagneticButton>
      </div>
    </StackSection>
  )
}
