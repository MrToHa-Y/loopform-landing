import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import { Color, MathUtils } from "three"
import type { Group } from "three"
import { ru } from "@/content/ru"
import type { CatalogModelId } from "@/content/types"
import { useScrollStore } from "@/state/scrollStore"
import { actorModels, actorTargets } from "@/three/actors"
import type { ActorId } from "@/three/actors"
import { getModelParts } from "@/three/models/modelLibrary"
import { createBodyBundle, createFeltBundle, createOakBundle } from "@/three/models/modelMaterials"
import { ProductModel } from "@/three/models/ProductModel"
import { paletteColor } from "@/three/palette"

interface ActorProps {
  id: ActorId
  model?: CatalogModelId
}

const terrazzoSpeckle = 0.3
const stretchLimit = 75 / 45
const colorDamping = 7
const stateDamping = 5

export function Actor({ id, model: modelOverride }: ActorProps) {
  const model = modelOverride ?? actorModels[id]
  const parts = getModelParts(model)
  const groupRef = useRef<Group>(null)
  const pivotRef = useRef<Group>(null)
  const initialized = useRef(false)
  const targetColor = useRef(new Color())
  const isConfigurator = id === "configChair"
  const cushionVisibleByDefault = model === "qum"

  const bundle = useMemo(() => createBodyBundle(parts), [parts])
  const cushionBundle = useMemo(() => (parts.cushion ? createFeltBundle() : null), [parts])
  const topBundle = useMemo(() => (parts.top ? createOakBundle() : null), [parts])

  useEffect(() => {
    const extras = [cushionBundle, topBundle]

    bundle.uniforms.uMinY.value = 0
    bundle.uniforms.uMaxY.value = parts.size.y

    extras.forEach((extra) => {
      if (extra) {
        extra.uniforms.uMinY.value = 0
        extra.uniforms.uMaxY.value = parts.size.y
      }
    })

    return () => {
      const all = [bundle, ...extras]

      all.forEach((item) => {
        item?.material.dispose()
        item?.depthMaterial.dispose()
      })
    }
  }, [bundle, cushionBundle, topBundle, parts])

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

    const clipFloor = target.clipBottom >= 0 ? (state.size.height - target.clipBottom) * state.viewport.dpr : 0

    uniforms.uClipFloor.value = clipFloor
    uniforms.uDirection.value = target.direction
    uniforms.uTime.value = state.clock.elapsedTime

    let stretch = 1

    if (isConfigurator) {
      const config = useScrollStore.getState().configurator
      const option = ru.configurator.colors.find((color) => color.id === config.color)
      const natural = config.color === ru.configurator.models.find((item) => item.id === model)?.color

      targetColor.current.copy(paletteColor(natural ? parts.look.color : (option?.token ?? "cap-red")))
      uniforms.uBaseColor.value.lerp(targetColor.current, 1 - Math.exp(-colorDamping * delta))
      uniforms.uSpeckleAmount.value = MathUtils.damp(
        uniforms.uSpeckleAmount.value,
        config.color === "terrazzo" ? terrazzoSpeckle : parts.look.speckleAmount,
        colorDamping,
        delta,
      )
      uniforms.uRelief.value = MathUtils.damp(uniforms.uRelief.value, config.texture === "relief" ? 1 : 0.3, stateDamping, delta)
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

    const accents = [cushionBundle, topBundle]

    accents.forEach((extra) => {
      if (extra) {
        extra.uniforms.uProgress.value = uniforms.uProgress.value
        extra.uniforms.uMaxY.value = totalHeight
        extra.uniforms.uLegStretch.value = stretch
        extra.uniforms.uClipFloor.value = clipFloor
      }
    })
  })

  const cushionVisible = useScrollStore((state) =>
    cushionVisibleByDefault || (isConfigurator && state.configurator.cushion === "felt"),
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
          topMaterial={topBundle?.material ?? null}
          castShadow={id === "tolqyn" || id === "configChair"}
        />
      </group>
    </group>
  )
}

