import { BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Path, Shape, ShapeUtils, Vector2 } from "three"
import { finishGeometry, gridSurface, latheSurface, mergeParts, withHeightLayers } from "./geometryUtils"

export function createTableParts() {
  const base = latheSurface(
    [
      [0, 0],
      [0.235, 0],
      [0.25, 0.006],
      [0.258, 0.03],
      [0.256, 0.1],
      [0.252, 0.2],
      [0.256, 0.262],
      [0.272, 0.298],
      [0.298, 0.322],
      [0.316, 0.34],
      [0.344, 0.358],
      [0.364, 0.376],
      [0.386, 0.392],
      [0.402, 0.41],
      [0.408, 0.426],
      [0.39, 0.43],
      [0, 0.43],
    ],
    112,
    150,
  )
  const top = latheSurface(
    [
      [0, 0.43],
      [0.2, 0.43],
      [0.39, 0.43],
      [0.414, 0.431],
      [0.424, 0.438],
      [0.426, 0.451],
      [0.424, 0.463],
      [0.414, 0.471],
      [0.39, 0.472],
      [0.2, 0.472],
      [0, 0.472],
    ],
    128,
    60,
    0,
  )
  const main = finishGeometry(base, null, [top])

  top.computeBoundingBox()

  if (main.boundingBox && top.boundingBox) {
    main.boundingBox.union(top.boundingBox)
  }

  return { main, top }
}

export function createPlanterGeometry() {
  return finishGeometry(
    latheSurface(
      [
        [0, 0],
        [0.07, 0],
        [0.08, 0.002],
        [0.085, 0.01],
        [0.1, 0.08],
        [0.118, 0.16],
        [0.134, 0.226],
        [0.137, 0.234],
        [0.134, 0.24],
        [0.122, 0.243],
        [0.06, 0.244],
        [0.015, 0.241],
        [0, 0.24],
      ],
      96,
      140,
    ),
  )
}

const benchLength = 1.45
const benchWidth = 0.5
const benchHeight = 0.45
const benchShoulder = 0.175
const benchWall = 0.098
const benchArchTop = 0.335
const benchEdge = 0.022
const benchLayer = 0.0105

interface ContourPoint {
  x: number
  y: number
  normalX: number
  normalY: number
}

function arc(centerX: number, centerY: number, radius: number, from: number, to: number, steps: number, inward: boolean) {
  const points: ContourPoint[] = []

  for (let index = 0; index <= steps; index += 1) {
    const angle = from + ((to - from) * index) / steps
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    points.push({
      x: centerX + cos * radius,
      y: centerY + sin * radius,
      normalX: inward ? -cos : cos,
      normalY: inward ? -sin : sin,
    })
  }

  return points
}

function line(fromX: number, fromY: number, toX: number, toY: number, steps: number, normalX: number, normalY: number) {
  const points: ContourPoint[] = []

  for (let index = 0; index < steps; index += 1) {
    const amount = index / steps

    points.push({ x: fromX + (toX - fromX) * amount, y: fromY + (toY - fromY) * amount, normalX, normalY })
  }

  return points
}

function benchContour(solid: boolean) {
  const half = benchWidth / 2
  const inner = half - benchWall
  const shoulderY = benchHeight - benchShoulder
  const archY = benchArchTop - inner
  const outline = [
    ...line(half, 0, half, shoulderY, 14, 1, 0),
    ...arc(half - benchShoulder, shoulderY, benchShoulder, 0, Math.PI / 2, 36, false),
    ...line(half - benchShoulder, benchHeight, -half + benchShoulder, benchHeight, 6, 0, 1),
    ...arc(-half + benchShoulder, shoulderY, benchShoulder, Math.PI / 2, Math.PI, 36, false),
    ...line(-half, shoulderY, -half, 0, 14, -1, 0),
  ]

  if (solid) {
    return [...outline, ...line(-half, 0, half, 0, 12, 0, -1)]
  }

  return [
    ...outline,
    ...line(-half, 0, -inner, 0, 3, 0, -1),
    ...line(-inner, 0, -inner, archY, 12, 1, 0),
    ...arc(0, archY, inner, Math.PI, 0, 48, true),
    ...line(inner, archY, inner, 0, 12, -1, 0),
    ...line(inner, 0, half, 0, 3, 0, -1),
  ]
}

function benchLayerAt(y: number) {
  const shoulderY = benchHeight - benchShoulder

  if (y <= shoulderY) {
    return y
  }

  const rise = Math.min((y - shoulderY) / benchShoulder, 1)
  const total = shoulderY + Math.asin(rise) * benchShoulder
  const top = shoulderY + (Math.PI / 2) * benchShoulder
  const aligned = (Math.floor(top / benchLayer) + 0.5) * benchLayer

  return total + (aligned - top) * rise
}

function benchSection(contour: ContourPoint[], inset: number) {
  return contour.map((point) => new Vector2(point.x - point.normalX * inset, Math.max(point.y - point.normalY * inset, 0)))
}

function createBenchCap(contour: ContourPoint[], inset: number, z: number, facing: number) {
  const section = benchSection(contour, inset)
  const triangles = ShapeUtils.triangulateShape(section, [])
  const positions: number[] = []
  const normals: number[] = []
  const layers: number[] = []

  triangles.forEach(([a, b, c]) => {
    const order = facing > 0 ? [a, b, c] : [a, c, b]

    order.forEach((index) => {
      const point = section[index ?? 0]

      if (point) {
        positions.push(point.x, point.y, z)
        normals.push(0, 0, facing)
        layers.push(benchLayerAt(point.y))
      }
    })
  })

  const cap = new BufferGeometry()

  cap.setAttribute("position", new Float32BufferAttribute(positions, 3))
  cap.setAttribute("normal", new Float32BufferAttribute(normals, 3))
  cap.setAttribute("aLayer", new Float32BufferAttribute(layers, 1))

  return cap
}

