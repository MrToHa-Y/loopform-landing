import { formatNumber } from "@/components/Counter/formatNumber"

export interface BlockRect {
  left: number
  top: number
  width: number
  height: number
  centerX: number
  centerY: number
  crossX: number
  crossY: number
  armX: number
  armY: number
  members: number[]
}

const capRounding = 100

function trackSizes(value: string) {
  return value
    .split(" ")
    .map((part) => Number.parseFloat(part))
    .filter((size) => Number.isFinite(size))
}

export function previewBlock(grid: HTMLElement, index: number, rowSpan: number): BlockRect {
  const style = getComputedStyle(grid)
  const columns = trackSizes(style.gridTemplateColumns)
  const columnGap = Number.parseFloat(style.columnGap) || 0
  const rowGap = Number.parseFloat(style.rowGap) || 0
  const cards = [...grid.children].filter((node): node is HTMLElement => node instanceof HTMLElement)
  const count = Math.max(columns.length, 1)
  const rows = Math.ceil(cards.length / count)
  const column = index % count
  const row = Math.floor(index / count)
  const startColumn = Math.max(0, Math.min(column - (column % 2), count - 2))
  const startRow = Math.max(0, Math.min(row - (row % rowSpan), rows - rowSpan))
  const columnLeft = (target: number) => columns.slice(0, target).reduce((sum, size) => sum + size + columnGap, 0)
  const rowCard = (target: number) => cards[target * count]
  const firstRow = rowCard(startRow)
  const secondRow = rowCard(Math.min(startRow + rowSpan - 1, rows - 1))
  const left = columnLeft(startColumn)
  const right = columnLeft(Math.min(startColumn + 1, count - 1)) + (columns[Math.min(startColumn + 1, count - 1)] ?? 0)
  const top = firstRow?.offsetTop ?? 0
  const bottom = secondRow ? secondRow.offsetTop + secondRow.offsetHeight : top
  const width = right - left
  const height = bottom - top
  const boundaryX = columnLeft(startColumn + 1) - columnGap / 2
  const middleRow = rowCard(Math.min(startRow + 1, rows - 1))
  const boundaryY = rowSpan === 2 && middleRow && middleRow !== firstRow ? middleRow.offsetTop - rowGap / 2 : top + height / 2
  const members: number[] = []

  for (let r = startRow; r < Math.min(startRow + rowSpan, rows); r += 1) {
    for (let c = startColumn; c < Math.min(startColumn + 2, count); c += 1) {
      const member = r * count + c

      if (member < cards.length) {
        members.push(member)
      }
    }
  }

  return {
    left,
    top,
    width,
    height,
    centerX: left + width / 2,
    centerY: top + height / 2,
    crossX: ((boundaryX - left) / width) * 100,
    crossY: ((boundaryY - top) / height) * 100,
    armX: (columnGap / width) * 100,
    armY: rowSpan === 2 ? (rowGap / height) * 100 : 0,
    members,
  }
}

export function capsFromWeight(weight: string, capWeightGrams: number) {
  const values = weight.match(/\d+(?:,\d+)?/g)?.map((value) => Number.parseFloat(value.replace(",", "."))) ?? []

  if (values.length === 0) {
    return "—"
  }

  return `≈ ${values.map((kg) => formatNumber(Math.round((kg * 1000) / capWeightGrams / capRounding) * capRounding, 0)).join("–")}`
}
