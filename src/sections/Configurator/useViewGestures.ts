import { useRef } from "react"
import type { PointerEvent } from "react"
import { configuratorView } from "@/state/scrollStore"
import { worldHeight } from "@/three/anchors"

const yawSensitivity = 0.5
const pitchSensitivity = 0.32
const pitchLimit = 55
const zoomMin = 0.6
const zoomMax = 1.35
const panLimit = 0.9

interface Point {
  x: number
  y: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function measure(points: Point[]) {
  const [first, second] = points

  if (!first || !second) {
    return { x: 0, y: 0, distance: 1 }
  }

  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
    distance: Math.max(Math.hypot(first.x - second.x, first.y - second.y), 1),
  }
}

export function useViewGestures(onChange: () => void) {
  const pointers = useRef(new Map<number, Point>())
  const pinch = useRef({ x: 0, y: 0, distance: 1 })

  const pan = (deltaX: number, deltaY: number) => {
    const unit = worldHeight / window.innerHeight

    configuratorView.x = clamp(configuratorView.x + deltaX * unit, -panLimit, panLimit)
    configuratorView.y = clamp(configuratorView.y - deltaY * unit, -panLimit, panLimit)
  }

  const handleDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointers.current.size === 2) {
      pinch.current = measure([...pointers.current.values()])
    }
  }

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(event.pointerId)

    if (!previous) {
      return
    }

    const deltaX = event.clientX - previous.x
    const deltaY = event.clientY - previous.y

    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointers.current.size >= 2) {
      const next = measure([...pointers.current.values()])

      pan(next.x - pinch.current.x, next.y - pinch.current.y)
      configuratorView.zoom = clamp((configuratorView.zoom * next.distance) / pinch.current.distance, zoomMin, zoomMax)
      pinch.current = next
    } else if (event.shiftKey || event.buttons === 2) {
      pan(deltaX, deltaY)
    } else {
      configuratorView.yaw += deltaX * yawSensitivity
      configuratorView.pitch = clamp(configuratorView.pitch + deltaY * pitchSensitivity, -pitchLimit, pitchLimit)
    }

    onChange()
  }

  const handleUp = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId)

    if (pointers.current.size === 2) {
      pinch.current = measure([...pointers.current.values()])
    }
  }

  return {
    onPointerDown: handleDown,
    onPointerMove: handleMove,
    onPointerUp: handleUp,
    onPointerCancel: handleUp,
    onContextMenu: (event: { preventDefault: () => void }) => event.preventDefault(),
  }
}
