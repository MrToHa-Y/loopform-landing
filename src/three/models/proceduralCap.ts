import { BoxGeometry, CylinderGeometry, IcosahedronGeometry } from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import { capModel } from "./modelAvailability"

const ribCount = 24

export function createCapGeometry() {
  if (capModel.geometry) {
    return capModel.geometry
  }

  const parts = [new CylinderGeometry(1, 1, 0.55, 32).toNonIndexed()]

  for (let index = 0; index < ribCount; index += 1) {
    const angle = (index / ribCount) * Math.PI * 2
    const rib = new BoxGeometry(0.08, 0.5, 0.08).toNonIndexed()

    rib.rotateY(-angle)
    rib.translate(Math.cos(angle) * 1.02, 0, Math.sin(angle) * 1.02)
    parts.push(rib)
  }

  parts.forEach((part) => part.deleteAttribute("uv"))

  const merged = mergeGeometries(parts)

  if (!merged) {
    throw new Error("Cap geometry merge failed")
  }

  return merged
}

export function createFlakeGeometry() {
  const geometry = new IcosahedronGeometry(1, 0)

  geometry.scale(1, 0.22, 0.7)

  return geometry
}
