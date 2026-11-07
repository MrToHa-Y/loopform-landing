import { finishGeometry, gridSurface, pillowGeometry, smoothstep } from "./geometryUtils"

const columns = 192
const bottomRows = 8
const outerRows = 84
const rollRows = 14
const innerRows = 28
const seatRows = 8
const bodyRadius = 0.4
const bodyCenter = 0.335
const bodyHalfHeight = 0.345
const bodyPower = 3
const backRim = 0.64
const frontRim = 0.195
const seatLevel = 0.185

function outerRadius(y: number) {
  const t = Math.min(Math.abs((y - bodyCenter) / bodyHalfHeight), 0.9999)

  return bodyRadius * (1 - t ** bodyPower) ** (1 / bodyPower)
}

function rimHeight(side: number) {
  return frontRim + (backRim - frontRim) * ((1 - Math.cos(side)) / 2) ** 0.6
}

function rollRadius(side: number) {
  const arm = smoothstep(0.1, 0.8, side) * (1 - smoothstep(1.1, 2.4, side))

  return 0.024 + arm * 0.062
}

function layerTop(side: number) {
  return rimHeight(side) * 0.68 + backRim * 0.32
}

function outerLayer(y: number, height: number, top: number) {
  const amount = y / height
  const blend = smoothstep(0.25, 1, amount)

  return y * (1 - blend) + amount * top * blend
}

function createShell() {
  const totalRows = bottomRows + outerRows + rollRows + innerRows + seatRows
  const baseRadius = outerRadius(0)

  return gridSurface(columns, totalRows, true, (column, row) => {
    const angle = (column / columns) * Math.PI * 2
    const side = Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle)))
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const height = rimHeight(side)
    const roll = rollRadius(side)
    const top = layerTop(side)
    const outerAtRim = outerRadius(height)
    let radius = 0
    let y = 0
    let layer = 0

    if (row <= bottomRows) {
      radius = (row / bottomRows) * baseRadius
      layer = -baseRadius + radius
    } else if (row <= bottomRows + outerRows) {
      const amount = (row - bottomRows) / outerRows

      y = amount * height
      radius = outerRadius(y)
      layer = outerLayer(y, height, top)
    } else if (row <= bottomRows + outerRows + rollRows) {
      const amount = (row - bottomRows - outerRows) / rollRows
      const sweep = amount * Math.PI

      radius = outerAtRim - roll + Math.cos(sweep) * roll
      y = height + Math.sin(sweep) * roll
      layer = top + sweep * roll
    } else if (row <= bottomRows + outerRows + rollRows + innerRows) {
      const amount = (row - bottomRows - outerRows - rollRows) / innerRows

      y = height + (seatLevel - height) * amount
      radius = outerRadius(y) - roll * 2
      layer = top + Math.PI * roll + (height - y)
    } else {
      const amount = (row - bottomRows - outerRows - rollRows - innerRows) / seatRows
      const inner = outerRadius(seatLevel) - roll * 2

      radius = inner * (1 - amount)
      y = seatLevel
      layer = top + Math.PI * roll + height - seatLevel + inner * amount
    }

    return [cos * radius, y, sin * radius, layer]
  })
}

export function createLoungeParts() {
  const cushion = pillowGeometry(0.25, 0.262, 0.1, 2.8)

  cushion.translate(0.075, seatLevel + 0.09, 0)

  const main = finishGeometry(createShell(), null, [cushion])

  return { main, cushion }
}
