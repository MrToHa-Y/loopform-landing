import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import { IcosahedronGeometry, MathUtils, ShaderMaterial, Vector2, Vector3 } from "three"
import type { Mesh } from "three"
import { useScrollStore } from "@/state/scrollStore"
import { cameraDistance, cameraFov } from "@/three/anchors"
import { meltDirective } from "@/three/directives"
import fragmentShader from "@/three/melt/meltBlob.frag.glsl?raw"
import vertexShader from "@/three/melt/meltBlob.vert.glsl?raw"
import { writeClip } from "@/three/melt/meltClip"
import noiseShader from "@/three/melt/meltNoise.glsl?raw"
import { paletteColor } from "@/three/palette"
import { pointerField } from "@/three/pointerField"

const bands = 16
const rayDirection = new Vector3()
const rayOrigin = new Vector3()
const toCenter = new Vector3()
const center = new Vector3()

export function MeltBlob() {
  const compact = useScrollStore((state) => state.compact)
  const meshRef = useRef<Mesh>(null)
  const geometry = useMemo(() => new IcosahedronGeometry(1, compact ? 40 : 64), [compact])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uAmplitude: { value: 0.05 },
          uPress: { value: new Vector3(0, 0, 1) },
          uPressAmount: { value: 0 },
          uHeat: { value: 0 },
          uBands: { value: bands },
          uClip: { value: new Vector2(99999, -1) },
          uRampA: { value: paletteColor("cap-red") },
          uRampB: { value: paletteColor("nozzle") },
          uRampC: { value: paletteColor("cap-red").clone().lerp(paletteColor("bone"), 0.55) },
          uRampD: { value: paletteColor("sand").clone().lerp(paletteColor("sun"), 0.25) },
          uRampE: { value: paletteColor("bone") },
          uRimA: { value: paletteColor("cap-blue") },
          uRimB: { value: paletteColor("bottle-green") },
          uHot: { value: paletteColor("cap-red") },
        },
        vertexShader: `${noiseShader}\n${vertexShader}`,
        fragmentShader: `${noiseShader}\n${fragmentShader}`,
        toneMapped: false,
      }),
    [],
  )

  useFrame((state, delta) => {
    const mesh = meshRef.current

    if (!mesh) {
      return
    }

    mesh.visible = meltDirective.visible

    if (!meltDirective.visible) {
      return
    }

    const { size, viewport } = state
    const uniforms = material.uniforms
    const reduced = useScrollStore.getState().reducedMotion
    const radius = meltDirective.radius
    const clip = uniforms.uClip?.value as Vector2
    const press = uniforms.uPress?.value as Vector3
    const pressAmount = uniforms.uPressAmount
    const heat = uniforms.uHeat
    const time = uniforms.uTime
    const amplitude = uniforms.uAmplitude

    if (!pressAmount || !heat || !time || !amplitude) {
      return
    }

    mesh.position.set(meltDirective.x, meltDirective.y, 0)
    mesh.scale.setScalar(radius)
    writeClip(clip, size.height, viewport.dpr)

    if (!reduced) {
      time.value = state.clock.elapsedTime
    }

    amplitude.value = meltDirective.amplitude

    const tangent = Math.tan(((cameraFov / 2) * Math.PI) / 180)
    const aspect = size.width / size.height
    const ndcX = (pointerField.x / size.width) * 2 - 1
    const ndcY = 1 - (pointerField.y / size.height) * 2

    rayOrigin.set(0, 0, cameraDistance)
    rayDirection.set(ndcX * tangent * aspect, ndcY * tangent, -1).normalize()
    center.set(meltDirective.x, meltDirective.y, 0)
    toCenter.copy(center).sub(rayOrigin)

    const along = toCenter.dot(rayDirection)
    const distanceSquared = toCenter.lengthSq() - along * along
    const hit = pointerField.presence > 0 && !reduced && distanceSquared < radius * radius

    if (hit) {
      const inner = Math.sqrt(radius * radius - distanceSquared)

      rayOrigin.addScaledVector(rayDirection, along - inner).sub(center).divideScalar(radius)
      press.lerp(rayOrigin, 1 - Math.exp(-14 * delta)).normalize()
    }

    const moving = Math.min(1, Math.hypot(pointerField.velocityX, pointerField.velocityY) / 900)

    pressAmount.value = MathUtils.damp(pressAmount.value, hit ? 0.75 + moving * 0.5 : 0, 7, delta)
    heat.value = MathUtils.damp(heat.value, hit ? 1 : 0, 6, delta)
  })

  return <mesh ref={meshRef} geometry={geometry} material={material} frustumCulled={false} visible={false} />
}

