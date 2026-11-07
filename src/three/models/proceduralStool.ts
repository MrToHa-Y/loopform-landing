import { finishGeometry, lathe } from "./geometryUtils"

export function createStoolGeometry() {
  return finishGeometry(
    lathe([
      [0, 0],
      [0.17, 0],
      [0.19, 0.04],
      [0.16, 0.2],
      [0.2, 0.41],
      [0.185, 0.45],
      [0, 0.45],
    ]),
    null,
  )
}

export function createBarStoolGeometry() {
  return finishGeometry(
    lathe([
      [0, 0],
      [0.19, 0],
      [0.2, 0.03],
      [0.09, 0.3],
      [0.1, 0.55],
      [0.2, 0.72],
      [0.19, 0.75],
      [0, 0.75],
    ]),
    null,
  )
}
