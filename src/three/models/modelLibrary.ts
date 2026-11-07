import { Vector3 } from "three"
import type { BufferGeometry } from "three"
import type { CatalogModelId, ColorToken } from "@/content/types"
import { createBenchGeometry, createPlanterGeometry, createScreenGeometry, createShelfGeometry, createTableGeometry } from "./proceduralCatalog"
import { createChairCushion, createChairGeometry } from "./proceduralChair"
import { createLampGeometry } from "./proceduralLamp"
import { createLoungeCushion, createLoungeGeometry } from "./proceduralLounge"
import { createBarStoolGeometry, createStoolGeometry } from "./proceduralStool"

export interface ModelParts {
  main: BufferGeometry
  cushion: BufferGeometry | null
  size: Vector3
  color: ColorToken
  translucent: boolean
}

const builders: Record<CatalogModelId, () => Pick<ModelParts, "main" | "cushion"> & Partial<ModelParts>> = {
  tolqyn: () => ({ main: createChairGeometry(), cushion: createChairCushion(), color: "cap-red" }),
  tas: () => ({ main: createStoolGeometry(), cushion: null, color: "bottle-green" }),
  biik: () => ({ main: createBarStoolGeometry(), cushion: null, color: "cap-blue" }),
  qum: () => ({ main: createLoungeGeometry(), cushion: createLoungeCushion(), color: "sand" }),
  kol: () => ({ main: createTableGeometry(), cushion: null, color: "sand" }),
  saule: () => ({ main: createLampGeometry(), cushion: null, color: "cap-blue", translucent: true }),
  japyraq: () => ({ main: createPlanterGeometry(), cushion: null, color: "bottle-green" }),
  saiabaq: () => ({ main: createBenchGeometry(), cushion: null, color: "cap-red" }),
  ornek: () => ({ main: createScreenGeometry(), cushion: null, color: "sand" }),
  uya: () => ({ main: createShelfGeometry(), cushion: null, color: "sun" }),
}

const cache = new Map<CatalogModelId, ModelParts>()

export function getModelParts(id: CatalogModelId): ModelParts {
  const cached = cache.get(id)

  if (cached) {
    return cached
  }

  const built = builders[id]()
  const box = built.main.boundingBox

  if (!box) {
    throw new Error(`Model ${id} has no bounds`)
  }

  const parts: ModelParts = {
    main: built.main,
    cushion: built.cushion,
    size: box.getSize(new Vector3()),
    color: built.color ?? "cap-red",
    translucent: built.translucent ?? false,
  }

  cache.set(id, parts)

  return parts
}
