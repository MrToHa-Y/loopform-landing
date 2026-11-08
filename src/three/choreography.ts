import { Euler, Quaternion, Vector3, Matrix4 } from "three"
import { motion } from "@/animation/tokens"
import { readProgress, collectionRig, configuratorRig, configuratorView, heroRig, useScrollStore } from "@/state/scrollStore"
import { actorIds, actorModels, actorOptions, actorTargets } from "@/three/actors"
import type { ActorId, ActorTarget } from "@/three/actors"
import { mixRects, readAnchor, worldHeight } from "@/three/anchors"
import type { WorldRect } from "@/three/anchors"
import { meltDirective, nozzleDirective, particleDirective, processDirective, shadowDirective, shardDirective } from "@/three/directives"
import { getModelParts } from "@/three/models/modelLibrary"
import { morphTiming } from "@/three/particles/particleStates"

export interface StageSize {
  width: number
  height: number
  time: number
}

const degrees = Math.PI / 180
const morphEuler = new Euler()
const morphQuaternion = new Quaternion()
const morphPosition = new Vector3()
const morphScale = new Vector3()
const morphPivot = new Matrix4()
const collectionActors: ActorId[] = ["tolqyn", "tas", "qum", "saule"]
const collectionFill = [1, 0.74, 0.86, 0.78]
const largestPlanter = 45

