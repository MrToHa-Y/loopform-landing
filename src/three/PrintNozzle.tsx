import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import { AdditiveBlending, BufferAttribute, BufferGeometry } from "three"
import type { Group, Points } from "three"
import { nozzleDirective } from "@/three/directives"
import { paletteColor } from "@/three/palette"
import { createRandom } from "@/three/random"

const sparkCount = 32

export function PrintNozzle() {
  const groupRef = useRef<Group>(null)
  const pointsRef = useRef<Points>(null)

  const { geometry, seeds } = useMemo(() => {
    const random = createRandom(41)
    const buffer = new BufferGeometry()

    buffer.setAttribute("position", new BufferAttribute(new Float32Array(sparkCount * 3), 3))

    return {
      geometry: buffer,
      seeds: Array.from({ length: sparkCount }, () => ({ phase: random() * 6.28, speed: 1.4 + random() * 2.6, rise: random() })),
    }
  }, [])

  useFrame((state) => {
    const group = groupRef.current
    const points = pointsRef.current

    if (!group || !points) {
      return
    }

    group.visible = nozzleDirective.active

    if (!nozzleDirective.active) {
      return
    }

    const time = state.clock.elapsedTime
    const { position, width } = nozzleDirective
    const attribute = geometry.getAttribute("position") as BufferAttribute

    group.position.copy(position)

    seeds.forEach((seed, index) => {
      const sweep = Math.sin(time * seed.speed + seed.phase) * width * 0.5
      const lift = ((time * 0.8 + seed.rise) % 1) * 0.12

      attribute.setXYZ(index, sweep, lift, Math.cos(time * seed.speed + seed.phase) * width * 0.2)
    })

    attribute.needsUpdate = true
  })

  return (
    <group ref={groupRef} visible={false}>
      <mesh>
        <circleGeometry args={[0.035, 24]} />
        <meshBasicMaterial color={paletteColor("nozzle")} toneMapped={false} transparent opacity={0.95} />
      </mesh>
      <points ref={pointsRef} geometry={geometry}>
        <pointsMaterial
          color={paletteColor("nozzle")}
          size={0.035}
          transparent
          opacity={0.9}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </points>
    </group>
  )
}
