import type { ColorToken } from "@/content/types"

export function readToken(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export function readColor(token: ColorToken | "nozzle" | "paper" | "ink" | "lamp") {
  return readToken(`--color-${token}`)
}
