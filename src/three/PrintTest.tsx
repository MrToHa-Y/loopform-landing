import { OrbitControls } from "@react-three/drei"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState } from "react"
import { ACESFilmicToneMapping } from "three"
import type { CatalogModelId } from "@/content/types"
import { getModelParts } from "@/three/models/modelLibrary"
import { createBodyBundle, createFeltBundle, createOakBundle } from "@/three/models/modelMaterials"
import { paletteColor } from "@/three/palette"
import { StageLights } from "@/three/StageLights"
import styles from "./PrintTest.module.scss"

const models: CatalogModelId[] = ["tolqyn", "tas", "qum", "saule", "biik", "kol", "japyraq", "saiabaq", "ornek", "uya"]
const degrees = Math.PI / 180
const studioFov = 12

const search = new URLSearchParams(window.location.search)
const requestedModel = search.get("model") as CatalogModelId | null
const fixedView = search.has("yaw")
const yaw = Number(search.get("yaw") ?? 0)
const pitch = Number(search.get("pitch") ?? 0)
const fill = Number(search.get("fill") ?? 0.72)

declare global {
  interface Window {
    __studioReady?: boolean
  }
}

interface PreviewProps {
  model: CatalogModelId
  value: number
}

function Preview({ model, value }: PreviewProps) {
  const parts = getModelParts(model)
  const valueRef = useRef(value)
  const bundle = useMemo(() => createBodyBundle(parts), [parts])
  const felt = useMemo(() => (parts.cushion ? createFeltBundle() : null), [parts])
  const oak = useMemo(() => (parts.top ? createOakBundle() : null), [parts])

  valueRef.current = value

  useFrame(() => {
    const items = [bundle, felt, oak]

    items.forEach((item) => {
      if (item) {
        item.uniforms.uProgress.value = valueRef.current
        item.uniforms.uMaxY.value = parts.size.y
      }
    })
  })

  return (
    <group rotation-y={fixedView ? yaw * degrees : 0} position-y={-parts.size.y / 2}>
      <mesh geometry={parts.main} material={bundle.material} />
      {parts.cushion && felt && model === "qum" ? <mesh geometry={parts.cushion} material={felt.material} /> : null}
      {parts.top && oak ? <mesh geometry={parts.top} material={oak.material} /> : null}
    </group>
  )
}

function StudioCamera({ model }: { model: CatalogModelId }) {
  const camera = useThree((state) => state.camera)
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    const parts = getModelParts(model)
    const span = Math.max(parts.size.y, Math.hypot(parts.size.x, parts.size.z) * 0.72)
    const distance = span / fill / (2 * Math.tan((studioFov * degrees) / 2))

    camera.position.set(0, Math.sin(pitch * degrees) * distance, Math.cos(pitch * degrees) * distance)
    camera.lookAt(0, 0, 0)
    invalidate()

    const timer = window.setTimeout(() => {
      window.__studioReady = true
    }, 900)

    return () => window.clearTimeout(timer)
  }, [camera, invalidate, model])

  return null
}

export default function PrintTest() {
  const [value, setValue] = useState(fixedView ? 1 : 0.6)
  const [model, setModel] = useState<CatalogModelId>(requestedModel ?? "tolqyn")

  return (
    <div className={styles.root}>
      <Canvas
        dpr={1}
        camera={{ fov: fixedView ? studioFov : 28, position: [1.2, 0.5, 3.4] }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
          gl.setClearColor(paletteColor("studio"), 1)
        }}
      >
        <StageLights />
        <Preview model={model} value={value} />
        {fixedView ? <StudioCamera model={model} /> : <OrbitControls />}
      </Canvas>
      {fixedView ? null : (
        <div className={styles.controls}>
          <label className={styles.label}>
            uProgress {value.toFixed(2)}
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={value}
              onChange={(event) => setValue(Number(event.target.value))}
            />
          </label>
          <div className={styles.models}>
            {models.map((id) => (
              <button key={id} type="button" className={styles.model} aria-pressed={id === model} onClick={() => setModel(id)}>
                {id}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
