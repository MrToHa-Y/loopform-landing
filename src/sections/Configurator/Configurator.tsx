import { useRef } from "react"
import type { CSSProperties, PointerEvent, ReactNode } from "react"
import { useSectionProgress } from "@/animation/useSectionProgress"
import { sectionHeights } from "@/animation/tokens"
import { DrumNumber } from "@/components/DrumNumber/DrumNumber"
import { MagneticButton } from "@/components/MagneticButton/MagneticButton"
import { SplitLines } from "@/components/SplitLines/SplitLines"
import { StackSection } from "@/components/StackSection/StackSection"
import { ru } from "@/content/ru"
import type { ConfiguratorOption } from "@/content/types"
import { useScrollStore } from "@/state/scrollStore"
import { buildTelegramLink, computeResult } from "./configuratorResult"
import styles from "./Configurator.module.scss"

interface GroupProps {
  title: string
  children: ReactNode
}

function PanelGroup({ title, children }: GroupProps) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.groupTitle}>{title}</legend>
      {children}
    </fieldset>
  )
}

interface SegmentedProps<Id extends string> {
  options: ConfiguratorOption<Id>[]
  value: Id
  onChange: (value: Id) => void
}

function Segmented<Id extends string>({ options, value, onChange }: SegmentedProps<Id>) {
  return (
    <div className={styles.segmented}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`${styles.segment} ${option.id === value ? styles.segmentActive : ""}`}
          aria-pressed={option.id === value}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

const dragSensitivity = 0.6

export function Configurator() {
  const sectionRef = useRef<HTMLElement>(null)
  const drag = useRef({ active: false, x: 0, angle: 0 })
  const state = useScrollStore((store) => store.configurator)
  const setConfigurator = useScrollStore((store) => store.setConfigurator)
  const { configurator } = ru
  const result = computeResult(state)
  const angles: number[] = []

  for (let angle = configurator.angle.min; angle <= configurator.angle.max; angle += configurator.angle.step) {
    angles.push(angle)
  }

  useSectionProgress(sectionRef, "configurator")

  const handleDown = (event: PointerEvent<HTMLDivElement>) => {
    drag.current = { active: true, x: event.clientX, angle: state.dragAngle }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current.active) {
      setConfigurator({ dragAngle: drag.current.angle + (event.clientX - drag.current.x) * dragSensitivity })
    }
  }

  const handleUp = () => {
    drag.current.active = false
  }

  return (
    <StackSection
      id="configurator"
      theme="light"
      label={ru.sections[7]?.title ?? ""}
      overlap
      sectionRef={sectionRef}
      className={styles.root}
    >
      <div data-anchor="configurator-seam" className={styles.seam} aria-hidden="true" />
      <div className={styles.inner} style={{ minHeight: `${sectionHeights.configurator}vh` }}>
        <SplitLines as="h2" className={styles.title}>
          {configurator.title}
        </SplitLines>
        <div className={styles.workspace}>
          <div className={styles.panel}>
            <PanelGroup title={configurator.groups.color}>
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
            <PanelGroup title={configurator.groups.height}>
              <Segmented
                options={configurator.heights}
                value={state.height}
                onChange={(height) => setConfigurator({ height })}
              />
            </PanelGroup>
            <PanelGroup title={configurator.groups.texture}>
              <Segmented
                options={configurator.textures}
                value={state.texture}
                onChange={(texture) => setConfigurator({ texture })}
              />
            </PanelGroup>
            <PanelGroup title={configurator.groups.cushion}>
              <Segmented
                options={configurator.cushions}
                value={state.cushion}
                onChange={(cushion) => setConfigurator({ cushion })}
              />
            </PanelGroup>
            <PanelGroup title={configurator.groups.angle}>
              <div className={styles.angles}>
                {angles.map((angle) => (
                  <button
                    key={angle}
                    type="button"
                    className={`${styles.angle} ${angle === state.angle ? styles.segmentActive : ""}`}
                    aria-pressed={angle === state.angle}
                    onClick={() => setConfigurator({ angle, dragAngle: 0 })}
                  >
                    {angle}
                    {configurator.angle.unit}
                  </button>
                ))}
              </div>
            </PanelGroup>
          </div>
          <div className={styles.preview}>
            <div
              data-anchor="configurator-product"
              className={styles.anchor}
              onPointerDown={handleDown}
              onPointerMove={handleMove}
              onPointerUp={handleUp}
              onPointerCancel={handleUp}
            />
            <div className={styles.board}>
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
              <MagneticButton>
                <a href={buildTelegramLink(state)} target="_blank" rel="noreferrer" className={styles.submit}>
                  {configurator.submitLabel}
                </a>
              </MagneticButton>
            </div>
          </div>
        </div>
      </div>
    </StackSection>
  )
}
