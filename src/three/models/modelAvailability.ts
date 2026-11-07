import type { BufferGeometry, Mesh } from "three"
import type { CatalogModelId } from "@/content/types"

export const capModel: { geometry: BufferGeometry | null } = { geometry: null }

export const availableModels = new Map<CatalogModelId, string>()

const candidates: CatalogModelId[] = ["tolqyn", "tas", "qum", "saule"]

export async function detectModels() {
  await Promise.all(
    candidates.map(async (id) => {
      const path = `/models/${id}.glb`

      try {
        const response = await fetch(path, { method: "HEAD" })
        const type = response.headers.get("content-type") ?? ""

        if (response.ok && !type.includes("text/html")) {
          availableModels.set(id, path)
        }
      } catch {
        availableModels.delete(id)
      }
    }),
  )
}

export async function loadCapModel() {
  const path = "/models/cap.glb"

  try {
    const response = await fetch(path, { method: "HEAD" })
    const type = response.headers.get("content-type") ?? ""

    if (!response.ok || type.includes("text/html")) {
      return
    }

    const [{ GLTFLoader }, { DRACOLoader }] = await Promise.all([
      import("three/examples/jsm/loaders/GLTFLoader.js"),
      import("three/examples/jsm/loaders/DRACOLoader.js"),
    ])
    const loader = new GLTFLoader()
    const draco = new DRACOLoader()

    draco.setDecoderPath("/draco/")
    loader.setDRACOLoader(draco)

    const gltf = await loader.loadAsync(path)

    gltf.scene.traverse((object) => {
      const mesh = object as Mesh

      if (mesh.isMesh && !capModel.geometry) {
        const geometry = mesh.geometry.clone()

        geometry.center()
        geometry.computeBoundingSphere()

        const radius = geometry.boundingSphere?.radius ?? 1

        geometry.scale(1 / radius, 1 / radius, 1 / radius)
        capModel.geometry = geometry
      }
    })
  } catch {
    capModel.geometry = null
  }
}
