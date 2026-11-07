export const cameraDistance = 12
export const cameraFov = 28

export const worldHeight = 2 * cameraDistance * Math.tan(((cameraFov / 2) * Math.PI) / 180)

export interface WorldRect {
  x: number
  y: number
  width: number
  height: number
  top: number
  bottom: number
}

const elements = new Map<string, HTMLElement>()

function findAnchor(name: string) {
  const cached = elements.get(name)

  if (cached?.isConnected) {
    return cached
  }

  const element = document.querySelector<HTMLElement>(`[data-anchor="${name}"]`)

  if (element) {
    elements.set(name, element)
  }

  return element
}

export function pixelsToWorld(viewportHeight: number) {
  return worldHeight / viewportHeight
}

export function domRectToWorld(rect: DOMRect | { left: number; top: number; width: number; height: number }, viewportWidth: number, viewportHeight: number): WorldRect {
  const unit = pixelsToWorld(viewportHeight)

  return {
    x: (rect.left + rect.width / 2 - viewportWidth / 2) * unit,
    y: -(rect.top + rect.height / 2 - viewportHeight / 2) * unit,
    width: rect.width * unit,
    height: rect.height * unit,
    top: rect.top,
    bottom: rect.top + rect.height,
  }
}

export function readAnchor(name: string, viewportWidth: number, viewportHeight: number, stuck = false): WorldRect | null {
  const element = findAnchor(name)

  if (!element) {
    return null
  }

  const rect = element.getBoundingClientRect()

  if (!stuck) {
    return domRectToWorld(rect, viewportWidth, viewportHeight)
  }

  const sticky = element.closest<HTMLElement>("[data-sticky]")
  const offset = sticky ? sticky.getBoundingClientRect().top : 0

  return domRectToWorld(
    { left: rect.left, top: rect.top - offset, width: rect.width, height: rect.height },
    viewportWidth,
    viewportHeight,
  )
}

export function mixRects(from: WorldRect, to: WorldRect, amount: number): WorldRect {
  const mix = (a: number, b: number) => a + (b - a) * amount

  return {
    x: mix(from.x, to.x),
    y: mix(from.y, to.y),
    width: mix(from.width, to.width),
    height: mix(from.height, to.height),
    top: mix(from.top, to.top),
    bottom: mix(from.bottom, to.bottom),
  }
}
