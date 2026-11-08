import { finishGeometry, latheSurface, pillowGeometry } from "./geometryUtils"
import type { ProfilePoint } from "./geometryUtils"

const doubleWave: readonly ProfilePoint[] = [
  [0, 0],
  [0.1, 0],
  [0.128, 0.006],
  [0.156, 0.026],
  [0.174, 0.058],
  [0.183, 0.1],
  [0.184, 0.14],
  [0.18, 0.185],
  [0.178, 0.216],
  [0.184, 0.25],
  [0.191, 0.285],
  [0.192, 0.32],
  [0.187, 0.355],
  [0.174, 0.39],
  [0.152, 0.416],
  [0.122, 0.432],
  [0.08, 0.44],
  [0.03, 0.438],
  [0, 0.436],
]

const singleWave: readonly ProfilePoint[] = [
  [0, 0],
  [0.1, 0],
  [0.132, 0.008],
  [0.16, 0.034],
  [0.178, 0.08],
  [0.189, 0.15],
  [0.193, 0.22],
  [0.19, 0.29],
  [0.18, 0.35],
  [0.162, 0.396],
  [0.13, 0.428],
  [0.08, 0.44],
  [0.03, 0.438],
  [0, 0.436],
]

export function createStoolParts(shape = "double") {
  const cushion = pillowGeometry(0.152, 0.152, 0.066, 2)

  cushion.translate(0, 0.462, 0)

  const main = finishGeometry(latheSurface(shape === "single" ? singleWave : doubleWave, 96, 150), null, [cushion])

  return { main, cushion }
}

export function createBarStoolParts() {
  const cushion = pillowGeometry(0.15, 0.15, 0.05, 2)

  cushion.translate(0, 0.766, 0)

  const main = finishGeometry(
    latheSurface(
      [
        [0, 0],
        [0.12, 0],
        [0.15, 0.008],
        [0.168, 0.04],
        [0.16, 0.12],
        [0.13, 0.26],
        [0.116, 0.38],
        [0.128, 0.5],
        [0.16, 0.62],
        [0.186, 0.69],
        [0.186, 0.725],
        [0.16, 0.745],
        [0.08, 0.75],
        [0, 0.748],
      ],
      96,
      150,
    ),
    null,
    [cushion],
  )

  return { main, cushion }
}
