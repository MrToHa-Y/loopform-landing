import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import { DoubleSide, RingGeometry, ShaderMaterial, Vector2 } from "three"
import type { Group } from "three"
import { meltDirective } from "@/three/directives"
import vertexShader from "@/three/melt/meltCard.vert.glsl?raw"
import { writeClip } from "@/three/melt/meltClip"
import fragmentShader from "@/three/melt/meltRing.frag.glsl?raw"
import { paletteColor } from "@/three/palette"

const ringScales = [1.22, 1.42]

export function MeltRings() {
  const groupRef = useRef<Group>(null)
  const geometry = useMemo(() => new RingGeometry(0.9985, 1.0015, 192, 1), [])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uColor: { value: paletteColor("bone") },
          uOpacity: { value: 0.28 },
          uClip: { value: new Vector2(99999, -1) },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        toneMapped: false,
      }),
    [],
  )

  useFrame((state) => {
    const group = groupRef.current
    const clip = material.uniforms.uClip?.value as Vector2 | undefined
    const opacity = material.uniforms.uOpacity

    if (!group || !clip || !opacity) {
      return
    }

    group.visible = meltDirective.visible

    if (!meltDirective.visible) {
      return
    }

    group.position.set(meltDirective.x, meltDirective.y, -0.6)
    group.rotation.z = state.clock.elapsedTime * 0.05
    group.scale.setScalar(meltDirective.radius)
    opacity.value = 0.28 * (1 - Math.min(1, meltDirective.flow * 1.6))
    writeClip(clip, state.size.height, state.viewport.dpr)
  })

  return (
    <group ref={groupRef} visible={false}>
      {ringScales.map((scale) => (
        <mesh key={scale} geometry={geometry} material={material} scale={scale} />
      ))}
    </group>
  )
}
