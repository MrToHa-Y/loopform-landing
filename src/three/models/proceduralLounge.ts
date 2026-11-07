import { ExtrudeGeometry } from "three"
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js"
import { finishGeometry, profileCurve, strokeToShape } from "./geometryUtils"
import type { ProfilePoint } from "./geometryUtils"

const profile: readonly ProfilePoint[] = [
  [0.0, 0.72],
  [-0.1, 0.4],
  [0.05, 0.12],
  [0.55, 0.1],
  [0.7, 0.3],
]

export function createLoungeGeometry() {
  const shape = strokeToShape(profileCurve(profile), 0.06)
  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.75,
    bevelEnabled: true,
    bevelSize: 0.03,
    bevelThickness: 0.03,
    bevelSegments: 4,
    curveSegments: 96,
    steps: 1,
  })

  return finishGeometry(geometry)
}

export function createLoungeCushion() {
  const geometry = new RoundedBoxGeometry(0.5, 0.1, 0.62, 5, 0.045)

  geometry.rotateZ(-0.05)
  geometry.translate(0.03, 0.17, 0)

  return geometry
}
