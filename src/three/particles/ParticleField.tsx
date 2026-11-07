import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import { Color, Euler, InstancedMesh, MathUtils, Matrix4, Mesh, Quaternion, Vector3 } from "three"
import type { BufferGeometry } from "three"
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js"
import { durations, particleCounts } from "@/animation/tokens"
import { ru } from "@/content/ru"
import type { ColorToken } from "@/content/types"
import { collectionRig, useScrollStore } from "@/state/scrollStore"
import { pixelsToWorld, worldHeight } from "@/three/anchors"
import { particleDirective } from "@/three/directives"
import type { ParticleLayer } from "@/three/directives"
import { getModelParts } from "@/three/models/modelLibrary"
import { createCapGeometry, createFlakeGeometry } from "@/three/models/proceduralCap"
import { paletteColor } from "@/three/palette"
import { createParticles, sampleState, stagger } from "@/three/particles/particleStates"
import type { Particle, ParticleContext } from "@/three/particles/particleStates"
import { createRandom } from "@/three/random"

const paletteTokens: ColorToken[] = ["cap-red", "bottle-green", "cap-blue", "sun", "sand", "bone"]
const staggerSpread = 0.6

function sampleSurface(count: number) {
  const sampler = new MeshSurfaceSampler(new Mesh(getModelParts("tolqyn").main))

  sampler.build()

  return Array.from({ length: count }, () => {
    const point = new Vector3()
    sampler.sample(point)
    return point
  })
}

const matrix = new Matrix4()
const position = new Vector3()
const positionB = new Vector3()
const quaternion = new Quaternion()
const euler = new Euler()
const scaleVector = new Vector3()
const colorScratch = new Color()

function writeLayer(
  mesh: InstancedMesh,
  particles: Particle[],
  layer: ParticleLayer,
  context: ParticleContext,
  spinPhase: number,
) {
  const hiddenBoth = layer.from === "hidden" && layer.to === "hidden"

  mesh.visible = !hiddenBoth

  if (hiddenBoth) {
    return
  }

  particles.forEach((particle, index) => {
    const amount = stagger(Math.min(1, Math.max(0, layer.amount)), particle.delay, staggerSpread)
    let scaleFrom = sampleState(layer.from, particle, context, position)
    let scaleTo = sampleState(layer.to, particle, context, positionB)

    if (layer.from === "hidden") {
      position.copy(positionB)
      scaleFrom = 0
    }

    if (layer.to === "hidden") {
      positionB.copy(position)
      scaleTo = 0
    }

    position.lerp(positionB, amount)

    const scale = particle.scale * MathUtils.lerp(scaleFrom, scaleTo, amount)

    euler.set(
      particle.seedA * 6.28 + spinPhase * particle.spinX,
      particle.seedB * 6.28 + spinPhase * particle.spinY,
      spinPhase * particle.spinZ,
    )
    quaternion.setFromEuler(euler)
    scaleVector.setScalar(Math.max(scale, 0.00001))
    matrix.compose(position, quaternion, scaleVector)
    mesh.setMatrixAt(index, matrix)
  })

  mesh.instanceMatrix.needsUpdate = true
}

interface ColorState {
  from: Color[]
  to: Color[]
  mix: number
  key: string
}

function createColorState(count: number): ColorState {
  return {
    from: Array.from({ length: count }, () => new Color()),
    to: Array.from({ length: count }, () => new Color()),
    mix: 1,
    key: "",
  }
}

function retarget(state: ColorState, mesh: InstancedMesh, token: ColorToken, palette: boolean, key: string) {
  state.key = key
  state.mix = 0

  const random = createRandom(7)

  state.to.forEach((target, index) => {
    const from = state.from[index]

    if (from) {
      mesh.getColorAt(index, from)
    }

    const pick = paletteTokens[Math.floor(random() * paletteTokens.length)] ?? "bone"
    const useModel = !palette && random() < 0.62

    target.copy(paletteColor(useModel ? token : pick))
  })
}

