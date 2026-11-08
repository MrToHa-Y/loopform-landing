import { Vector3 } from "three"
import type { BufferGeometry } from "three"
import type { CatalogModelId, VariantGroupId, VariantSelection } from "@/content/types"
import type { PaletteToken } from "@/three/palette"
import { createBenchGeometry, createPlanterGeometry, createScreenGeometry, createShelfGeometry, createTableParts } from "./proceduralCatalog"
import { createChairParts } from "./proceduralChair"
import { createLampGeometry } from "./proceduralLamp"
import { createLoungeParts } from "./proceduralLounge"
import { createBarStoolParts, createStoolParts } from "./proceduralStool"

export interface ModelLook {
  color: PaletteToken
  speckle: readonly [PaletteToken, PaletteToken, PaletteToken]
  speckleAmount: number
  speckleScale: number
  layerHeight: number
  displayYaw: number
  displayPitch: number
  glow: boolean
}

export interface ModelParts {
  main: BufferGeometry
  cushion: BufferGeometry | null
  top: BufferGeometry | null
  size: Vector3
  look: ModelLook
}

type Built = { main: BufferGeometry; cushion?: BufferGeometry; top?: BufferGeometry }

const speckleLook = { glow: false } as const

const models: Record<CatalogModelId, { build: (options: VariantSelection) => Built; shape?: VariantGroupId[]; look: ModelLook }> = {
  tolqyn: {
    build: createChairParts,
    look: {
      ...speckleLook,
      color: "brick",
      speckle: ["bone", "sand", "sun"],
      speckleAmount: 0.05,
      speckleScale: 190,
      layerHeight: 0.0132,
      displayYaw: -45,
      displayPitch: 6,
    },
  },
  tas: {
    build: (options) => createStoolParts(options.shape),
    shape: ["shape"],
    look: {
      ...speckleLook,
      color: "pine",
      speckle: ["bone", "teal", "bone"],
      speckleAmount: 0.05,
      speckleScale: 210,
      layerHeight: 0.0084,
      displayYaw: 0,
      displayPitch: 8,
    },
  },
  biik: {
    build: createBarStoolParts,
    look: {
      ...speckleLook,
      color: "cap-blue",
      speckle: ["bone", "sun", "cap-red"],
      speckleAmount: 0.05,
      speckleScale: 190,
      layerHeight: 0.0105,
      displayYaw: 0,
      displayPitch: 8,
    },
  },
  qum: {
    build: createLoungeParts,
    look: {
      ...speckleLook,
      color: "dune",
      speckle: ["nozzle", "clay", "oak"],
      speckleAmount: 0.06,
      speckleScale: 170,
      layerHeight: 0.0136,
      displayYaw: -62,
      displayPitch: 16,
    },
  },
  kol: {
    build: createTableParts,
    look: {
      ...speckleLook,
      color: "linen",
      speckle: ["oak", "clay", "nozzle"],
      speckleAmount: 0.09,
      speckleScale: 230,
      layerHeight: 0.0118,
      displayYaw: 0,
      displayPitch: 8,
    },
  },
  saule: {
    build: () => ({ main: createLampGeometry() }),
    look: {
      color: "cobalt",
      speckle: ["bone", "bone", "sand"],
      speckleAmount: 0.06,
      speckleScale: 380,
      layerHeight: 0.0058,
      displayYaw: 0,
      displayPitch: 8,
      glow: true,
    },
  },
  japyraq: {
    build: () => ({ main: createPlanterGeometry() }),
    look: {
      ...speckleLook,
      color: "moss",
      speckle: ["cap-red", "sun", "cap-blue"],
      speckleAmount: 0.16,
      speckleScale: 130,
      layerHeight: 0.0058,
      displayYaw: 0,
      displayPitch: 8,
    },
  },
  saiabaq: {
    build: (options) => ({ main: createBenchGeometry(options.arch) }),
    shape: ["arch"],
    look: {
      ...speckleLook,
      color: "brick",
      speckle: ["sun", "cap-blue", "bottle-green"],
      speckleAmount: 0.1,
      speckleScale: 120,
      layerHeight: 0.0105,
      displayYaw: -36,
      displayPitch: 18,
    },
  },
  ornek: {
    build: (options) => ({ main: createScreenGeometry(options.fold) }),
    shape: ["fold"],
    look: {
      ...speckleLook,
      color: "clay",
      speckle: ["cap-red", "cap-blue", "bottle-green"],
      speckleAmount: 0.14,
      speckleScale: 62,
      layerHeight: 0.0185,
      displayYaw: 0,
      displayPitch: 8,
    },
  },
  uya: {
    build: (options) => ({ main: createShelfGeometry(options.modules, options.orientation) }),
    shape: ["modules", "orientation"],
    look: {
      ...speckleLook,
      color: "mustard",
      speckle: ["cap-red", "cap-blue", "bottle-green"],
      speckleAmount: 0.16,
      speckleScale: 62,
      layerHeight: 0.0078,
      displayYaw: -22,
      displayPitch: 4,
    },
  },
}

const cache = new Map<string, ModelParts>()

export function shapeKey(id: CatalogModelId, options: VariantSelection = {}) {
  return [id, ...(models[id].shape ?? []).map((group) => options[group] ?? "")].join(":")
}

export function getModelParts(id: CatalogModelId, options: VariantSelection = {}): ModelParts {
  const key = shapeKey(id, options)
  const cached = cache.get(key)

  if (cached) {
    return cached
  }

  const { build, look } = models[id]
  const built = build(options)
  const box = built.main.boundingBox

  if (!box) {
    throw new Error(`Model ${id} has no bounds`)
  }

  const parts: ModelParts = {
    main: built.main,
    cushion: built.cushion ?? null,
    top: built.top ?? null,
    size: box.getSize(new Vector3()),
    look,
  }

  cache.set(key, parts)

  return parts
}
