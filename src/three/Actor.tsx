import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import { Color, MathUtils } from "three"
import type { Group, PointLight } from "three"
import { ru } from "@/content/ru"
import type { CatalogModelId } from "@/content/types"
import { useScrollStore } from "@/state/scrollStore"
import { actorModels, actorTargets } from "@/three/actors"
import { worldHeight } from "@/three/anchors"
import type { ActorId } from "@/three/actors"
import { createPrintMaterial, defaultLayerHeight } from "@/three/materials/printMaterial"
import { getModelParts } from "@/three/models/modelLibrary"
import { ProductModel } from "@/three/models/ProductModel"
import { paletteColor, speckleColors } from "@/three/palette"

interface ActorProps {
  id: ActorId
  model?: CatalogModelId
}

const minBandPixels = 4
const terrazzoSpeckle = 0.3
const baseSpeckle = 0.035
const stretchLimit = 75 / 45
const colorDamping = 7
const stateDamping = 5

export function Actor({ id, model: modelOverride }: ActorProps) {
  const model = modelOverride ?? actorModels[id]
  const parts = getModelParts(model)
  const groupRef = useRef<Group>(null)
  const pivotRef = useRef<Group>(null)
  const lightRef = useRef<PointLight>(null)
  const initialized = useRef(false)
  const targetColor = useRef(new Color())
  const isConfigurator = id === "configChair"
  const cushionVisibleByDefault = model === "qum"

  const bundle = useMemo(
    () =>
      createPrintMaterial({
        color: paletteColor(parts.color),
        speckle: speckleColors(parts.color),
        edgeColor: paletteColor("nozzle"),
        translucent: parts.translucent && !useScrollStore.getState().compact,
        roughMin: parts.translucent ? 0.3 : undefined,
        roughMax: parts.translucent ? 0.4 : undefined,
      }),
    [parts],
  )

  const cushionBundle = useMemo(() => {
    if (!parts.cushion) {
      return null
    }

    const felt = paletteColor("sand").clone().lerp(paletteColor("bone"), 0.1)

    return createPrintMaterial({
      color: felt,
      speckle: speckleColors("sand"),
      edgeColor: paletteColor("nozzle"),
      speckleAmount: 0,
      relief: 0,
      roughMin: 1,
      roughMax: 1,
    })
  }, [parts])

  useEffect(() => {
    bundle.uniforms.uMinY.value = 0
    bundle.uniforms.uMaxY.value = parts.size.y

    if (cushionBundle) {
      cushionBundle.uniforms.uMinY.value = 0
      cushionBundle.uniforms.uMaxY.value = parts.size.y
    }

    return () => {
      bundle.material.dispose()
      bundle.depthMaterial.dispose()
      cushionBundle?.material.dispose()
      cushionBundle?.depthMaterial.dispose()
    }
  }, [bundle, cushionBundle, parts])

  useFrame((state, delta) => {
    const target = actorTargets[id]
    const group = groupRef.current
    const pivot = pivotRef.current

    if (!group || !pivot) {
      return
    }

    group.visible = target.visible

    if (!target.visible) {
      initialized.current = false
      return
    }

    const uniforms = bundle.uniforms
    const reduced = useScrollStore.getState().reducedMotion

    if (!initialized.current || reduced) {
      group.position.set(target.x, target.y, target.z)
      group.scale.setScalar(target.scale)
      group.rotation.set(target.rotationX, target.rotationY, target.rotationZ)
      uniforms.uProgress.value = target.print
      initialized.current = true
    } else {
      group.position.x = MathUtils.damp(group.position.x, target.x, target.stiffness, delta)
      group.position.y = MathUtils.damp(group.position.y, target.y, target.stiffness, delta)
      group.position.z = MathUtils.damp(group.position.z, target.z, target.stiffness, delta)
      group.scale.setScalar(MathUtils.damp(group.scale.x, target.scale, target.stiffness, delta))
      group.rotation.x = MathUtils.damp(group.rotation.x, target.rotationX, target.rotationStiffness, delta)
      group.rotation.y = MathUtils.damp(group.rotation.y, target.rotationY, target.rotationStiffness, delta)
      group.rotation.z = MathUtils.damp(group.rotation.z, target.rotationZ, target.rotationStiffness, delta)
      uniforms.uProgress.value = MathUtils.damp(uniforms.uProgress.value, target.print, target.printStiffness, delta)
    }

    const pixelsPerMeter = (state.size.height / worldHeight) * group.scale.x
    const layerHeight = Math.max(defaultLayerHeight, minBandPixels / Math.max(pixelsPerMeter, 1))

    uniforms.uLayerHeight.value = layerHeight
    uniforms.uDirection.value = target.direction
    uniforms.uTime.value = state.clock.elapsedTime

    let stretch = 1

    if (isConfigurator) {
      const config = useScrollStore.getState().configurator
      const option = ru.configurator.colors.find((color) => color.id === config.color)
      const token = option?.token ?? "cap-red"

      targetColor.current.copy(paletteColor(token))
      uniforms.uBaseColor.value.lerp(targetColor.current, 1 - Math.exp(-colorDamping * delta))
      uniforms.uSpeckleAmount.value = MathUtils.damp(
        uniforms.uSpeckleAmount.value,
        config.color === "terrazzo" ? terrazzoSpeckle : baseSpeckle,
        colorDamping,
        delta,
      )
      uniforms.uRelief.value = MathUtils.damp(uniforms.uRelief.value, config.texture === "relief" ? 1.6 : 0.35, stateDamping, delta)
      uniforms.uLegStretch.value = MathUtils.damp(
        uniforms.uLegStretch.value,
        model === "tolqyn" && config.height === "bar" ? stretchLimit : 1,
        stateDamping,
        delta,
      )
      stretch = uniforms.uLegStretch.value
    }

    const extraHeight = uniforms.uSeatY.value * (stretch - 1)
    const totalHeight = parts.size.y + extraHeight

    uniforms.uMaxY.value = totalHeight
    pivot.position.y = -totalHeight / 2

    if (cushionBundle) {
      const cushion = cushionBundle.uniforms

      cushion.uProgress.value = uniforms.uProgress.value
      cushion.uMaxY.value = totalHeight
      cushion.uLegStretch.value = stretch
      cushion.uLayerHeight.value = layerHeight
    }

    if (lightRef.current) {
      lightRef.current.intensity = uniforms.uProgress.value * 3.2
    }
  })

  const cushionVisible = useScrollStore((state) =>
    isConfigurator ? state.configurator.cushion === "felt" : cushionVisibleByDefault,
  )

  return (
    <group ref={groupRef} visible={false}>
      <group ref={pivotRef}>
        <ProductModel
          model={model}
          material={bundle.material}
          depthMaterial={bundle.depthMaterial}
          cushionMaterial={cushionBundle?.material ?? null}
          cushionVisible={cushionVisible}
          castShadow={id === "tolqyn" || id === "configChair"}
        />
        {parts.translucent ? (
          <pointLight ref={lightRef} position={[0, parts.size.y * 0.45, 0]} color={paletteColor("lamp")} distance={2.4} decay={2} />
        ) : null}
      </group>
    </group>
  )
}

