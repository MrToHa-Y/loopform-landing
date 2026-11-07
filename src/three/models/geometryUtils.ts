import { CatmullRomCurve3, LatheGeometry, Shape, Vector2, Vector3 } from "three"
import type { BufferGeometry } from "three"
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js"

export type ProfilePoint = readonly [number, number]

export function profileCurve(points: readonly ProfilePoint[]) {
  return new CatmullRomCurve3(
    points.map(([x, y]) => new Vector3(x, y, 0)),
    false,
    "catmullrom",
    0.5,
  )
}

export function strokeToShape(curve: CatmullRomCurve3, thickness = 0.035, samples = 120) {
  const left: Vector2[] = []
  const right: Vector2[] = []
  const half = thickness / 2

  for (let index = 0; index <= samples; index += 1) {
    const amount = index / samples
    const point = curve.getPointAt(amount)
    const tangent = curve.getTangentAt(amount)
    const normalX = -tangent.y
    const normalY = tangent.x

    left.push(new Vector2(point.x + normalX * half, point.y + normalY * half))
    right.push(new Vector2(point.x - normalX * half, point.y - normalY * half))
  }

  return new Shape([...left, ...right.reverse()])
}

export function lathe(points: readonly ProfilePoint[], segments = 96, samples = 48) {
  const curve = profileCurve(points)
  const profile = curve.getSpacedPoints(samples).map((point) => new Vector2(Math.max(point.x, 0), point.y))

  return new LatheGeometry(profile, segments)
}

export function finishGeometry(geometry: BufferGeometry, creaseAngle: number | null = 0.7) {
  const smooth = creaseAngle === null ? geometry : toCreasedNormals(geometry, creaseAngle)

  smooth.computeBoundingBox()

  const box = smooth.boundingBox

  if (box) {
    const center = box.getCenter(new Vector3())
    smooth.translate(-center.x, -box.min.y, -center.z)
    smooth.computeBoundingBox()
  }

  return smooth
}
