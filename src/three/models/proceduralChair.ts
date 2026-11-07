import { ExtrudeGeometry } from "three"
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js"
import { finishGeometry, profileCurve, strokeToShape } from "./geometryUtils"
import type { ProfilePoint } from "./geometryUtils"

const profile: readonly ProfilePoint[] = [
  [-0.04, 0.82],
  [0.0, 0.47],
  [0.45, 0.45],
  [0.42, 0.02],
  [-0.06, 0.0],
]

export function createChairGeometry() {
  const shape = strokeToShape(profileCurve(profile), 0.035)
  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.46,
    bevelEnabled: true,
    bevelSize: 0.012,
    bevelThickness: 0.012,
    bevelSegments: 4,
    curveSegments: 96,
    steps: 1,
  })

  return finishGeometry(geometry)
}

export function createChairCushion() {
  const geometry = new RoundedBoxGeometry(0.42, 0.05, 0.42, 4, 0.024)

  geometry.translate(0.03, 0.495, 0)

  return geometry
}
