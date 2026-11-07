import { useFrame, useThree } from "@react-three/fiber"
import qrcode from "qrcode-generator"
import { useEffect, useMemo, useRef } from "react"
import { CanvasTexture, Euler, Matrix4, NearestFilter, Quaternion, SRGBColorSpace, Vector3 } from "three"
import type { Group, InstancedMesh, Mesh } from "three"
import type { ColorToken } from "@/content/types"
import { ru } from "@/content/ru"
import { useScrollStore } from "@/state/scrollStore"
import { readAnchor } from "@/three/anchors"
import { processDirective } from "@/three/directives"
import { createCapGeometry, createFlakeGeometry } from "@/three/models/proceduralCap"
import { paletteColor } from "@/three/palette"
import { createRandom } from "@/three/random"

const fallingCaps = 34
const sortedCaps = 52
const swirlingFlakes = 90
const pileTokens: ColorToken[] = ["cap-red", "bottle-green", "cap-blue", "sun"]

function createQrTexture() {
  const code = qrcode(0, "M")

  code.addData(`https://t.me/${ru.configurator.telegramBot}?start=passport`)
  code.make()

  const count = code.getModuleCount()
  const cell = 8
  const margin = 2
  const canvas = document.createElement("canvas")

  canvas.width = (count + margin * 2) * cell
  canvas.height = canvas.width

  const context = canvas.getContext("2d")

  if (context) {
    context.fillStyle = `#${paletteColor("bone").getHexString()}`
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = `#${paletteColor("graphite").getHexString()}`

    for (let row = 0; row < count; row += 1) {
      for (let column = 0; column < count; column += 1) {
        if (code.isDark(row, column)) {
          context.fillRect((column + margin) * cell, (row + margin) * cell, cell, cell)
        }
      }
    }
  }

  const texture = new CanvasTexture(canvas)

  texture.magFilter = NearestFilter
  texture.colorSpace = SRGBColorSpace

  return texture
}

const matrix = new Matrix4()
const position = new Vector3()
const quaternion = new Quaternion()
const euler = new Euler()
const scale = new Vector3()

