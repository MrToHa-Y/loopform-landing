import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import { CanvasTexture, DoubleSide, MathUtils, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace } from "three"
import type { Group } from "three"
import type { ColorToken } from "@/content/types"
import { useScrollStore } from "@/state/scrollStore"
import { shardDirective } from "@/three/directives"
import { paletteColor } from "@/three/palette"
import { createRandom } from "@/three/random"

const shardCount = 8
const stripes: ColorToken[] = ["cap-red", "bone", "cap-blue", "sun", "bottle-green"]

function createStripeTexture(seed: number) {
  const random = createRandom(seed)
  const canvas = document.createElement("canvas")

  canvas.width = 256
  canvas.height = 96

  const context = canvas.getContext("2d")

  if (context) {
    let x = 0

    while (x < canvas.width) {
      const width = 18 + random() * 60
      const token = stripes[Math.floor(random() * stripes.length)] ?? "bone"

      context.fillStyle = `#${paletteColor(token).getHexString()}`
      context.fillRect(x, 0, width, canvas.height)
      x += width
    }
  }

  const texture = new CanvasTexture(canvas)

  texture.colorSpace = SRGBColorSpace

  return texture
}

function createShardGeometry(seed: number) {
  const geometry = new PlaneGeometry(0.5, 0.18, 24, 1)
  const positionAttribute = geometry.getAttribute("position")
  const wave = 5 + seed * 3

  for (let index = 0; index < positionAttribute.count; index += 1) {
    const x = positionAttribute.getX(index)
    positionAttribute.setZ(index, Math.sin(x * wave) * 0.07)
  }

  geometry.computeVertexNormals()

  return geometry
}

export function LabelShards() {
  const groupRef = useRef<Group>(null)
  const compact = useScrollStore((state) => state.compact)

  const shards = useMemo(() => {
    const random = createRandom(31)

    return Array.from({ length: shardCount }, (_, index) => {
      const depth = -2.4 + random() * 4.2

      return {
        geometry: createShardGeometry(random()),
        material: new MeshStandardMaterial({
          map: createStripeTexture(100 + index),
          side: DoubleSide,
          roughness: 0.8,
          transparent: true,
          opacity: 0,
        }),
        x: (random() * 2 - 1) * 3.6,
        y: (random() * 2 - 1) * 2.2,
        z: depth,
        fade: depth < -1 ? 0.55 : 1,
        speed: 0.12 + random() * 0.2,
        phase: random() * 6.28,
      }
    })
  }, [])

  useFrame((state, delta) => {
    const group = groupRef.current

    if (!group) {
      return
    }

    const { reducedMotion } = useScrollStore.getState()
    const time = reducedMotion ? 0 : state.clock.elapsedTime
    const opacity = shardDirective.opacity

    group.visible = opacity > 0.01

    group.children.forEach((child, index) => {
      const shard = shards[index]

      if (!shard) {
        return
      }

      child.position.set(
        shardDirective.center.x * 0.35 + shard.x + Math.sin(time * shard.speed + shard.phase) * 0.3,
        shard.y + Math.cos(time * shard.speed * 0.8 + shard.phase) * 0.25,
        shard.z,
      )
      child.rotation.set(time * shard.speed, time * shard.speed * 0.6 + shard.phase, shard.phase)
      shard.material.opacity = MathUtils.damp(shard.material.opacity, opacity * shard.fade, 6, delta)
    })
  })

  return (
    <group ref={groupRef} visible={false} scale={compact ? 0.7 : 1}>
      {shards.map((shard, index) => (
        <mesh key={index} geometry={shard.geometry} material={shard.material} />
      ))}
    </group>
  )
}
