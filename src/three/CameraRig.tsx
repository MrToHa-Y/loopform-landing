import { useFrame } from "@react-three/fiber"
import { MathUtils } from "three"
import { useScrollStore } from "@/state/scrollStore"
import { cameraDistance } from "@/three/anchors"

const parallax = 0.14

export function CameraRig() {
  useFrame((state, delta) => {
    const { reducedMotion, compact } = useScrollStore.getState()
    const amount = reducedMotion || compact ? 0 : parallax
    const { camera, pointer } = state

    camera.position.x = MathUtils.damp(camera.position.x, pointer.x * amount, 3, delta)
    camera.position.y = MathUtils.damp(camera.position.y, pointer.y * amount, 3, delta)
    camera.position.z = cameraDistance
    camera.lookAt(0, 0, 0)
  })

  return null
}
