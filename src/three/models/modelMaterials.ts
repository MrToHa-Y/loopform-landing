import { createPrintMaterial } from "@/three/materials/printMaterial"
import type { PrintBundle } from "@/three/materials/printMaterial"
import type { ModelParts } from "@/three/models/modelLibrary"
import { paletteColor } from "@/three/palette"

export function createBodyBundle(parts: ModelParts): PrintBundle {
  const { look, size } = parts

  return createPrintMaterial({
    color: paletteColor(look.color),
    speckle: [paletteColor(look.speckle[0]), paletteColor(look.speckle[1]), paletteColor(look.speckle[2])],
    edgeColor: paletteColor("nozzle"),
    speckleAmount: look.speckleAmount,
    speckleScale: look.speckleScale,
    layerHeight: look.layerHeight,
    roughMin: look.glow ? 0.34 : undefined,
    roughMax: look.glow ? 0.5 : undefined,
    glow: look.glow ? { color: paletteColor("lamp"), intensity: 1, y: size.y * 0.5, span: size.y * 0.17 } : undefined,
  })
}

export function createFeltBundle(): PrintBundle {
  const felt = paletteColor("felt")

  return createPrintMaterial({
    color: felt,
    speckle: [paletteColor("bone"), paletteColor("clay"), paletteColor("bone")],
    edgeColor: paletteColor("nozzle"),
    speckleAmount: 0.45,
    speckleScale: 520,
    relief: 0,
    roughMin: 1,
    roughMax: 1,
  })
}

export function createOakBundle(): PrintBundle {
  const oak = paletteColor("oak")

  return createPrintMaterial({
    color: oak,
    speckle: [oak, oak, oak],
    edgeColor: paletteColor("nozzle"),
    speckleAmount: 0,
    relief: 0,
    roughMin: 0.42,
    roughMax: 0.5,
    grain: true,
  })
}
