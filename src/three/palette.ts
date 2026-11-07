import { Color } from "three"
import type { ColorToken } from "@/content/types"
import { readColor } from "@/styles/readToken"

export type PaletteToken =
  | ColorToken
  | "nozzle"
  | "paper"
  | "ink"
  | "lamp"
  | "studio"
  | "pine"
  | "moss"
  | "dune"
  | "linen"
  | "clay"
  | "oak"
  | "felt"
  | "teal"
  | "brick"
  | "mustard"
  | "cobalt"

const cache = new Map<string, Color>()

export function paletteColor(token: PaletteToken) {
  const cached = cache.get(token)

  if (cached) {
    return cached
  }

  const color = new Color(readColor(token))
  cache.set(token, color)

  return color
}
