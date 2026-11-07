import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import { CanvasTexture, DoubleSide, PlaneGeometry, SRGBColorSpace, ShaderMaterial, TextureLoader, Vector2 } from "three"
import type { Group, Mesh, Texture } from "three"
import { meltPhotos } from "@/content/images"
import { ru } from "@/content/ru"
import { useScrollStore } from "@/state/scrollStore"
import { cameraDistance } from "@/three/anchors"
import { meltDirective } from "@/three/directives"
import { writeClip } from "@/three/melt/meltClip"
import fragmentShader from "@/three/melt/meltCard.frag.glsl?raw"
import vertexShader from "@/three/melt/meltCard.vert.glsl?raw"
import { paletteColor } from "@/three/palette"
import { pointerField } from "@/three/pointerField"
import { createRandom } from "@/three/random"

interface Card {
  material: ShaderMaterial
  width: number
  height: number
  x: number
  y: number
  delay: number
  span: number
  tilt: number
  sway: number
  label: boolean
}

const startDepth = -1.4
const travelDepth = 13.2
const fadeStart = 8.6

function createMaterial(width: number, height: number, radius: number, map: Texture | null, cover: boolean) {
  const aspect = width / height
  const crop = aspect >= 1 ? new Vector2(1, 1 / aspect) : new Vector2(aspect, 1)

  return new ShaderMaterial({
    uniforms: {
      uMap: { value: map },
      uOpacity: { value: 0 },
      uRadius: { value: radius },
      uSize: { value: new Vector2(width, height) },
      uCrop: { value: cover ? crop : new Vector2(1, 1) },
      uClip: { value: new Vector2(99999, -1) },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    toneMapped: false,
  })
}

function createLabelTexture(text: string) {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")
  const fontSize = 72

  canvas.height = 112

  if (!context) {
    return { texture: new CanvasTexture(canvas), aspect: 1 }
  }

  const font = `600 ${fontSize}px Unbounded, Arial, sans-serif`

  context.font = font
  canvas.width = Math.ceil(context.measureText(text).width) + 16
  context.font = font
  context.fillStyle = `#${paletteColor("bone").getHexString()}`
  context.textBaseline = "middle"
  context.fillText(text, 8, canvas.height / 2)

  const texture = new CanvasTexture(canvas)

  texture.colorSpace = SRGBColorSpace

  return { texture, aspect: canvas.width / canvas.height }
}

export function MeltCards() {
  const compact = useScrollStore((state) => state.compact)
  const groupRef = useRef<Group>(null)
  const plane = useMemo(() => new PlaneGeometry(1, 1), [])

  const cards = useMemo(() => {
    const random = createRandom(83)
    const loader = new TextureLoader()
    const list: Card[] = []
    const photos = meltPhotos.flatMap((path, index) => (index < 6 ? [path, path] : [path]))
    const total = photos.length + ru.melt.labels.length

    photos.forEach((path, index) => {
      const angle = (index / photos.length) * Math.PI * 2 + random() * 0.5
      const distance = 1.1 + random() * 1.9
      const width = 0.75 + random() * 0.85
      const height = width * (0.68 + random() * 0.3)
      const texture = loader.load(path)

      texture.colorSpace = SRGBColorSpace
      list.push({
        material: createMaterial(width, height, 0.045, texture, true),
        width,
        height,
        x: Math.cos(angle) * distance * 1.35,
        y: Math.sin(angle) * distance * 0.8,
        delay: (index / total) * 0.62 + random() * 0.04,
        span: 0.34 + random() * 0.08,
        tilt: (random() * 2 - 1) * 0.16,
        sway: random() * 6.28,
        label: false,
      })
    })

    ru.melt.labels.forEach((text, index) => {
      const { texture, aspect } = createLabelTexture(text)
      const height = 0.2
      const width = height * aspect
      const side = index % 2 === 0 ? 1 : -1

      list.push({
        material: createMaterial(width, height, 0, texture, false),
        width,
        height,
        x: side * (0.9 + random() * 1.5),
        y: (random() * 2 - 1) * 1.7,
        delay: 0.04 + (index / ru.melt.labels.length) * 0.56,
        span: 0.36,
        tilt: 0,
        sway: random() * 6.28,
        label: true,
      })
    })

    return list
  }, [])

  useEffect(
    () => () => {
      cards.forEach((card) => {
        card.material.dispose()
      })
    },
    [cards],
  )

  useFrame((state) => {
    const group = groupRef.current

    if (!group) {
      return
    }

    group.visible = meltDirective.visible && meltDirective.flow > 0

    if (!group.visible) {
      return
    }

    const { size, viewport } = state
    const time = state.clock.elapsedTime
    const spread = Math.min(1, meltDirective.worldWidth / 8)
    const parallaxX = pointerField.presence > 0 ? (pointerField.x / size.width - 0.5) * 2 : 0
    const parallaxY = pointerField.presence > 0 ? (pointerField.y / size.height - 0.5) * 2 : 0

    cards.forEach((card, index) => {
      const mesh = group.children[index] as Mesh | undefined
      const uniforms = card.material.uniforms
      const opacity = uniforms.uOpacity
      const clip = uniforms.uClip?.value as Vector2

      if (!mesh || !opacity) {
        return
      }

      const local = (meltDirective.flow - card.delay) / card.span

      mesh.visible = local > 0 && local < 1

      if (!mesh.visible) {
        return
      }

      const eased = local * local
      const z = startDepth + eased * travelDepth
      const open = Math.min(1, local * 2.4)
      const depthGain = (z + 2) / cameraDistance

      mesh.position.set(
        meltDirective.x + card.x * spread * open - parallaxX * depthGain * 0.5,
        meltDirective.y + card.y * open + parallaxY * depthGain * 0.5,
        z,
      )
      mesh.rotation.set(
        Math.sin(time * 0.5 + card.sway) * 0.05 + parallaxY * 0.08,
        Math.cos(time * 0.4 + card.sway) * 0.06 + parallaxX * 0.1,
        card.tilt,
      )
      mesh.scale.set(card.width * (compact ? 0.8 : 1), card.height * (compact ? 0.8 : 1), 1)
      opacity.value = Math.min(1, local * 9) * Math.max(0, Math.min(1, (cameraDistance - 1.2 - z) / (cameraDistance - 1.2 - fadeStart)))
      writeClip(clip, size.height, viewport.dpr)
    })
  })

  return (
    <group ref={groupRef} visible={false}>
      {cards.map((card, index) => (
        <mesh key={index} geometry={plane} material={card.material} visible={false} frustumCulled={false} renderOrder={card.label ? 3 : 2} />
      ))}
    </group>
  )
}
