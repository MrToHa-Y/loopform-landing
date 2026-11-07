import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import { Euler, Matrix4, Quaternion, Vector3 } from "three"
import type { Group, InstancedMesh } from "three"
import type { ColorToken } from "@/content/types"
import { useScrollStore } from "@/state/scrollStore"
import { readAnchor } from "@/three/anchors"
import { processDirective } from "@/three/directives"
import { createCapGeometry } from "@/three/models/proceduralCap"
import { paletteColor } from "@/three/palette"
import { createRandom } from "@/three/random"

const heapCaps = 170
const fallingCaps = 26
const capScale = 0.021
const heapWidth = 0.46
const heapHeight = 0.3
const floorOffset = 0.42
const fallTop = 0.82
const fitWidth = 0.92
const pileTokens: ColorToken[] = ["cap-red", "bottle-green", "cap-blue", "bone", "cap-red", "cap-blue", "bone", "sun"]

const matrix = new Matrix4()
const position = new Vector3()
const quaternion = new Quaternion()
const euler = new Euler()
const scale = new Vector3()

export function ProcessIllustrations() {
  const size = useThree((state) => state.size)
  const rootRef = useRef<Group>(null)
  const capsRef = useRef<InstancedMesh>(null)
  const capGeometry = useMemo(createCapGeometry, [])

  const seeds = useMemo(() => {
    const random = createRandom(53)

    return Array.from({ length: fallingCaps }, () => ({ a: random(), b: random(), c: random() }))
  }, [])

  useEffect(() => {
    const caps = capsRef.current

    if (!caps) {
      return
    }

    const random = createRandom(61)

    for (let index = 0; index < heapCaps + fallingCaps; index += 1) {
      caps.setColorAt(index, paletteColor(pileTokens[Math.floor(random() * pileTokens.length)] ?? "bone"))
    }

    for (let index = 0; index < heapCaps; index += 1) {
      const reach = Math.sqrt(random())
      const angle = random() * Math.PI * 2
      const surface = random() ** 0.35

      position.set(
        Math.cos(angle) * reach * heapWidth,
        (1 - reach * reach) * heapHeight * surface,
        Math.sin(angle) * reach * heapWidth * 0.5,
      )
      euler.set((random() - 0.5) * 2.4, random() * 6.28, (random() - 0.5) * 2.4)
      quaternion.setFromEuler(euler)
      scale.setScalar(capScale)
      caps.setMatrixAt(index, matrix.compose(position, quaternion, scale))
    }

    caps.frustumCulled = false
  }, [])

  useFrame((state) => {
    const root = rootRef.current
    const caps = capsRef.current

    if (!root || !caps) {
      return
    }

    root.visible = processDirective.visible

    if (!processDirective.visible) {
      return
    }

    const { reducedMotion } = useScrollStore.getState()
    const time = reducedMotion ? 2.4 : state.clock.elapsedTime
    const frame = readAnchor("process-caps", size.width, size.height)

    root.visible = frame !== null

    if (!frame) {
      return
    }

    root.position.set(frame.x, frame.y - frame.height * floorOffset, 0)
    root.scale.setScalar(Math.min(frame.height, frame.width * fitWidth))

    for (let index = 0; index < fallingCaps; index += 1) {
      const seed = seeds[index]

      if (!seed) {
        continue
      }

      const phase = (time * (0.16 + seed.a * 0.14) + seed.b) % 1

      position.set((seed.c - 0.5) * heapWidth * 0.9, (1 - phase * phase) * fallTop + heapHeight * 0.4, (seed.a - 0.5) * 0.1)
      euler.set(time * (seed.a + 0.4), time * seed.b, seed.c * 6.28)
      quaternion.setFromEuler(euler)
      scale.setScalar(capScale)
      caps.setMatrixAt(heapCaps + index, matrix.compose(position, quaternion, scale))
    }

    caps.instanceMatrix.needsUpdate = true
  })

  return (
    <group ref={rootRef} visible={false}>
      <instancedMesh ref={capsRef} args={[capGeometry, undefined, heapCaps + fallingCaps]}>
        <meshStandardMaterial roughness={0.55} />
      </instancedMesh>
    </group>
  )
}