function advanceColors(state: ColorState, mesh: InstancedMesh, delta: number) {
  if (state.mix >= 1) {
    return
  }

  state.mix = Math.min(1, state.mix + delta / durations.base)

  state.to.forEach((target, index) => {
    const from = state.from[index]

    if (from) {
      mesh.setColorAt(index, colorScratch.lerpColors(from, target, state.mix))
    }
  })

  if (mesh.instanceColor) {
    mesh.instanceColor.needsUpdate = true
  }
}

export function ParticleField() {
  const compact = useScrollStore((state) => state.compact)
  const pointerWorld = useRef(new Vector3(100, 100, 0))
  const capsRef = useRef<InstancedMesh>(null)
  const flakesRef = useRef<InstancedMesh>(null)
  const spinPhase = useRef(0)
  const size = useThree((state) => state.size)

  const capCount = compact ? particleCounts.capsMobile : particleCounts.capsDesktop
  const flakeCount = compact ? particleCounts.flakesMobile : particleCounts.flakesDesktop

  const capGeometry = useMemo<BufferGeometry>(createCapGeometry, [])
  const flakeGeometry = useMemo<BufferGeometry>(createFlakeGeometry, [])

  const data = useMemo(() => {
    const surface = sampleSurface(capCount + flakeCount)

    return {
      caps: createParticles(capCount, 0.035, 0.06, surface.slice(0, capCount), 21),
      flakes: createParticles(flakeCount, 0.015, 0.03, surface.slice(capCount), 22),
      capColors: createColorState(capCount),
      flakeColors: createColorState(flakeCount),
    }
  }, [capCount, flakeCount])

  useEffect(() => {
    const caps = capsRef.current
    const flakes = flakesRef.current

    if (!caps || !flakes) {
      return
    }

    const color = paletteColor("cap-red")

    for (let index = 0; index < capCount; index += 1) {
      caps.setColorAt(index, color)
    }

    for (let index = 0; index < flakeCount; index += 1) {
      flakes.setColorAt(index, color)
    }

    caps.frustumCulled = false
    flakes.frustumCulled = false
  }, [capCount, flakeCount])

  useFrame((state, delta) => {
    const caps = capsRef.current
    const flakes = flakesRef.current

    if (!caps || !flakes) {
      return
    }

    const directive = particleDirective
    const { reducedMotion } = useScrollStore.getState()
    const unit = pixelsToWorld(size.height)
    const time = reducedMotion ? 0 : state.clock.elapsedTime

    spinPhase.current += delta * 0.6 * directive.spin
    pointerWorld.current.set((state.pointer.x * size.width * unit) / 2, (state.pointer.y * size.height * unit) / 2, 0)

    const context: ParticleContext = {
      time,
      worldWidth: size.width * unit,
      worldHeight,
      center: directive.center,
      nozzle: directive.nozzle,
      silhouetteCenter: directive.silhouetteCenter,
      silhouetteScale: directive.silhouetteScale,
      silhouetteRotation: directive.silhouetteRotation,
      streamFrom: directive.streamFrom,
      streamTo: directive.streamTo,
      pointer: pointerWorld.current,
      radiusScale: compact ? 0.55 : 1,
    }

    writeLayer(caps, data.caps, directive.caps, context, spinPhase.current)
    writeLayer(flakes, data.flakes, directive.flakes, context, spinPhase.current)

    const index = collectionRig.particleColorIndex
    const token = ru.collection.models[index]?.background ?? "cap-red"
    const key = directive.paletteMode ? "palette" : token

    if (data.capColors.key !== key) {
      retarget(data.capColors, caps, token, directive.paletteMode, key)
      retarget(data.flakeColors, flakes, token, directive.paletteMode, key)
    }

    advanceColors(data.capColors, caps, delta)
    advanceColors(data.flakeColors, flakes, delta)
  })

  return (
    <>
      <instancedMesh key={`caps-${capCount}`} ref={capsRef} args={[capGeometry, undefined, capCount]}>
        <meshStandardMaterial roughness={0.55} metalness={0} />
      </instancedMesh>
      <instancedMesh key={`flakes-${flakeCount}`} ref={flakesRef} args={[flakeGeometry, undefined, flakeCount]}>
        <meshStandardMaterial roughness={0.7} metalness={0} />
      </instancedMesh>
    </>
  )
}
