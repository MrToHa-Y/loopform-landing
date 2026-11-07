import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import { CanvasTexture, MathUtils } from "three"
import type { Mesh, MeshBasicMaterial } from "three"
import { shadowDirective } from "@/three/directives"
import { paletteColor } from "@/three/palette"

function createBlobTexture() {
  const size = 256
  const canvas = document.createElement("canvas")

  canvas.width = size
  canvas.height = size

  const context = canvas.getContext("2d")

  if (context) {
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)

    const ink = `#${paletteColor("ink").getHexString()}`

    gradient.addColorStop(0, `${ink}bf`)
    gradient.addColorStop(0.55, `${ink}4d`)
    gradient.addColorStop(1, `${ink}00`)
    context.fillStyle = gradient
    context.fillRect(0, 0, size, size)
  }

  return new CanvasTexture(canvas)
}

export function GroundShadow() {
  const meshRef = useRef<Mesh>(null)
  const texture = useMemo(createBlobTexture, [])

  useFrame((_, delta) => {
    const mesh = meshRef.current

    if (!mesh) {
      return
    }

    const material = mesh.material as MeshBasicMaterial

    material.opacity = MathUtils.damp(material.opacity, shadowDirective.visible ? shadowDirective.opacity : 0, 8, delta)
    mesh.visible = material.opacity > 0.01
    mesh.position.x = MathUtils.damp(mesh.position.x, shadowDirective.position.x, 8, delta)
    mesh.position.y = MathUtils.damp(mesh.position.y, shadowDirective.position.y, 8, delta)
    mesh.position.z = shadowDirective.position.z
    mesh.scale.set(shadowDirective.width, shadowDirective.width * 0.28, 1)
  })

  return (
    <mesh ref={meshRef} visible={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent opacity={0} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}
