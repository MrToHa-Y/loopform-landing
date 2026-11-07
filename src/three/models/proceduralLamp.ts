import { CatmullRomCurve3, TubeGeometry, Vector3 } from "three"
import { finishGeometry, latheSurface, mergeParts, withHeightLayers } from "./geometryUtils"

function createCord() {
  const curve = new CatmullRomCurve3([
    new Vector3(0.068, 0.012, 0),
    new Vector3(0.12, 0.007, 0),
    new Vector3(0.26, 0.006, 0.012),
    new Vector3(0.46, 0.006, -0.012),
    new Vector3(0.66, 0.006, 0.01),
  ])
  const geometry = withHeightLayers(new TubeGeometry(curve, 72, 0.0058, 10, false))

  geometry.getAttribute("aLayer").array.fill(0)

  return geometry
}

export function createLampGeometry() {
  const shade = latheSurface(
    [
      [0, 0.026],
      [0.05, 0.026],
      [0.07, 0.032],
      [0.083, 0.045],
      [0.094, 0.066],
      [0.097, 0.09],
      [0.093, 0.118],
      [0.09, 0.145],
      [0.094, 0.175],
      [0.104, 0.208],
      [0.116, 0.245],
      [0.125, 0.28],
      [0.127, 0.303],
      [0.122, 0.33],
      [0.111, 0.355],
      [0.097, 0.374],
      [0.086, 0.385],
      [0.081, 0.388],
      [0.078, 0.385],
      [0.082, 0.376],
      [0.094, 0.36],
      [0.1, 0.34],
    ],
    96,
    150,
  )
  const base = latheSurface(
    [
      [0, 0],
      [0.064, 0],
      [0.069, 0.003],
      [0.069, 0.028],
      [0.064, 0.032],
      [0, 0.032],
    ],
    96,
    40,
    0,
  )
  const cord = createCord()
  const body = finishGeometry(mergeParts([shade, base]), null, [cord])
  const main = mergeParts([body, cord])

  main.boundingBox = body.boundingBox

  return main
}
