import { Color } from "three"
import type { ColorToken } from "@/content/types"
import { readColor } from "@/styles/readToken"

const cache = new Map<string, Color>()

export function paletteColor(token: ColorToken | "nozzle" | "paper" | "ink" | "lamp") {
  const cached = cache.get(token)

  if (cached) {
    return cached
  }

  const color = new Color(readColor(token))
  cache.set(token, color)

  return color
}

export function speckleColors(base: ColorToken): [Color, Color, Color] {
  const options: ColorToken[] = ["cap-red", "cap-blue", "bottle-green", "sun", "bone"]
  const picks = options.filter((token) => token !== base).slice(0, 3)

  return [
    paletteColor(picks[0] ?? "bone"),
    paletteColor(picks[1] ?? "sun"),
    paletteColor(picks[2] ?? "graphite"),
  ]
}
