import { OrbitControls } from "@react-three/drei"
import { Canvas, useFrame } from "@react-three/fiber"
import { useMemo, useRef, useState } from "react"
import { ACESFilmicToneMapping } from "three"
import type { CatalogModelId } from "@/content/types"
import { createPrintMaterial } from "@/three/materials/printMaterial"
import { getModelParts } from "@/three/models/modelLibrary"
import { paletteColor, speckleColors } from "@/three/palette"
import styles from "./PrintTest.module.scss"

const models: CatalogModelId[] = ["tolqyn", "tas", "qum", "saule", "biik", "kol", "japyraq", "saiabaq", "ornek", "uya"]

interface PreviewProps {
  model: CatalogModelId
  value: number
}

function Preview({ model, value }: PreviewProps) {
  const parts = getModelParts(model)
  const valueRef = useRef(value)
  const bundle = useMemo(
    () =>
      createPrintMaterial({
        color: paletteColor(parts.color),
        speckle: speckleColors(parts.color),
        edgeColor: paletteColor("nozzle"),
        translucent: parts.translucent,
      }),
    [parts],
  )

  valueRef.current = value

  useFrame(() => {
    bundle.uniforms.uProgress.value = valueRef.current
    bundle.uniforms.uMaxY.value = parts.size.y
    bundle.uniforms.uLayerHeight.value = 0.006
  })

  return <mesh geometry={parts.main} material={bundle.material} position={[0, -parts.size.y / 2, 0]} scale={1} />
}

export default function PrintTest() {
  const [value, setValue] = useState(0.6)
  const [model, setModel] = useState<CatalogModelId>("tolqyn")

  return (
    <div className={styles.root}>
      <Canvas
        camera={{ fov: 28, position: [1.2, 0.5, 3.4] }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
        }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[4, 6, 5]} intensity={2.2} />
        <Preview model={model} value={value} />
        <OrbitControls />
      </Canvas>
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
    </div>
  )
}