export function ProcessIllustrations() {
  const size = useThree((state) => state.size)
  const rootRef = useRef<Group>(null)
  const capsRef = useRef<InstancedMesh>(null)
  const flakesRef = useRef<InstancedMesh>(null)
  const boxRef = useRef<Group>(null)
  const qrRef = useRef<Mesh>(null)
  const capGeometry = useMemo(createCapGeometry, [])
  const flakeGeometry = useMemo(createFlakeGeometry, [])
  const qrTexture = useMemo(createQrTexture, [])

  const seeds = useMemo(() => {
    const random = createRandom(53)
    return Array.from({ length: fallingCaps + sortedCaps + swirlingFlakes }, () => ({
      a: random(),
      b: random(),
      c: random(),
    }))
  }, [])

  useEffect(() => {
    const caps = capsRef.current
    const flakes = flakesRef.current

    if (!caps || !flakes) {
      return
    }

    const random = createRandom(61)

    for (let index = 0; index < fallingCaps + sortedCaps; index += 1) {
      const token =
        index < fallingCaps
          ? (pileTokens[Math.floor(random() * pileTokens.length)] ?? "bone")
          : (pileTokens[(index - fallingCaps) % pileTokens.length] ?? "bone")

      caps.setColorAt(index, paletteColor(token))
    }

    for (let index = 0; index < swirlingFlakes; index += 1) {
      flakes.setColorAt(index, paletteColor(pileTokens[Math.floor(random() * pileTokens.length)] ?? "bone"))
    }

    caps.frustumCulled = false
    flakes.frustumCulled = false
  }, [])

  useFrame((state) => {
    const root = rootRef.current
    const caps = capsRef.current
    const flakes = flakesRef.current
    const box = boxRef.current
    const qr = qrRef.current

    if (!root || !caps || !flakes || !box || !qr) {
      return
    }

    root.visible = processDirective.visible

    if (!processDirective.visible) {
      return
    }

    const { reducedMotion } = useScrollStore.getState()
    const time = reducedMotion ? 2.4 : state.clock.elapsedTime
    const first = readAnchor("process-1", size.width, size.height)
    const second = readAnchor("process-2", size.width, size.height)
    const third = readAnchor("process-3", size.width, size.height)
    const fifth = readAnchor("process-5", size.width, size.height)

    if (first) {
      const width = Math.min(first.width, first.height) * 0.72
      const floor = first.y - first.height * 0.36

      box.position.set(first.x, floor, 0)
      box.scale.setScalar(width)

      for (let index = 0; index < fallingCaps; index += 1) {
        const seed = seeds[index]

        if (!seed) {
          continue
        }

        const phase = (time * (0.2 + seed.a * 0.18) + seed.b) % 1
        const height = (1 - phase * phase) * first.height * 0.78
        const spread = (seed.c - 0.5) * width * 0.7

        position.set(first.x + spread, floor + height + width * 0.04, (seed.a - 0.5) * width * 0.4)
        euler.set(time * (seed.a + 0.4), time * seed.b, seed.c * 6.28)
        quaternion.setFromEuler(euler)
        scale.setScalar(0.03 + seed.b * 0.03)
        caps.setMatrixAt(index, matrix.compose(position, quaternion, scale))
      }
    }

    if (second) {
      const spacing = Math.min(second.width, second.height * 1.6) / 4.3
      const floor = second.y - second.height * 0.3

      for (let index = 0; index < sortedCaps; index += 1) {
        const seed = seeds[fallingCaps + index]

        if (!seed) {
          continue
        }

        const pile = index % pileTokens.length
        const level = Math.floor(index / pileTokens.length)
        const ring = level % 4
        const height = Math.floor(level / 4)

        position.set(
          second.x + (pile - 1.5) * spacing + Math.cos(ring * 1.57 + seed.a) * 0.16,
          floor + height * 0.13 + Math.sin(time * 0.8 + seed.c * 6.28) * 0.008,
          Math.sin(ring * 1.57 + seed.a) * 0.16,
        )
        euler.set(0.5 + seed.a * 0.5, seed.b * 6.28, seed.c * 0.8)
        quaternion.setFromEuler(euler)
        scale.setScalar(0.1)
        caps.setMatrixAt(fallingCaps + index, matrix.compose(position, quaternion, scale))
      }
    } else {
      scale.setScalar(0)

      for (let index = 0; index < sortedCaps; index += 1) {
        caps.setMatrixAt(fallingCaps + index, matrix.compose(position, quaternion, scale))
      }
    }

    caps.instanceMatrix.needsUpdate = true
    flakes.visible = third !== null

    if (third) {
      const radius = Math.min(third.width, third.height) * 0.4

      for (let index = 0; index < swirlingFlakes; index += 1) {
        const seed = seeds[fallingCaps + sortedCaps + index]

        if (!seed) {
          continue
        }

        const angle = seed.a * 6.28 + time * (0.3 + seed.b * 0.5)
        const distance = radius * (0.3 + seed.c * 0.7)

        position.set(
          third.x + Math.cos(angle) * distance,
          third.y + Math.sin(angle * 1.3 + seed.b * 3) * radius * 0.8,
          Math.sin(angle) * distance * 0.6,
        )
        euler.set(time * seed.a * 2, time * seed.b * 2, seed.c * 6.28)
        quaternion.setFromEuler(euler)
        scale.setScalar(0.03 + seed.c * 0.035)
        flakes.setMatrixAt(index, matrix.compose(position, quaternion, scale))
      }

      flakes.instanceMatrix.needsUpdate = true
    }

    if (fifth) {
      const side = fifth.height * 0.24

      qr.position.set(fifth.x + fifth.width * 0.32, fifth.y - fifth.height * 0.2, 0.5)
      qr.scale.setScalar(side)
      qr.rotation.set(0, -0.28, 0.06)
    }
  })

  return (
    <group ref={rootRef} visible={false}>
      <instancedMesh ref={capsRef} args={[capGeometry, undefined, fallingCaps + sortedCaps]}>
        <meshStandardMaterial roughness={0.55} />
      </instancedMesh>
      <instancedMesh ref={flakesRef} args={[flakeGeometry, undefined, swirlingFlakes]}>
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
      <group ref={boxRef}>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[1, 0.04, 0.62]} />
          <meshStandardMaterial color={paletteColor("graphite")} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.13, 0.31]}>
          <boxGeometry args={[1, 0.26, 0.03]} />
          <meshStandardMaterial color={paletteColor("graphite")} roughness={0.7} />
        </mesh>
        <mesh position={[-0.5, 0.13, 0]}>
          <boxGeometry args={[0.03, 0.26, 0.62]} />
          <meshStandardMaterial color={paletteColor("graphite")} roughness={0.7} />
        </mesh>
        <mesh position={[0.5, 0.13, 0]}>
          <boxGeometry args={[0.03, 0.26, 0.62]} />
          <meshStandardMaterial color={paletteColor("graphite")} roughness={0.7} />
        </mesh>
      </group>
      <mesh ref={qrRef}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={qrTexture} toneMapped={false} />
      </mesh>
    </group>
  )
}
