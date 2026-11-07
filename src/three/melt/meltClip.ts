import { meltDirective } from "@/three/directives"

export function writeClip(target: { x: number; y: number }, height: number, dpr: number) {
  target.x = (height - meltDirective.clipTop) * dpr
  target.y = (height - meltDirective.clipBottom) * dpr
}
