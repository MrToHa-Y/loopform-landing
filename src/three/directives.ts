import { Vector3 } from "three"
import type { ParticleStateName } from "@/three/particles/particleStates"

export interface ParticleLayer {
  from: ParticleStateName
  to: ParticleStateName
  amount: number
}

export const particleDirective = {
  caps: { from: "hidden", to: "hidden", amount: 0 } as ParticleLayer,
  flakes: { from: "hidden", to: "hidden", amount: 0 } as ParticleLayer,
  center: new Vector3(),
  nozzle: new Vector3(),
  silhouetteCenter: new Vector3(),
  silhouetteScale: 1,
  silhouetteRotation: 0,
  streamFrom: new Vector3(),
  streamTo: new Vector3(),
  spin: 1,
  paletteMode: false,
}

export const nozzleDirective = {
  active: false,
  position: new Vector3(),
  width: 1,
}

export const shadowDirective = {
  visible: false,
  position: new Vector3(),
  width: 1,
  opacity: 0,
}

export const shardDirective = {
  opacity: 0,
  center: new Vector3(),
}

export const processDirective = {
  visible: false,
}
