import { useFrame } from "@react-three/fiber"
import { readProgress, useScrollStore } from "@/state/scrollStore"
import { runChoreography } from "@/three/choreography"

interface DirectorProps {
  canvasRef: { current: HTMLElement | null }
}

export function Director({ canvasRef }: DirectorProps) {
  useFrame((state) => {
    runChoreography({
      width: state.size.width,
      height: state.size.height,
      time: state.clock.elapsedTime,
    })

    const canvas = canvasRef.current

    if (canvas) {
      const { reducedMotion } = useScrollStore.getState()
      const introOut = reducedMotion ? 1 : readProgress("introOut")
      canvas.style.clipPath = introOut < 1 ? `inset(${(1 - introOut) * 100}% 0 0 0)` : "none"
    }
  }, -1)

  return null
}
