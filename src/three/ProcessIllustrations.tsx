import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import { Euler, Matrix4, MeshStandardMaterial, Quaternion, Vector3, Vector4 } from "three"
import type { Group, IUniform, InstancedMesh } from "three"
import { capPileCounts } from "@/animation/tokens"
import type { ColorToken } from "@/content/types"
import { useScrollStore } from "@/state/scrollStore"
import { readAnchor, worldHeight } from "@/three/anchors"
import { processDirective } from "@/three/directives"
import { createCapGeometry } from "@/three/models/proceduralCap"
import { paletteColor } from "@/three/palette"
import { pointerField } from "@/three/pointerField"
import { capRadius, createCapPile } from "@/three/process/capPile"
import type { PilePointer } from "@/three/process/capPile"
import capClipFragment from "@/three/process/capClip.glsl?raw"
import capClipPars from "@/three/process/capClipPars.glsl?raw"
import { createRandom } from "@/three/random"

const depthSpread = 0.09
const maxDelta = 1 / 30
const visualScale = 0.94
const pileTokens: ColorToken[] = ["cap-red", "bottle-green", "cap-blue", "bone", "cap-red", "cap-blue", "bone", "sun"]

const matrix = new Matrix4()
const position = new Vector3()
const quaternion = new Quaternion()
const euler = new Euler()
const scale = new Vector3()
const pointer: PilePointer = { x: 0, y: 0, velocityX: 0, velocityY: 0 }

let frameRadius: number | null = null

function readFrameRadius() {
  if (frameRadius === null) {
    const element = document.querySelector("[data-anchor='process-caps']")?.parentElement

    frameRadius = element ? Number.parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0 : 0
  }

  return frameRadius
}

function createCapMaterial(frame: IUniform<Vector4>, radius: IUniform<number>) {
  const material = new MeshStandardMaterial({ roughness: 0.55 })

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uFrame = frame
    shader.uniforms.uFrameRadius = radius
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${capClipPars}`)
      .replace("#include <clipping_planes_fragment>", `#include <clipping_planes_fragment>\n${capClipFragment}`)
  }

  material.customProgramCacheKey = () => "cap-clip"

  return material
}

export function ProcessIllustrations() {
  const size = useThree((state) => state.size)
  const rootRef = useRef<Group>(null)
  const capsRef = useRef<InstancedMesh>(null)
  const settled = useRef(false)
  const refill = useRef(processDirective.refill)
  const capGeometry = useMemo(createCapGeometry, [])
  const capacity = capPileCounts.desktop
  const pile = useMemo(() => createCapPile(capacity, createRandom(71)), [capacity])
  const frameUniform = useMemo<IUniform<Vector4>>(() => ({ value: new Vector4(0, 0, 0, 0) }), [])
  const radiusUniform = useMemo<IUniform<number>>(() => ({ value: 0 }), [])
  const material = useMemo(() => createCapMaterial(frameUniform, radiusUniform), [frameUniform, radiusUniform])

  const looks = useMemo(() => {
    const random = createRandom(53)

    return Array.from({ length: capacity }, () => ({
      faceX: Math.PI / 2 + (random() - 0.5) * 0.8,
      faceY: (random() - 0.5) * 0.8,
      depth: (random() - 0.5) * depthSpread * 2,
    }))
  }, [capacity])

  useEffect(() => {
    const caps = capsRef.current

    if (!caps) {
      return
    }

    const random = createRandom(61)

    for (let index = 0; index < capacity; index += 1) {
      caps.setColorAt(index, paletteColor(pileTokens[Math.floor(random() * pileTokens.length)] ?? "bone"))
    }

    caps.frustumCulled = false
  }, [capacity])

  useEffect(() => () => material.dispose(), [material])

  useFrame((state, delta) => {
    const root = rootRef.current
    const caps = capsRef.current

    if (!root || !caps) {
      return
    }

    root.visible = processDirective.visible

    if (!processDirective.visible) {
      return
    }

    const frame = readAnchor("process-caps", size.width, size.height)

    root.visible = frame !== null

    if (!frame) {
      return
    }

    const pixelsPerUnit = size.height / worldHeight
    const widthPixels = frame.width * pixelsPerUnit
    const heightPixels = frame.bottom - frame.top
    const centerX = size.width / 2 + frame.x * pixelsPerUnit
    const unit = frame.height
    const unitPixels = unit * pixelsPerUnit
    const { compact, reducedMotion } = useScrollStore.getState()
    const { dpr } = state.viewport

    if (centerX + widthPixels / 2 < 0 || centerX - widthPixels / 2 > size.width) {
      root.visible = false
      return
    }

    pile.resize(frame.width / unit, frame.height / unit, compact ? capPileCounts.mobile : capPileCounts.desktop)
    root.position.set(frame.x, frame.y - frame.height / 2, 0)
    root.scale.setScalar(unit)
    frameUniform.value.set(centerX * dpr, (size.height - (frame.top + frame.bottom) / 2) * dpr, (widthPixels / 2) * dpr, (heightPixels / 2) * dpr)
    radiusUniform.value = readFrameRadius() * dpr

    if (reducedMotion) {
      if (!settled.current) {
        pile.settle()
        settled.current = true
      }
    } else {
      const inside =
        pointerField.presence > 0 &&
        Math.abs(pointerField.x - centerX) < widthPixels / 2 &&
        pointerField.y > frame.top &&
        pointerField.y < frame.bottom

      if (inside) {
        pointer.x = (pointerField.x - centerX) / unitPixels
        pointer.y = (frame.bottom - pointerField.y) / unitPixels
        pointer.velocityX = pointerField.velocityX / unitPixels
        pointer.velocityY = -pointerField.velocityY / unitPixels
      }

      if (refill.current !== processDirective.refill) {
        refill.current = processDirective.refill
        pile.restart()
      }

      pile.step(Math.min(delta, maxDelta), inside ? pointer : null, processDirective.pouring)
    }

    for (let index = 0; index < capacity; index += 1) {
      const look = looks[index]

      if (!look || !pile.alive[index]) {
        scale.setScalar(0)
        caps.setMatrixAt(index, matrix.compose(position.set(0, -9, 0), quaternion, scale))
        continue
      }

      position.set(pile.x[index] ?? 0, pile.y[index] ?? 0, look.depth)
      euler.set(look.faceX + (pile.tumble[index] ?? 0), look.faceY, pile.spin[index] ?? 0)
      quaternion.setFromEuler(euler)
      scale.setScalar(capRadius * visualScale)
      caps.setMatrixAt(index, matrix.compose(position, quaternion, scale))
    }

    caps.instanceMatrix.needsUpdate = true
  })

  return (
    <group ref={rootRef} visible={false}>
      <instancedMesh ref={capsRef} args={[capGeometry, material, capacity]} />
    </group>
  )
}
