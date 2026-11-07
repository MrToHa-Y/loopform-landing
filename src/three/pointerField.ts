const velocityLimit = 2400

export const pointerField = {
  x: -9999,
  y: -9999,
  velocityX: 0,
  velocityY: 0,
  presence: 0,
  pulse: 0,
}

let lastTime = 0

function write(x: number, y: number) {
  const now = performance.now()
  const elapsed = Math.max((now - lastTime) / 1000, 0.008)

  if (pointerField.presence > 0 && lastTime > 0) {
    const clamp = (value: number) => Math.max(-velocityLimit, Math.min(velocityLimit, value))

    pointerField.velocityX = clamp((x - pointerField.x) / elapsed)
    pointerField.velocityY = clamp((y - pointerField.y) / elapsed)
  }

  pointerField.x = x
  pointerField.y = y
  pointerField.presence = 1
  lastTime = now
}

function handlePointerMove(event: PointerEvent) {
  if (event.pointerType === "mouse") {
    write(event.clientX, event.clientY)
  }
}

function handleTouch(event: TouchEvent) {
  const touch = event.touches[0]

  if (touch) {
    write(touch.clientX, touch.clientY)
  }
}

function handleTouchStart(event: TouchEvent) {
  pointerField.presence = 0
  handleTouch(event)
  pointerField.pulse = 1
}

function handleTouchEnd(event: TouchEvent) {
  if (event.touches.length === 0) {
    pointerField.presence = 0
    pointerField.velocityX = 0
    pointerField.velocityY = 0
  }
}

function handleLeave() {
  pointerField.presence = 0
}

export function attachPointerField() {
  const passive = { passive: true }

  window.addEventListener("pointermove", handlePointerMove, passive)
  window.addEventListener("touchstart", handleTouchStart, passive)
  window.addEventListener("touchmove", handleTouch, passive)
  window.addEventListener("touchend", handleTouchEnd, passive)
  window.addEventListener("touchcancel", handleTouchEnd, passive)
  document.documentElement.addEventListener("mouseleave", handleLeave)

  return () => {
    window.removeEventListener("pointermove", handlePointerMove)
    window.removeEventListener("touchstart", handleTouchStart)
    window.removeEventListener("touchmove", handleTouch)
    window.removeEventListener("touchend", handleTouchEnd)
    window.removeEventListener("touchcancel", handleTouchEnd)
    document.documentElement.removeEventListener("mouseleave", handleLeave)
  }
}
