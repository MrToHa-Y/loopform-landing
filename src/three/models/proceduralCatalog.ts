import { CylinderGeometry, ExtrudeGeometry, Path, Shape } from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import { finishGeometry, lathe, profileCurve, strokeToShape } from "./geometryUtils"

function merge(parts: Parameters<typeof mergeGeometries>[0]) {
  const prepared = parts.map((part) => {
    const flat = part.index ? part.toNonIndexed() : part
    flat.deleteAttribute("uv")
    return flat
  })
  const merged = mergeGeometries(prepared)

  if (!merged) {
    throw new Error("Catalog geometry merge failed")
  }

  return merged
}

export function createTableGeometry() {
  const base = lathe([
    [0, 0],
    [0.28, 0],
    [0.3, 0.03],
    [0.12, 0.2],
    [0.14, 0.36],
    [0, 0.36],
  ])
  const top = new CylinderGeometry(0.4, 0.4, 0.04, 96)

  top.translate(0, 0.38, 0)

  return finishGeometry(merge([base, top]), 1)
}

export function createPlanterGeometry() {
  return finishGeometry(
    lathe([
      [0, 0],
      [0.11, 0],
      [0.13, 0.02],
      [0.18, 0.22],
      [0.2, 0.3],
      [0.19, 0.3],
      [0.165, 0.23],
      [0, 0.22],
    ]),
    null,
  )
}

export function createBenchGeometry() {
  const curve = profileCurve([
    [-0.22, 0.02],
    [-0.2, 0.43],
    [0.2, 0.43],
    [0.22, 0.02],
  ])
  const geometry = new ExtrudeGeometry(strokeToShape(curve, 0.05), {
    depth: 1.8,
    bevelEnabled: true,
    bevelSize: 0.012,
    bevelThickness: 0.012,
    bevelSegments: 3,
    steps: 1,
  })

  geometry.rotateY(Math.PI / 2)

  return finishGeometry(geometry)
}

function diamondHole(x: number, y: number, size: number) {
  const hole = new Path()

  hole.moveTo(x, y - size)
  hole.lineTo(x + size * 0.7, y)
  hole.lineTo(x, y + size)
  hole.lineTo(x - size * 0.7, y)
  hole.closePath()

  return hole
}

function createPanel(offset: number, angle: number) {
  const shape = new Shape()

  shape.moveTo(-0.25, 0)
  shape.lineTo(0.25, 0)
  shape.lineTo(0.25, 1.8)
  shape.lineTo(-0.25, 1.8)
  shape.closePath()

  for (let row = 0; row < 9; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const shift = row % 2 === 0 ? 0 : 0.07
      const x = -0.14 + column * 0.14 + shift

      if (x < 0.2) {
        shape.holes.push(diamondHole(x, 0.18 + row * 0.18, 0.06))
      }
    }
  }

  const panel = new ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false, curveSegments: 2 })

  panel.rotateY(angle)
  panel.translate(offset, 0, 0)

  return panel
}

export function createScreenGeometry() {
  return finishGeometry(merge([createPanel(-0.5, 0.35), createPanel(0, -0.35), createPanel(0.5, 0.35)]), 0.5)
}

function createHexCell(x: number, y: number) {
  const radius = 0.17
  const inner = 0.145
  const outline = new Shape()
  const hole = new Path()

  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2 + Math.PI / 6
    const px = x + Math.cos(angle) * radius
    const py = y + Math.sin(angle) * radius
    const hx = x + Math.cos(angle) * inner
    const hy = y + Math.sin(angle) * inner

    if (index === 0) {
      outline.moveTo(px, py)
      hole.moveTo(hx, hy)
    } else {
      outline.lineTo(px, py)
      hole.lineTo(hx, hy)
    }
  }

  outline.closePath()
  hole.closePath()
  outline.holes.push(hole)

  return new ExtrudeGeometry(outline, { depth: 0.2, bevelEnabled: false })
}

export function createShelfGeometry() {
  return finishGeometry(
    merge([createHexCell(0, 0.17), createHexCell(0.3, 0.17), createHexCell(0.15, 0.43)]),
    0.5,
  )
}
