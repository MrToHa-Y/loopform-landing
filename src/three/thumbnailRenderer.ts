import {
  ACESFilmicToneMapping,
  AmbientLight,
  Box3,
  DirectionalLight,
  Group,
  Mesh,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three"
import { ru } from "@/content/ru"
import type { CatalogModelId } from "@/content/types"
import { thumbnails, useScrollStore } from "@/state/scrollStore"
import { createPrintMaterial } from "@/three/materials/printMaterial"
import { getModelParts } from "@/three/models/modelLibrary"
import { paletteColor, speckleColors } from "@/three/palette"

const width = 620
const height = 720

function nextIdle() {
  return new Promise<void>((resolve) => {
    const idle = window.requestIdleCallback as typeof window.requestIdleCallback | undefined

    if (idle) {
      idle(() => resolve(), { timeout: 1200 })
      return
    }

    window.setTimeout(resolve, 60)
  })
}

function toObjectUrl(canvas: HTMLCanvasElement) {
  return new Promise<string>((resolve) => {
    canvas.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : ""), "image/webp", 0.86)
  })
}

export async function renderThumbnails() {
  const slugs = ru.catalog.items.map((item) => item.slug).filter((slug): slug is CatalogModelId => slug !== null)
  const renderer = new WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })

  renderer.setSize(width, height, false)
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05

  const scene = new Scene()
  const camera = new PerspectiveCamera(22, width / height, 0.1, 40)
  const key = new DirectionalLight(paletteColor("bone"), 2.6)

  scene.background = paletteColor("paper")
  key.position.set(-3, 5, 5)
  scene.add(key, new AmbientLight(paletteColor("bone"), 1.3))

  for (const slug of slugs) {
    await nextIdle()

    const parts = getModelParts(slug)
    const bundle = createPrintMaterial({
      color: paletteColor(parts.color),
      speckle: speckleColors(parts.color),
      edgeColor: paletteColor("nozzle"),
    })

    bundle.uniforms.uMaxY.value = parts.size.y
    bundle.uniforms.uLayerHeight.value = 0.008

    const group = new Group()

    group.add(new Mesh(parts.main, bundle.material))

    if (parts.cushion && slug === "qum") {
      group.add(new Mesh(parts.cushion, bundle.material))
    }

    group.rotation.y = -0.5
    scene.add(group)

    const box = new Box3().setFromObject(group)
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    const distance = Math.max(size.y, size.x * (height / width)) / (2 * Math.tan((22 * Math.PI) / 360)) * 1.5

    camera.position.set(center.x, center.y + size.y * 0.16, center.z + distance)
    camera.lookAt(center)
    renderer.render(scene, camera)

    thumbnails.set(slug, await toObjectUrl(renderer.domElement))
    scene.remove(group)
    bundle.material.dispose()
    bundle.depthMaterial.dispose()
    useScrollStore.setState((state) => ({ thumbnailsVersion: state.thumbnailsVersion + 1 }))
  }

  renderer.dispose()
  renderer.forceContextLoss()
}
