import { Vector3 } from "three"
import { finishGeometry, gridSurface, mergeParts, pillowGeometry, profileCurve, smoothstep } from "./geometryUtils"
import type { ProfilePoint } from "./geometryUtils"

const spine: readonly ProfilePoint[] = [
  [-0.262, 0.8],
  [-0.235, 0.7],
  [-0.2, 0.6],
  [-0.165, 0.52],
  [-0.115, 0.468],
  [-0.03, 0.442],
  [0.08, 0.438],
  [0.175, 0.44],
  [0.238, 0.405],
  [0.252, 0.33],
  [0.232, 0.22],
  [0.212, 0.13],
  [0.19, 0.06],
  [0.14, 0.024],
  [0.08, 0.02],
]

const shellRows = 200
const closeRows = 6
const sectionColumns = 56
const shellThickness = 0.03
const loopRods = 0.052
const loopThickness = 0.032
const loopHalfWidth = 0.205
const loopBack = -0.24
const loopFront = 0.13
const loopCorner = 0.075

function stadium(amount: number, halfWidth: number, halfThickness: number) {
  const straight = Math.max(halfWidth - halfThickness, 0) * 2
  const arc = Math.PI * halfThickness
  const perimeter = (straight + arc) * 2
  let distance = (((amount % 1) + 1) % 1) * perimeter

  if (distance < straight) {
    return [halfWidth - halfThickness - distance, halfThickness] as const
  }

  distance -= straight

  if (distance < arc) {
    const angle = Math.PI / 2 + distance / halfThickness

    return [-(halfWidth - halfThickness) + Math.cos(angle) * halfThickness, Math.sin(angle) * halfThickness] as const
  }

  distance -= arc

  if (distance < straight) {
    return [-(halfWidth - halfThickness) + distance, -halfThickness] as const
  }

  distance -= straight

  const angle = -Math.PI / 2 + distance / halfThickness

  return [halfWidth - halfThickness + Math.cos(angle) * halfThickness, Math.sin(angle) * halfThickness] as const
}

function widthAt(amount: number) {
  return 0.385 + 0.06 * smoothstep(0, 0.42, amount)
}

function dishAt(amount: number) {
  return 0.034 * (1 - smoothstep(0.1, 0.4, amount)) + 0.014 * smoothstep(0.3, 0.42, amount) * (1 - smoothstep(0.55, 0.68, amount))
}

function createShell() {
  const curve = profileCurve(spine)
  const length = curve.getLength()
  const totalRows = shellRows + closeRows * 2
  const stations = Array.from({ length: shellRows + 1 }, (_, index) => ({
    point: curve.getPointAt(index / shellRows),
    tangent: curve.getTangentAt(index / shellRows),
  }))

  return gridSurface(sectionColumns, totalRows, true, (column, row) => {
    const local = Math.min(shellRows, Math.max(0, row - closeRows))
    const amount = local / shellRows
    const close = row < closeRows ? (closeRows - row) / closeRows : row > shellRows + closeRows ? (row - shellRows - closeRows) / closeRows : 0
    const direction = row < closeRows ? -1 : 1

    const { point, tangent } = stations[local] ?? { point: new Vector3(), tangent: new Vector3(1, 0, 0) }

    const closeAngle = close * Math.PI * 0.5
    const half = (shellThickness / 2) * Math.cos(closeAngle)
    const extend = (shellThickness / 2) * Math.sin(closeAngle) * direction
    const halfWidth = widthAt(amount) / 2
    const [across, normal] = stadium(column / sectionColumns, halfWidth, Math.max(half, 0.0001))
    const edge = across / halfWidth
    const offset = normal + dishAt(amount) * edge * edge
    const normalX = -tangent.y
    const normalY = tangent.x

    return [
      point.x + normalX * offset + tangent.x * extend,
      point.y + normalY * offset + tangent.y * extend,
      across,
      amount * length + extend,
    ]
  })
}

function loopPath() {
  const path: { x: number; z: number; angle: number }[] = []
  const inner = loopHalfWidth - loopCorner
  const corners: readonly (readonly [number, number])[] = [
    [loopFront - loopCorner, inner],
    [loopBack + loopCorner, inner],
    [loopBack + loopCorner, -inner],
    [loopFront - loopCorner, -inner],
  ]

  corners.forEach(([centerX, centerZ], side) => {
    const [nextX, nextZ] = corners[(side + 1) % 4] ?? [0, 0]
    const start = (side * Math.PI) / 2
    const end = start + Math.PI / 2

    for (let step = 0; step < 14; step += 1) {
      const angle = start + ((end - start) * step) / 14

      path.push({ x: centerX + Math.cos(angle) * loopCorner, z: centerZ + Math.sin(angle) * loopCorner, angle })
    }

    for (let step = 0; step < 18; step += 1) {
      const amount = step / 18

      path.push({
        x: centerX + (nextX - centerX) * amount + Math.cos(end) * loopCorner,
        z: centerZ + (nextZ - centerZ) * amount + Math.sin(end) * loopCorner,
        angle: end,
      })
    }
  })

  return path
}

function createLoop() {
  const path = loopPath()
  const rows = 28

  return gridSurface(path.length, rows, true, (column, row) => {
    const point = path[column] ?? { x: 0, z: 0, angle: 0 }
    const [height, out] = stadium(row / rows, loopRods / 2, loopThickness / 2)
    const y = height + loopRods / 2

    return [point.x + Math.cos(point.angle) * out, y, point.z + Math.sin(point.angle) * out, y]
  })
}

export function createChairParts() {
  const cushion = pillowGeometry(0.17, 0.195, 0.05)

  cushion.translate(0.06, 0.482, 0)

  const shell = createShell()
  const loop = createLoop()
  const main = finishGeometry(mergeParts([shell, loop]), null, [cushion])

  return { main, cushion }
}
