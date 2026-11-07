import { Vector3 } from "three"
import type { Matrix4 } from "three"
import { createRandom } from "@/three/random"

export type ParticleStateName = "cloud" | "intake" | "fall" | "heap" | "silhouette" | "morph" | "hidden"

export const morphTiming = {
  releaseStart: 0.02,
  releaseSpan: 0.5,
  flight: 0.3,
  coverStart: 0.42,
  coverSpan: 0.56,
} as const

export interface SurfacePair {
  from: Vector3
  to: Vector3
  rank: number
}

export interface Particle {
  scale: number
  delay: number
  seedA: number
  seedB: number
  orbitSpeed: number
  cloudRadius: number
  cloudAngle: number
  cloudHeight: number
  cloudDepth: number
  heapX: number
  heapHeight: number
  heapDepth: number
  skyOffset: number
  surface: Vector3
  surfaceTo: Vector3
  morphDelay: number
  morphCover: number
  spinX: number
  spinY: number
  spinZ: number
  offsetX: number
  offsetY: number
  velocityX: number
  velocityY: number
}

export interface ParticleContext {
  time: number
  delta: number
  worldWidth: number
  worldHeight: number
  center: Vector3
  nozzle: Vector3
  silhouetteCenter: Vector3
  silhouetteScale: number
  silhouetteRotation: number
  morph: number
  morphFrom: Matrix4
  morphTo: Matrix4
  morphAxis: number
  pointer: Vector3
  pointerVelocity: Vector3
  pointerPresence: number
  pointerPulse: number
  pointerRadius: number
  radiusScale: number
}

export function createParticles(count: number, scaleMin: number, scaleMax: number, pairs: SurfacePair[], seed: number) {
  const random = createRandom(seed)
  const particles: Particle[] = []

  for (let index = 0; index < count; index += 1) {
    const heapX = random() * 2 - 1
    const pair = pairs[index % Math.max(pairs.length, 1)]
    const rank = pair?.rank ?? 0

    particles.push({
      scale: scaleMin + random() * (scaleMax - scaleMin),
      delay: random(),
      seedA: random(),
      seedB: random(),
      orbitSpeed: 0.04 + random() * 0.09,
      cloudRadius: 1.2 + random() * 1.4,
      cloudAngle: random() * Math.PI * 2,
      cloudHeight: (random() * 2 - 1) * 2.1,
      cloudDepth: (random() * 2 - 1) * 1.6,
      heapX,
      heapHeight: random() * random() * (1 - Math.abs(heapX) * 0.7),
      heapDepth: (random() * 2 - 1) * 0.5,
      skyOffset: random() * 3,
      surface: pair?.from ?? new Vector3(),
      surfaceTo: pair?.to ?? new Vector3(),
      morphDelay: morphTiming.releaseStart + rank * morphTiming.releaseSpan,
      morphCover: morphTiming.coverStart + rank * morphTiming.coverSpan + 0.02,
      spinX: (random() * 2 - 1) * 1.2,
      spinY: (random() * 2 - 1) * 1.2,
      spinZ: (random() * 2 - 1) * 1.2,
      offsetX: 0,
      offsetY: 0,
      velocityX: 0,
      velocityY: 0,
    })
  }

  return particles
}

const scratch = new Vector3()

export function sampleState(state: ParticleStateName, particle: Particle, context: ParticleContext, out: Vector3) {
  switch (state) {
    case "cloud": {
      const angle = particle.cloudAngle + context.time * particle.orbitSpeed
      const radius = particle.cloudRadius * context.radiusScale
      const bob = Math.sin(context.time * 0.5 + particle.seedA * 6.28) * 0.14

      out.set(
        context.center.x + Math.cos(angle) * radius,
        context.center.y + particle.cloudHeight * context.radiusScale + bob,
        Math.sin(angle) * radius * 0.7 + particle.cloudDepth,
      )

      return 1
    }
    case "intake":
      out.copy(context.nozzle)
      return 0
    case "fall":
      out.set(
        particle.heapX * context.worldWidth * 0.48,
        context.worldHeight / 2 + 0.5 + particle.skyOffset,
        particle.heapDepth,
      )
      return 1
    case "heap":
      out.set(
        particle.heapX * context.worldWidth * 0.48,
        -context.worldHeight / 2 + 0.06 + particle.heapHeight * context.worldHeight * 0.17,
        particle.heapDepth,
      )
      return 1
    case "silhouette": {
      const cos = Math.cos(context.silhouetteRotation)
      const sin = Math.sin(context.silhouetteRotation)
      const x = particle.surface.x * context.silhouetteScale
      const y = particle.surface.y * context.silhouetteScale
      const z = particle.surface.z * context.silhouetteScale

      out.set(
        context.silhouetteCenter.x + x * cos + z * sin,
        context.silhouetteCenter.y + y,
        context.silhouetteCenter.z - x * sin + z * cos,
      )
      return 0.62
    }
    case "morph": {
      const local = Math.min(1, Math.max(0, (context.morph - particle.morphDelay) / morphTiming.flight))

      out.copy(particle.surface).applyMatrix4(context.morphFrom)

      if (local <= 0) {
        return 0
      }

      const eased = local * local * (3 - 2 * local)
      const bend = Math.sin(eased * Math.PI)
      const neck = bend * bend * 0.86

      scratch.copy(particle.surfaceTo).applyMatrix4(context.morphTo)
      out.lerp(scratch, eased)
      out.x += (context.morphAxis + Math.sin(local * 9 + particle.seedA * 6.28) * 0.05 - out.x) * neck
      out.z *= 1 - neck * 0.8

      const appear = Math.min(1, local * 7)
      const covered = context.morph > particle.morphCover ? 0 : 1

      return appear * covered * 0.82
    }
    case "hidden":
      return 0
    default:
      return 0
  }
}

const flow = {
  repel: 30,
  drag: 7,
  spring: 9,
  damping: 3.6,
  pulse: 5,
} as const

export function applyPointerFlow(particle: Particle, context: ParticleContext, out: Vector3) {
  const delta = Math.min(context.delta, 1 / 30)
  const x = out.x + particle.offsetX - context.pointer.x
  const y = out.y + particle.offsetY - context.pointer.y
  const distance = Math.hypot(x, y)

  if (context.pointerPresence > 0 && distance < context.pointerRadius && distance > 0.0001) {
    const falloff = 1 - distance / context.pointerRadius
    const push = falloff * falloff * flow.repel * delta + context.pointerPulse * falloff * flow.pulse

    particle.velocityX += (x / distance) * push + context.pointerVelocity.x * falloff * flow.drag * delta
    particle.velocityY += (y / distance) * push + context.pointerVelocity.y * falloff * flow.drag * delta
  }

  particle.velocityX -= particle.offsetX * flow.spring * delta
  particle.velocityY -= particle.offsetY * flow.spring * delta

  const damping = Math.exp(-flow.damping * delta)

  particle.velocityX *= damping
  particle.velocityY *= damping
  particle.offsetX += particle.velocityX * delta
  particle.offsetY += particle.velocityY * delta

  out.x += particle.offsetX
  out.y += particle.offsetY
}

export function stagger(amount: number, delay: number, spread: number) {
  const value = amount * (1 + spread) - delay * spread
  const clamped = Math.min(1, Math.max(0, value))

  return clamped * clamped * (3 - 2 * clamped)
}
