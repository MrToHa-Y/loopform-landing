export function readToken(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export function readColor(token: string) {
  return readToken(`--color-${token}`)
}
