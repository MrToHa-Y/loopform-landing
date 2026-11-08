import { ACESFilmicToneMapping, AmbientLight, Box3, DirectionalLight, Group, Mesh, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from "three"
import { productPhotos } from "@/content/images"
import { ru } from "@/content/ru"
import type { CatalogModelId } from "@/content/types"
import { productViews, thumbnails, useScrollStore } from "@/state/scrollStore"
import { getModelParts } from "@/three/models/modelLibrary"
import { createBodyBundle, createFeltBundle, createOakBundle } from "@/three/models/modelMaterials"
import { paletteColor } from "@/three/palette"

const thumbnailSize = { width: 720, height: 720 }
const viewSize = { width: 600, height: 750 }
const quietMs = 10
const patienceMs = 30000
const viewTurns = [75, 180, -75]
const viewTilt = 6
const fov = 22
const degrees = Math.PI / 180

let viewsStarted = false

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

function nextQuiet() {
  return new Promise<void>((resolve) => {
    const idle = window.requestIdleCallback as typeof window.requestIdleCallback | undefined
    const started = performance.now()

    if (!idle) {
      window.setTimeout(resolve, 120)
      return
    }

    const wait = () =>
      idle((deadline) => {
        if (deadline.timeRemaining() >= quietMs || performance.now() - started > patienceMs) {
          resolve()
        } else {
          wait()
        }
      })

    wait()
  })
}

function toObjectUrl(canvas: HTMLCanvasElement) {
  return new Promise<string>((resolve) => {
    canvas.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : ""), "image/webp", 0.86)
  })
}

function catalogSlugs() {
  return ru.catalog.items.map((item) => item.slug).filter((slug): slug is CatalogModelId => slug !== null)
}

function createStudio(width: number, height: number) {
  const renderer = new WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  const scene = new Scene()
  const camera = new PerspectiveCamera(fov, width / height, 0.1, 40)
  const key = new DirectionalLight(paletteColor("bone"), 2.6)

  renderer.setSize(width, height, false)
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  scene.background = paletteColor("studio")
  key.position.set(-3, 5, 5)
  scene.add(key, new AmbientLight(paletteColor("bone"), 1.3))

  const shoot = async (slug: CatalogModelId, yaw: number, pitch: number) => {
    const parts = getModelParts(slug)
    const body = createBodyBundle(parts)
    const bundles = [body]
    const group = new Group()

    body.uniforms.uMaxY.value = parts.size.y
    group.add(new Mesh(parts.main, body.material))

    if (parts.cushion && slug === "qum") {
      const felt = createFeltBundle()

      bundles.push(felt)
      group.add(new Mesh(parts.cushion, felt.material))
    }

    if (parts.top) {
      const oak = createOakBundle()

      bundles.push(oak)
      group.add(new Mesh(parts.top, oak.material))
    }

    group.rotation.set(pitch * degrees, yaw * degrees, 0)
    scene.add(group)

    const box = new Box3().setFromObject(group)
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    const distance = (Math.max(size.y, size.x * (height / width)) / (2 * Math.tan((fov * degrees) / 2))) * 1.5

    camera.position.set(center.x, center.y + size.y * 0.12, center.z + distance)
    camera.lookAt(center)
    renderer.render(scene, camera)

    const url = await toObjectUrl(renderer.domElement)

    scene.remove(group)
    bundles.forEach((bundle) => {
      bundle.material.dispose()
      bundle.depthMaterial.dispose()
    })

    return url
  }

  const close = () => {
    renderer.dispose()
    renderer.forceContextLoss()
  }

  return { shoot, close }
}

export async function renderThumbnails() {
  const slugs = catalogSlugs().filter((slug) => !productPhotos[slug])

  if (slugs.length === 0) {
    return
  }

  const studio = createStudio(thumbnailSize.width, thumbnailSize.height)

  for (const slug of slugs) {
    await nextIdle()

    const look = getModelParts(slug).look

    thumbnails.set(slug, await studio.shoot(slug, look.displayYaw, look.displayPitch))
    useScrollStore.setState((state) => ({ thumbnailsVersion: state.thumbnailsVersion + 1 }))
  }

  studio.close()
}

export async function renderProductViews() {
  if (viewsStarted) {
    return
  }

  viewsStarted = true

  const studio = createStudio(viewSize.width, viewSize.height)

  for (const slug of catalogSlugs()) {
    const look = getModelParts(slug).look
    const views: string[] = []

    for (const turn of viewTurns) {
      await nextQuiet()
      views.push(await studio.shoot(slug, look.displayYaw + turn, look.displayPitch + viewTilt))
    }

    productViews.set(slug, views)
    useScrollStore.setState((state) => ({ thumbnailsVersion: state.thumbnailsVersion + 1 }))
  }

  studio.close()
}
