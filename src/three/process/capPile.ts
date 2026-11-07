export const capRadius = 0.023

const gravity = 2.6
const substeps = 2
const iterations = 4
const diameter = capRadius * 2
const cellSize = diameter * 1.05
const pairFriction = 0.44
const floorFriction = 0.72
const restitution = 0.3
const bounceSpeed = 0.28
const airDrag = 0.999
const sleepSpeed = 0.02
const sleepSteps = 40
const wakeSpeed = 0.3
const fastRate = 34
const steadyRate = 15
const warmShare = 0.3
const pourSpread = 0.075
const pourSweep = 0.13
const pourSpeed = 0.55
const holdSeconds = 1.8
const drainSeconds = 1.1
const fillShare = 0.56
const wallStagger = capRadius * 0.85
const wallLean = 0.1
const pointerReach = 0.15
const pointerPush = 5.5
const pointerDrag = 0.5

export type PilePhase = "pour" | "hold" | "drain"

export interface PilePointer {
  x: number
  y: number
  velocityX: number
  velocityY: number
}

export function createCapPile(capacity: number, random: () => number) {
  const x = new Float32Array(capacity)
  const y = new Float32Array(capacity)
  const previousX = new Float32Array(capacity)
  const previousY = new Float32Array(capacity)
  const velocityX = new Float32Array(capacity)
  const velocityY = new Float32Array(capacity)
  const spin = new Float32Array(capacity)
  const spinSpeed = new Float32Array(capacity)
  const tumble = new Float32Array(capacity)
  const tumbleSpeed = new Float32Array(capacity)
  const alive = new Uint8Array(capacity)
  const asleep = new Uint8Array(capacity)
  const touched = new Uint8Array(capacity)
  const stillSteps = new Uint16Array(capacity)
  const wallGap = Float32Array.from({ length: capacity }, () => random() * wallStagger)
  const next = new Int32Array(capacity)
  const contactA = new Int32Array(capacity * 6)
  const contactB = new Int32Array(capacity * 6)
  const contactX = new Float32Array(capacity * 6)
  const contactY = new Float32Array(capacity * 6)
  const contactSpeed = new Float32Array(capacity * 6)

  let head = new Int32Array(1)
  let columns = 1
  let rows = 1
  let width = 1
  let height = 1
  let limit = capacity
  let contacts = 0
  let spawned = 0
  let phase: PilePhase = "pour"
  let phaseTime = 0
  let clock = 0
  let spawnDebt = 0
  let gap = 0

  const wake = (index: number) => {
    asleep[index] = 0
    stillSteps[index] = 0
  }

  const clear = () => {
    alive.fill(0)
    asleep.fill(0)
    spawned = 0
    spawnDebt = 0
    phase = "pour"
    phaseTime = 0
    gap = 0
  }

  const resize = (nextWidth: number, nextHeight: number, maxCaps: number) => {
    if (Math.abs(nextWidth - width) < 0.001 && Math.abs(nextHeight - height) < 0.001 && limit <= maxCaps) {
      return
    }

    width = nextWidth
    height = nextHeight
    limit = Math.min(capacity, maxCaps, Math.floor((width * height * fillShare) / (Math.PI * capRadius * capRadius)))
    columns = Math.ceil(width / cellSize) + 3
    rows = Math.ceil((height + 1) / cellSize) + 3
    head = new Int32Array(columns * rows)
    clear()
  }

  const spawn = () => {
    const index = alive.indexOf(0)

    if (index < 0) {
      return
    }

    const center = Math.sin(clock * 0.55) * width * pourSweep

    x[index] = center + (random() - 0.5) * pourSpread * 2
    y[index] = height + capRadius * 2 + random() * 0.45
    velocityX[index] = (random() - 0.5) * 0.3
    velocityY[index] = -pourSpeed
    spinSpeed[index] = (random() - 0.5) * 12
    tumbleSpeed[index] = (random() - 0.5) * 9
    alive[index] = 1
    wake(index)
    spawned += 1
  }

  const pour = (delta: number) => {
    const rate = spawned < limit * warmShare ? fastRate : steadyRate

    spawnDebt += rate * delta

    while (spawnDebt >= 1 && spawned < limit) {
      spawn()
      spawnDebt -= 1
    }

    if (spawned >= limit) {
      phase = "hold"
      phaseTime = 0
    }
  }

  const cellOf = (px: number, py: number) => {
    const column = Math.min(columns - 1, Math.max(0, Math.floor((px + width / 2) / cellSize) + 1))
    const row = Math.min(rows - 1, Math.max(0, Math.floor((py + 0.4) / cellSize) + 1))

    return row * columns + column
  }

  const fillGrid = () => {
    head.fill(-1)

    for (let index = 0; index < capacity; index += 1) {
      if (alive[index]) {
        const cell = cellOf(x[index] ?? 0, y[index] ?? 0)

        next[index] = head[cell] ?? -1
        head[cell] = index
      }
    }
  }

  const solvePair = (a: number, b: number, record: boolean) => {
    const dx = (x[a] ?? 0) - (x[b] ?? 0)
    const dy = (y[a] ?? 0) - (y[b] ?? 0)
    const squared = dx * dx + dy * dy

    if (squared >= diameter * diameter || squared < 1e-10) {
      return
    }

    if (asleep[a] && asleep[b]) {
      return
    }

    const distance = Math.sqrt(squared)
    const normalX = dx / distance
    const normalY = dy / distance
    const overlap = diameter - distance

    if (asleep[a] && Math.hypot(velocityX[b] ?? 0, velocityY[b] ?? 0) > wakeSpeed) {
      wake(a)
    }

    if (asleep[b] && Math.hypot(velocityX[a] ?? 0, velocityY[a] ?? 0) > wakeSpeed) {
      wake(b)
    }

    const weightA = asleep[a] ? 0 : 1
    const weightB = asleep[b] ? 0 : 1
    const total = weightA + weightB

    if (total === 0) {
      return
    }

    touched[a] = 1
    touched[b] = 1

    if (record && contacts < contactA.length) {
      contactA[contacts] = a
      contactB[contacts] = b
      contactX[contacts] = normalX
      contactY[contacts] = normalY
      contactSpeed[contacts] =
        ((velocityX[a] ?? 0) - (velocityX[b] ?? 0)) * normalX + ((velocityY[a] ?? 0) - (velocityY[b] ?? 0)) * normalY
      contacts += 1
    }

    const shareA = weightA / total
    const shareB = weightB / total

    x[a] = (x[a] ?? 0) + normalX * overlap * shareA
    y[a] = (y[a] ?? 0) + normalY * overlap * shareA
    x[b] = (x[b] ?? 0) - normalX * overlap * shareB
    y[b] = (y[b] ?? 0) - normalY * overlap * shareB

    const slideX = (x[a] ?? 0) - (previousX[a] ?? 0) - ((x[b] ?? 0) - (previousX[b] ?? 0))
    const slideY = (y[a] ?? 0) - (previousY[a] ?? 0) - ((y[b] ?? 0) - (previousY[b] ?? 0))
    const slide = slideX * -normalY + slideY * normalX
    const held = Math.max(-overlap * pairFriction, Math.min(overlap * pairFriction, slide))

    x[a] = (x[a] ?? 0) + normalY * held * shareA
    y[a] = (y[a] ?? 0) - normalX * held * shareA
    x[b] = (x[b] ?? 0) - normalY * held * shareB
    y[b] = (y[b] ?? 0) + normalX * held * shareB
  }

  const solveWalls = (index: number) => {
    const px = x[index] ?? 0
    const py = y[index] ?? 0
    const side = width / 2 - capRadius - (wallGap[index] ?? 0) - Math.max(py, 0) * wallLean

    if (px < -side) {
      x[index] = -side
      touched[index] = 1
    } else if (px > side) {
      x[index] = side
      touched[index] = 1
    }

    if (py < capRadius && Math.abs(px) >= gap) {
      y[index] = capRadius
      x[index] = (x[index] ?? 0) - ((x[index] ?? 0) - (previousX[index] ?? 0)) * floorFriction
      touched[index] = 1
    }
  }

  const solveCell = (cell: number, record: boolean) => {
    for (let a = head[cell] ?? -1; a >= 0; a = next[a] ?? -1) {
      for (let b = next[a] ?? -1; b >= 0; b = next[b] ?? -1) {
        solvePair(a, b, record)
      }

      for (const offset of [1, columns - 1, columns, columns + 1]) {
        const other = cell + offset

        if (other < head.length) {
          for (let b = head[other] ?? -1; b >= 0; b = next[b] ?? -1) {
            solvePair(a, b, record)
          }
        }
      }
    }
  }

  const applyBounce = () => {
    for (let contact = 0; contact < contacts; contact += 1) {
      const speed = contactSpeed[contact] ?? 0

      if (speed > -bounceSpeed) {
        continue
      }

      const a = contactA[contact] ?? 0
      const b = contactB[contact] ?? 0
      const weightA = asleep[a] ? 0 : 1
      const weightB = asleep[b] ? 0 : 1
      const total = weightA + weightB

      if (total === 0) {
        continue
      }

      const normalX = contactX[contact] ?? 0
      const normalY = contactY[contact] ?? 0
      const current = ((velocityX[a] ?? 0) - (velocityX[b] ?? 0)) * normalX + ((velocityY[a] ?? 0) - (velocityY[b] ?? 0)) * normalY
      const impulse = (-restitution * speed - current) / total

      velocityX[a] = (velocityX[a] ?? 0) + normalX * impulse * weightA
      velocityY[a] = (velocityY[a] ?? 0) + normalY * impulse * weightA
      velocityX[b] = (velocityX[b] ?? 0) - normalX * impulse * weightB
      velocityY[b] = (velocityY[b] ?? 0) - normalY * impulse * weightB
      tumbleSpeed[a] = (tumbleSpeed[a] ?? 0) + speed * (random() - 0.5) * 14
      tumbleSpeed[b] = (tumbleSpeed[b] ?? 0) + speed * (random() - 0.5) * 14
    }
  }

  const stir = (pointer: PilePointer, delta: number) => {
    for (let index = 0; index < capacity; index += 1) {
      if (!alive[index]) {
        continue
      }

      const dx = (x[index] ?? 0) - pointer.x
      const dy = (y[index] ?? 0) - pointer.y
      const distance = Math.hypot(dx, dy)

      if (distance > pointerReach || distance < 1e-5) {
        continue
      }

      const force = 1 - distance / pointerReach

      wake(index)
      velocityX[index] = (velocityX[index] ?? 0) + ((dx / distance) * pointerPush * force + pointer.velocityX * pointerDrag * force) * delta * 8
      velocityY[index] = (velocityY[index] ?? 0) + ((dy / distance) * pointerPush * force + pointer.velocityY * pointerDrag * force) * delta * 8
    }
  }

  const substep = (delta: number) => {
    for (let index = 0; index < capacity; index += 1) {
      touched[index] = 0

      if (!alive[index] || asleep[index]) {
        continue
      }

      velocityY[index] = (velocityY[index] ?? 0) - gravity * delta
      velocityX[index] = (velocityX[index] ?? 0) * airDrag
      previousX[index] = x[index] ?? 0
      previousY[index] = y[index] ?? 0
      x[index] = (x[index] ?? 0) + (velocityX[index] ?? 0) * delta
      y[index] = (y[index] ?? 0) + (velocityY[index] ?? 0) * delta
    }

    fillGrid()
    contacts = 0

    for (let pass = 0; pass < iterations; pass += 1) {
      for (let cell = 0; cell < head.length; cell += 1) {
        solveCell(cell, pass === 0)
      }

      for (let index = 0; index < capacity; index += 1) {
        if (alive[index] && !asleep[index]) {
          solveWalls(index)
        }
      }
    }

    for (let index = 0; index < capacity; index += 1) {
      if (!alive[index] || asleep[index]) {
        continue
      }

      const incoming = velocityY[index] ?? 0

      velocityX[index] = ((x[index] ?? 0) - (previousX[index] ?? 0)) / delta
      velocityY[index] = ((y[index] ?? 0) - (previousY[index] ?? 0)) / delta

      if ((y[index] ?? 0) <= capRadius + 1e-4 && incoming < -bounceSpeed && Math.abs(x[index] ?? 0) >= gap) {
        velocityY[index] = -incoming * restitution
      }
    }

    applyBounce()

    for (let index = 0; index < capacity; index += 1) {
      if (!alive[index] || asleep[index]) {
        continue
      }

      const speed = Math.hypot(velocityX[index] ?? 0, velocityY[index] ?? 0)

      if (touched[index]) {
        spinSpeed[index] = ((velocityX[index] ?? 0) / capRadius) * -0.5 + (spinSpeed[index] ?? 0) * 0.8
        tumbleSpeed[index] = (tumbleSpeed[index] ?? 0) * 0.86
      }

      spin[index] = (spin[index] ?? 0) + (spinSpeed[index] ?? 0) * delta
      tumble[index] = (tumble[index] ?? 0) + (tumbleSpeed[index] ?? 0) * delta

      if (touched[index] && speed < sleepSpeed && phase !== "drain") {
        stillSteps[index] = (stillSteps[index] ?? 0) + 1

        if ((stillSteps[index] ?? 0) > sleepSteps) {
          asleep[index] = 1
          velocityX[index] = 0
          velocityY[index] = 0
        }
      } else {
        stillSteps[index] = 0
      }

      if ((y[index] ?? 0) < -0.3) {
        alive[index] = 0
      }
    }
  }

  const advancePhase = (delta: number) => {
    phaseTime += delta

    if (phase === "pour") {
      pour(delta)
    } else if (phase === "hold" && phaseTime > holdSeconds) {
      phase = "drain"
      phaseTime = 0

      for (let index = 0; index < capacity; index += 1) {
        wake(index)
      }
    } else if (phase === "drain") {
      const amount = Math.min(phaseTime / drainSeconds, 1)

      gap = amount * amount * (width / 2 + capRadius)

      if (!alive.includes(1)) {
        clear()
      }
    }
  }

  const step = (delta: number, pointer: PilePointer | null) => {
    clock += delta
    advancePhase(delta)

    if (pointer) {
      stir(pointer, delta)
    }

    for (let pass = 0; pass < substeps; pass += 1) {
      substep(delta / substeps)
    }
  }

  const settle = () => {
    for (let frame = 0; frame < 1500 && phase === "pour"; frame += 1) {
      step(1 / 60, null)
    }

    for (let frame = 0; frame < 120; frame += 1) {
      step(1 / 60, null)
      phaseTime = 0
    }
  }

  return {
    x,
    y,
    spin,
    tumble,
    alive,
    asleep,
    resize,
    step,
    settle,
    phase: () => phase,
    limit: () => limit,
    width: () => width,
    height: () => height,
  }
}
