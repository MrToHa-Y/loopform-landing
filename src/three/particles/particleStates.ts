import { Vector3 } from "three"
import { createRandom } from "@/three/random"

export type ParticleStateName = "cloud" | "intake" | "fall" | "heap" | "silhouette" | "stream" | "hidden"

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
  spinX: number
  spinY: number
  spinZ: number
}

export interface ParticleContext {
  time: number
  worldWidth: number
  worldHeight: number
  center: Vector3
  nozzle: Vector3
  silhouetteCenter: Vector3
  silhouetteScale: number
  silhouetteRotation: number
  streamFrom: Vector3
  streamTo: Vector3
  pointer: Vector3
  radiusScale: number
}

export function createParticles(count: number, scaleMin: number, scaleMax: number, surface: Vector3[], seed: number) {
  const random = createRandom(seed)
  const particles: Particle[] = []

  for (let index = 0; index < count; index += 1) {
    const heapX = random() * 2 - 1

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
      surface: surface[index % Math.max(surface.length, 1)] ?? new Vector3(),
      spinX: (random() * 2 - 1) * 1.2,
      spinY: (random() * 2 - 1) * 1.2,
      spinZ: (random() * 2 - 1) * 1.2,
    })
  }

  return particles
}

const repulsionRadius = 0.8
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

      scratch.copy(out).sub(context.pointer)
      scratch.z = 0

      const distance = scratch.length()

      if (distance < repulsionRadius && distance > 0.0001) {
        const push = (1 - distance / repulsionRadius) ** 2 * 0.55
        out.addScaledVector(scratch.normalize(), push)
      }

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
    case "stream": {
      const phase = (context.time * (0.32 + particle.seedA * 0.26) + particle.seedB) % 1
      const sway = Math.sin(phase * 9 + particle.seedA * 6.28) * 0.07 * (1 - phase)

      out.lerpVectors(context.streamFrom, context.streamTo, phase * phase * 0.6 + phase * 0.4)
      out.x += sway + (particle.seedB - 0.5) * 0.16
      out.z += (particle.seedA - 0.5) * 0.3

      return phase > 0.94 ? 0 : 1
    }
    case "hidden":
      return 0
    default:
      return 0
  }
}

export function stagger(amount: number, delay: number, spread: number) {
  const value = amount * (1 + spread) - delay * spread
  const clamped = Math.min(1, Math.max(0, value))

  return clamped * clamped * (3 - 2 * clamped)
}