function partsFor(id: ActorId) {
  return getModelParts(actorModels[id], actorOptions[id])
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function smooth(value: number) {
  const t = clamp01(value)
  return t * t * (3 - 2 * t)
}

function mix(from: number, to: number, amount: number) {
  return from + (to - from) * amount
}

function range(value: number, from: number, to: number) {
  return clamp01((value - from) / (to - from))
}

function resetActors() {
  actorIds.forEach((id) => {
    const target = actorTargets[id]

    target.visible = false
    target.rotationX = 0
    target.stiffness = motion.anchorDamping
    target.printStiffness = motion.printDamping
    target.rotationStiffness = motion.anchorDamping
    target.direction = 1
    target.clipBottom = -1
  })
  nozzleDirective.active = false
  shadowDirective.visible = false
  processDirective.visible = false
}

function fit(id: ActorId, rect: WorldRect, fill = 1) {
  const size = partsFor(id).size
  return Math.min(rect.height / size.y, rect.width / Math.max(size.x, size.z)) * fill
}

function place(id: ActorId, rect: WorldRect, fill = 1): ActorTarget {
  const target = actorTargets[id]

  target.visible = true
  target.x = rect.x
  target.y = rect.y
  target.z = 0
  target.scale = fit(id, rect, fill)

  return target
}

function setNozzle(id: ActorId) {
  const target = actorTargets[id]
  const height = partsFor(id).size.y * target.scale
  const width = partsFor(id).size.x * target.scale

  nozzleDirective.active = target.print > 0.004 && target.print < 0.996
  nozzleDirective.position.set(target.x, target.y - height / 2 + height * target.print, 0.6)
  nozzleDirective.width = width
  particleDirective.nozzle.copy(nozzleDirective.position)
}

function setShadow(id: ActorId, opacity: number) {
  const target = actorTargets[id]
  const size = partsFor(id).size

  shadowDirective.visible = opacity > 0.01
  shadowDirective.position.set(target.x, target.y - (size.y * target.scale) / 2, -0.2)
  shadowDirective.width = size.x * target.scale * 1.7
  shadowDirective.opacity = opacity
}

function setParticles(capsFrom: ParticleLayerName, capsTo: ParticleLayerName, amount: number, flakesFrom = capsFrom, flakesTo = capsTo) {
  const { caps, flakes } = particleDirective

  caps.from = capsFrom
  caps.to = capsTo
  caps.amount = amount
  flakes.from = flakesFrom
  flakes.to = flakesTo
  flakes.amount = amount
}

type ParticleLayerName = typeof particleDirective.caps.from

function updateHeroAndCollection(size: StageSize) {
  const { width, height, time } = size
  const hero = readAnchor("hero-product", width, height)
  const collection = readAnchor("collection-product", width, height, true)
  const leave = readProgress("collectionLeave")

  if (!hero || !collection || leave >= 1) {
    return false
  }

  const seam = smooth(readProgress("heroSeam"))
  const hold = readProgress("heroHold")
  const heroPrint = readProgress("heroPrint")
  const entrance = heroRig.entrance
  const lift = leave * worldHeight * 1.15
  const shrink = 1 - leave * 0.6
  const rig = collectionRig.models

  const chairRect = mixRects(hero, collection, seam)
  const chair = place("tolqyn", chairRect)
  const printed = hold < 1 ? 1 : heroPrint
  const heroSpin = (1 - hold) * Math.sin(time * 0.5) * 0.18 + (1 - entrance) * -3.2

  chair.visible = entrance > 0.001 && (rig[0]?.print ?? 0) > 0.001
  chair.scale *= shrink
  chair.y += lift + (1 - entrance) * worldHeight * 0.9
  chair.rotationY = mix(-32, getModelParts("tolqyn").look.displayYaw, seam) * degrees + heroSpin
  chair.rotationZ = mix(6, 0, seam) * degrees
  chair.print = Math.min(printed, rig[0]?.print ?? 0)
  chair.direction = rig[0]?.direction ?? 1

  collectionActors.forEach((id, index) => {
    const state = rig[index]

    if (index === 0 || !state) {
      return
    }

    const target = place(id, collection, collectionFill[index])

    target.visible = state.print > 0.001
    target.scale *= shrink
    target.y += lift
    target.rotationX = partsFor(id).look.displayPitch * degrees
    target.rotationY = (partsFor(id).look.displayYaw + Math.sin(time * 0.3) * 4) * degrees
    target.rotationZ = 0
    target.print = state.print
    target.direction = state.direction
    target.printStiffness = 24
  })

  chair.printStiffness = hold < 1 || heroPrint < 1 ? 14 : 24

  const active = useScrollStore.getState().activeModel
  const activeId = collectionActors[active] ?? "tolqyn"
  const printing = heroPrint < 1 ? "tolqyn" : activeId

  setNozzle(printing)

  if (actorTargets[activeId].visible) {
    setShadow(activeId, (1 - leave) * 0.5 * actorTargets[activeId].print)
  } else {
    setShadow("tolqyn", 0.5 * chair.print * entrance)
  }

  particleDirective.center.set(chair.x, chair.y, 0)
  shardDirective.center.set(chair.x, hero.y, 0)
  shardDirective.opacity = entrance * (1 - range(readProgress("heroSeam"), 0, 0.75))

  const collectionIn = readProgress("collectionIn")

  if (leave > 0) {
    setParticles("cloud", "hidden", leave * 1.4)
  } else if (collectionIn > 0) {
    setParticles("intake", "cloud", collectionIn)
  } else if (entrance < 1) {
    particleDirective.nozzle.set(chair.x, hero.y, 0)
    setParticles("intake", "cloud", entrance)
  } else {
    setParticles("cloud", "intake", range(heroPrint, 0, 0.9))
  }

  return true
}

function updateProblem(size: StageSize) {
  const out = readProgress("problemOut")
  const fall = readProgress("problemFall")
  const rise = readProgress("problemRise")
  const anchor = readAnchor("problem-silhouette", size.width, size.height, true)

  if (fall <= 0 || out >= 1 || !anchor) {
    return false
  }

  const chairSize = getModelParts("tolqyn").size

  particleDirective.silhouetteCenter.set(anchor.x, anchor.y - anchor.height / 2, 0)
  particleDirective.silhouetteScale = anchor.height / chairSize.y
  particleDirective.silhouetteRotation = -25 * degrees
  particleDirective.paletteMode = true

  if (out > 0) {
    particleDirective.nozzle.set(anchor.x, -worldHeight * 0.8, 0)
    setParticles("silhouette", "intake", range(out, 0.2, 0.8))
  } else if (rise > 0) {
    setParticles("heap", "silhouette", rise)
  } else {
    setParticles("fall", "heap", fall)
  }

  return true
}

function updateProcess() {
  const enter = readProgress("processEnter")
  const leave = readProgress("processLeave")

  if (enter <= 0 || leave >= 1) {
    return
  }

  processDirective.visible = leave < 0.55
}

function composeMorph(target: Matrix4, actor: ActorTarget, height: number) {
  morphEuler.set(actor.rotationX, actor.rotationY, actor.rotationZ)
  morphQuaternion.setFromEuler(morphEuler)
  morphPosition.set(actor.x, actor.y, actor.z)
  morphScale.setScalar(actor.scale)
  target.compose(morphPosition, morphQuaternion, morphScale)
  target.multiply(morphPivot.makeTranslation(0, -height / 2, 0))
}

function updatePassport(size: StageSize) {
  const { width, height } = size
  const enter = readProgress("passportEnter")
  const morph = readProgress("passportStream")
  const chairAnchor = readAnchor("passport-chair", width, height, true)
  const stoolAnchor = readAnchor("passport-stool", width, height, true)
  const seam = readAnchor("configurator-seam", width, height)

  if (enter <= 0 || !chairAnchor || !stoolAnchor || !seam) {
    return
  }

  const chair = place("tolqyn", chairAnchor)
  const arrive = smooth(range(enter, 0.55, 1))
  const dissolve = range(morph, morphTiming.releaseStart, morphTiming.releaseStart + morphTiming.releaseSpan)

  chair.y += (1 - arrive) * worldHeight * 0.9
  chair.rotationY = -20 * degrees
  chair.rotationZ = 120 * degrees
  chair.print = 1 - dissolve
  chair.direction = -1
  chair.printStiffness = 30
  chair.visible = arrive > 0.001 && dissolve < 0.999

  if (seam.bottom < -height * 0.3 || enter < 1) {
    return
  }

  const stool = place("stool", stoolAnchor)

  stool.clipBottom = Math.max(seam.top, 0)
  stool.rotationY = 10 * degrees
  stool.rotationZ = 0
  stool.print = range(morph, morphTiming.coverStart, morphTiming.coverStart + morphTiming.coverSpan)
  stool.printStiffness = 30
  stool.stiffness = 30
  stool.visible = stool.print > 0.002 || (morph > 0 && morph < 1)

  if (morph > 0 && morph < 1) {
    composeMorph(particleDirective.morphFrom, chair, getModelParts("tolqyn").size.y)
    composeMorph(particleDirective.morphTo, stool, getModelParts("tas").size.y)
    particleDirective.morph = morph
    particleDirective.morphAxis = stool.x
    particleDirective.paletteMode = true
    setParticles("morph", "morph", 1)
  }
}

function updateConfigurator(size: StageSize) {
  const enter = readProgress("configuratorEnter")
  const leave = readProgress("configuratorLeave")
  const anchor = readAnchor("configurator-product", size.width, size.height)

  if (enter <= 0 || !anchor || anchor.bottom < -40) {
    return
  }

  const view = configuratorView
  const chair = place("configChair", anchor, 0.74)

  const planter = Number(useScrollStore.getState().configurator.variants.size ?? 0)

  chair.x += view.x
  chair.y += view.y
  chair.scale *= view.zoom * (planter > 0 ? planter / largestPlanter : 1)
  chair.rotationX = (view.pitch + partsFor("configChair").look.displayPitch) * degrees
  chair.rotationY = (partsFor("configChair").look.displayYaw + view.yaw) * degrees
  chair.rotationZ = 0
  chair.rotationStiffness = 9
  chair.print = smooth(range(enter, 0.2, 1)) * configuratorRig.print
  chair.stiffness = 26
  chair.printStiffness = 14
  setNozzle("configChair")
  setShadow("configChair", 0.45 * (1 - leave) * chair.print * (view.pitch === 0 ? 1 : 0.5))
}

function updateMelt(size: StageSize) {
  const { width, height } = size
  const melt = meltDirective
  const anchor = readAnchor("melt-product", width, height)
  const top = readAnchor("melt-top", width, height)
  const seam = readAnchor("advantages-top", width, height)
  const enter = readProgress("meltEnter")

  melt.visible = false

  if (enter <= 0 || !anchor || !top || !seam || seam.top <= 0) {
    return
  }

  const flow = readProgress("meltFlow")
  const worldWidth = worldHeight * (width / height)
  const baseRadius = Math.min(worldHeight * 0.3, worldWidth * 0.4)
  const swell = smooth(range(flow, 0, 0.5))
  const flood = smooth(range(flow, 0.56, 1))

  melt.visible = true
  melt.flow = flow
  melt.worldWidth = worldWidth
  melt.radius = baseRadius * (1 + swell * 0.28 + flood * 1.4)
  melt.x = anchor.x - flood * worldWidth * 0.14
  melt.y = anchor.y - swell * worldHeight * 0.03 - flood * worldHeight * 0.1
  melt.amplitude = 0.03 + swell * 0.05 + flood * 0.17
  melt.clipTop = Math.max(top.top, 0)
  melt.clipBottom = Math.min(seam.top, height)
}

function inView(rect: WorldRect | null, height: number) {
  return rect !== null && rect.bottom > -height * 0.25 && rect.top < height * 1.25
}

function placeStatic(id: ActorId, anchor: string, size: StageSize, rotationY: number, rotationZ = 0, fill = 1) {
  const rect = readAnchor(anchor, size.width, size.height)

  if (!inView(rect, size.height) || !rect) {
    return false
  }

  const target = place(id, rect, fill)

  target.rotationY = rotationY * degrees
  target.rotationZ = rotationZ * degrees
  target.print = 1

  return true
}

function updateStatic(size: StageSize) {
  const meltAnchor = readAnchor("melt-product", size.width, size.height)

  meltDirective.visible = inView(meltAnchor, size.height) && meltAnchor !== null

  if (meltAnchor) {
    const worldWidth = worldHeight * (size.width / size.height)

    meltDirective.x = meltAnchor.x
    meltDirective.y = meltAnchor.y
    meltDirective.radius = Math.min(worldHeight * 0.3, worldWidth * 0.4)
    meltDirective.amplitude = 0.05
    meltDirective.flow = 0
    meltDirective.worldWidth = worldWidth
    meltDirective.clipTop = 0
    meltDirective.clipBottom = size.height
  }

  const heroVisible = placeStatic("tolqyn", "hero-product", size, -25, 0, 0.9)

  if (heroVisible) {
    const chair = actorTargets.tolqyn

    particleDirective.center.set(chair.x, chair.y, 0)
    setParticles("cloud", "cloud", 1)
  } else {
    setParticles("hidden", "hidden", 0)
    placeStatic("tolqyn", "collection-product-0", size, -45, 0, 0.8)
    placeStatic("tolqyn", "passport-chair", size, -20, 120)
  }

  collectionActors.forEach((id, index) => {
    if (index > 0) {
      placeStatic(id, `collection-product-${index}`, size, partsFor(id).look.displayYaw, 0, (collectionFill[index] ?? 1) * 0.86)
    }
  })

  placeStatic("stool", "passport-stool", size, 10)
  placeStatic("configChair", "configurator-product", size, -25, 0, 0.88)

  actorTargets.configChair.rotationY = (partsFor("configChair").look.displayYaw + configuratorView.yaw) * degrees
  processDirective.visible = inView(readAnchor("process-caps", size.width, size.height), size.height)
}

export function runChoreography(size: StageSize) {
  const { reducedMotion } = useScrollStore.getState()

  resetActors()
  particleDirective.paletteMode = false
  shardDirective.opacity = 0

  if (reducedMotion) {
    particleDirective.spin = 0
    updateStatic(size)
    return
  }

  particleDirective.spin = 1
  setParticles("hidden", "hidden", 0)

  updateHeroAndCollection(size)
  updateMelt(size)
  updateProblem(size)
  updateProcess()
  updatePassport(size)
  updateConfigurator(size)
}
