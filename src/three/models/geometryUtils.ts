import { BufferAttribute, BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Vector3 } from "three"
import { mergeGeometries, toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js"

export type ProfilePoint = readonly [number, number]

export type SurfaceSample = readonly [x: number, y: number, z: number, layer: number]

export function smoothstep(from: number, to: number, value: number) {
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)))

  return t * t * (3 - 2 * t)
}

export function profileCurve(points: readonly ProfilePoint[]) {
  return new CatmullRomCurve3(
    points.map(([x, y]) => new Vector3(x, y, 0)),
    false,
    "catmullrom",
    0.5,
  )
}

export function gridSurface(
  columns: number,
  rows: number,
  closed: boolean,
  sample: (column: number, row: number) => SurfaceSample,
) {
  const width = closed ? columns : columns + 1
  const positions = new Float32Array(width * (rows + 1) * 3)
  const layers = new Float32Array(width * (rows + 1))
  const indices: number[] = []

  for (let row = 0; row <= rows; row += 1) {
    for (let column = 0; column < width; column += 1) {
      const [x, y, z, layer] = sample(column, row)
      const index = row * width + column

      positions[index * 3] = x
      positions[index * 3 + 1] = y
      positions[index * 3 + 2] = z
      layers[index] = layer
    }
  }

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const next = closed ? (column + 1) % width : column + 1
      const a = row * width + column
      const b = row * width + next
      const c = (row + 1) * width + column
      const d = (row + 1) * width + next

      indices.push(a, c, b, b, c, d)
    }
  }

  const geometry = new BufferGeometry()

  geometry.setAttribute("position", new BufferAttribute(positions, 3))
  geometry.setAttribute("aLayer", new BufferAttribute(layers, 1))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}

export function latheSurface(points: readonly ProfilePoint[], segments = 128, samples = 160, flatLayer: number | null = null) {
  const curve = profileCurve(points)
  const profile = curve.getSpacedPoints(samples)
  const length = curve.getLength()

  return gridSurface(segments, samples, true, (column, row) => {
    const point = profile[row] ?? profile[0]
    const radius = Math.max(point?.x ?? 0, 0)
    const angle = (column / segments) * Math.PI * 2

    return [Math.cos(angle) * radius, point?.y ?? 0, Math.sin(angle) * radius, flatLayer ?? (row / samples) * length]
  })
}

export function withHeightLayers(geometry: BufferGeometry) {
  const position = geometry.getAttribute("position")
  const layers = new Float32Array(position.count)

  for (let index = 0; index < position.count; index += 1) {
    layers[index] = position.getY(index)
  }

  geometry.setAttribute("aLayer", new Float32BufferAttribute(layers, 1))

  return geometry
}

export function mergeParts(parts: BufferGeometry[]) {
  const prepared = parts.map((part) => {
    const flat = part.index ? part.toNonIndexed() : part

    flat.deleteAttribute("uv")

    return flat
  })
  const merged = mergeGeometries(prepared)

  if (!merged) {
    throw new Error("Geometry merge failed")
  }

  return merged
}

export function finishGeometry(geometry: BufferGeometry, creaseAngle: number | null = null, followers: BufferGeometry[] = []) {
  const smooth = creaseAngle === null ? geometry : toCreasedNormals(geometry, creaseAngle)

  smooth.computeBoundingBox()

  const box = smooth.boundingBox

  if (box) {
    const center = box.getCenter(new Vector3())
    const offset = new Vector3(-center.x, -box.min.y, -center.z)

    smooth.translate(offset.x, offset.y, offset.z)
    followers.forEach((follower) => follower.translate(offset.x, offset.y, offset.z))
    smooth.computeBoundingBox()
  }

  return smooth
}

export function pillowGeometry(radiusX: number, radiusZ: number, height: number, roundness = 3.2) {
  const columns = 72
  const rows = 28

  return gridSurface(columns, rows, true, (column, row) => {
    const angle = (column / columns) * Math.PI * 2
    const sweep = (row / rows) * Math.PI
    const reach = Math.sin(sweep) ** 0.42
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const planX = Math.sign(cos) * Math.abs(cos) ** (2 / roundness)
    const planZ = Math.sign(sin) * Math.abs(sin) ** (2 / roundness)

    return [planX * radiusX * reach, -Math.cos(sweep) * height * 0.5, planZ * radiusZ * reach, 0.001]
  })
}
