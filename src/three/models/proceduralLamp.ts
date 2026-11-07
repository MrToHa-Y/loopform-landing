import { finishGeometry, lathe } from "./geometryUtils"

export function createLampGeometry() {
  return finishGeometry(
    lathe([
      [0, 0],
      [0.1, 0],
      [0.12, 0.04],
      [0.075, 0.17],
      [0.105, 0.3],
      [0.085, 0.38],
      [0.05, 0.4],
    ]),
    null,
  )
}