export function createBenchGeometry(opening = "arch") {
  const contour = benchContour(opening === "solid")
  const edgeRows = 6
  const stations: { z: number; inset: number }[] = []

  for (let index = 0; index <= edgeRows; index += 1) {
    const sweep = (index / edgeRows) * (Math.PI / 2)

    stations.push({ z: -benchLength / 2 + benchEdge * (1 - Math.cos(sweep)), inset: benchEdge * (1 - Math.sin(sweep)) })
  }

  for (let index = edgeRows; index >= 0; index -= 1) {
    const sweep = (index / edgeRows) * (Math.PI / 2)

    stations.push({ z: benchLength / 2 - benchEdge * (1 - Math.cos(sweep)), inset: benchEdge * (1 - Math.sin(sweep)) })
  }

  const body = gridSurface(contour.length, stations.length - 1, true, (column, row) => {
    const point = contour[column]
    const station = stations[row]

    if (!point || !station) {
      return [0, 0, 0, 0]
    }

    const y = Math.max(point.y - point.normalY * station.inset, 0)

    return [point.x - point.normalX * station.inset, y, station.z, benchLayerAt(y)]
  })
  const geometry = mergeParts([
    body,
    createBenchCap(contour, benchEdge, -benchLength / 2, -1),
    createBenchCap(contour, benchEdge, benchLength / 2, 1),
  ])

  geometry.rotateY(Math.PI / 2)

  return finishGeometry(geometry)
}

const panelWidth = 0.5
const panelHeight = 1.6
const panelDepth = 0.05
const hingeGap = 0.012

function diamondHole(x: number, y: number) {
  const halfWidth = 0.0375
  const halfHeight = 0.06
  const hole = new Path()

  hole.moveTo(x, y - halfHeight)
  hole.lineTo(x + halfWidth, y)
  hole.lineTo(x, y + halfHeight)
  hole.lineTo(x - halfWidth, y)
  hole.closePath()

  return hole
}

function createPanel(startX: number, startZ: number, heading: number) {
  const shape = new Shape()

  shape.moveTo(0, 0)
  shape.lineTo(panelWidth, 0)
  shape.lineTo(panelWidth, panelHeight)
  shape.lineTo(0, panelHeight)
  shape.closePath()

  for (let row = 0; row < 9; row += 1) {
    const y = panelHeight * (0.1 + row * 0.1)
    const columns = row % 2 === 0 ? [0.2, 0.5, 0.8] : [0.35, 0.65]

    columns.forEach((column) => {
      shape.holes.push(diamondHole(panelWidth * column, y))
    })
  }

  const panel = new ExtrudeGeometry(shape, { depth: panelDepth, bevelEnabled: false, curveSegments: 1 })

  panel.translate(0, 0, -panelDepth / 2)
  panel.rotateY(-heading)
  panel.translate(startX, 0, startZ)

  return withHeightLayers(panel)
}

const screenFolds: Record<string, readonly number[]> = {
  zigzag: [-0.22, 0.64, -0.2],
  corner: [-0.1, 1.2, 1.2],
  flat: [0, 0, 0],
}

export function createScreenGeometry(fold = "zigzag") {
  const headings = screenFolds[fold] ?? screenFolds.zigzag ?? []
  const panels: BufferGeometry[] = []
  let x = 0
  let z = 0

  headings.forEach((heading) => {
    panels.push(createPanel(x, z, heading))
    x += Math.cos(heading) * (panelWidth + hingeGap)
    z += Math.sin(heading) * (panelWidth + hingeGap)
  })

  return finishGeometry(mergeParts(panels), 0.5)
}

const cellRadius = 0.15
const cellWall = 0.036
const cellDepth = 0.2
const cellGap = 0.003

function createHexCell(x: number, y: number, turn: number) {
  const inner = cellRadius - cellWall / Math.cos(Math.PI / 6)
  const outline = new Shape()
  const hole = new Path()

  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2 + turn
    const px = x + Math.cos(angle) * cellRadius
    const py = y + Math.sin(angle) * cellRadius
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

  return withHeightLayers(new ExtrudeGeometry(outline, { depth: cellDepth, bevelEnabled: false }))
}

const pointySlots: readonly (readonly [number, number])[] = [
  [-0.5, 0],
  [0.5, 0],
  [0, 1],
  [1.5, 0],
  [1, 1],
  [0.5, 2],
]

const flatSlots: readonly (readonly [number, number])[] = [
  [0, 0],
  [1, 0.5],
  [0, 1],
  [2, 0],
  [2, 1],
  [1, 1.5],
]

export function createShelfGeometry(modules = "3", orientation = "pointy") {
  const count = Math.min(Math.max(Number(modules) || 3, 1), pointySlots.length)
  const flat = orientation === "flat"
  const across = flat ? cellRadius * 1.5 + cellGap : cellRadius * Math.sqrt(3) + cellGap
  const rise = flat ? cellRadius * Math.sqrt(3) + cellGap : cellRadius * 1.5 + cellGap
  const slots = (flat ? flatSlots : pointySlots).slice(0, count)

  return finishGeometry(
    mergeParts(slots.map(([column, row]) => createHexCell(column * across, row * rise, flat ? 0 : Math.PI / 6))),
    0.5,
  )
}
