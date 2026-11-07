import { motion } from "@/animation/tokens"
import type { CatalogModelId } from "@/content/types"

export type ActorId =
  | "tolqyn"
  | "tas"
  | "qum"
  | "saule"
  | "stool"
  | "processPrint"
  | "processFinal"
  | "configChair"

export interface ActorTarget {
  visible: boolean
  x: number
  y: number
  z: number
  scale: number
  rotationX: number
  rotationY: number
  rotationZ: number
  print: number
  direction: number
  stiffness: number
  printStiffness: number
  rotationStiffness: number
}

function createTarget(): ActorTarget {
  return {
    visible: false,
    x: 0,
    y: 0,
    z: 0,
    scale: 1,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    print: 1,
    direction: 1,
    stiffness: motion.anchorDamping,
    printStiffness: motion.printDamping,
    rotationStiffness: motion.anchorDamping,
  }
}

export const actorModels: Record<ActorId, CatalogModelId> = {
  tolqyn: "tolqyn",
  tas: "tas",
  qum: "qum",
  saule: "saule",
  stool: "tas",
  processPrint: "tolqyn",
  processFinal: "tolqyn",
  configChair: "tolqyn",
}

export const actorIds = Object.keys(actorModels) as ActorId[]

export const actorTargets = Object.fromEntries(actorIds.map((id) => [id, createTarget()])) as Record<ActorId, ActorTarget>
