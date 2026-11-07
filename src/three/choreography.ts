import { motion } from "@/animation/tokens"
import { readProgress, collectionRig, heroRig, useScrollStore } from "@/state/scrollStore"
import { actorIds, actorModels, actorTargets } from "@/three/actors"
import type { ActorId, ActorTarget } from "@/three/actors"
import { mixRects, pixelsToWorld, readAnchor, worldHeight } from "@/three/anchors"
import type { WorldRect } from "@/three/anchors"
import { nozzleDirective, particleDirective, processDirective, shadowDirective, shardDirective } from "@/three/directives"
import { getModelParts } from "@/three/models/modelLibrary"

export interface StageSize {
  width: number
  height: number
  time: number
}

const degrees = Math.PI / 180
const collectionActors: ActorId[] = ["tolqyn", "tas", "qum", "saule"]
const collectionFill = [1, 0.74, 0.86, 0.78]

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
  })
  nozzleDirective.active = false
  shadowDirective.visible = false
  processDirective.visible = false
}

function fit(id: ActorId, rect: WorldRect, fill = 1) {
  const size = getModelParts(actorModels[id]).size
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
  const height = getModelParts(actorModels[id]).size.y * target.scale
  const width = getModelParts(actorModels[id]).size.x * target.scale

  nozzleDirective.active = target.print > 0.004 && target.print < 0.996
  nozzleDirective.position.set(target.x, target.y - height / 2 + height * target.print, 0.6)
  nozzleDirective.width = width
  particleDirective.nozzle.copy(nozzleDirective.position)
}

function setShadow(id: ActorId, opacity: number) {
  const target = actorTargets[id]
  const size = getModelParts(actorModels[id]).size

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
  chair.rotationY = mix(-25, 15, seam) * degrees + heroSpin
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
    target.rotationY = (15 + Math.sin(time * 0.3) * 4) * degrees
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
    setParticles("silhouette", "hidden", range(out, 0.3, 0.75))
  } else if (rise > 0) {
    setParticles("heap", "silhouette", rise)
  } else {
    setParticles("fall", "heap", fall)
  }

  return true
}

function updateProcess(size: StageSize) {
  const enter = readProgress("processEnter")
  const leave = readProgress("processLeave")

  if (enter <= 0 || leave >= 1) {
    return
  }

  processDirective.visible = leave < 0.55

  const track = readProgress("processTrack")
  const fade = 1 - smooth(range(leave, 0, 0.6))
  const printAnchor = readAnchor("process-4", size.width, size.height)
  const finalAnchor = readAnchor("process-5", size.width, size.height)

  if (printAnchor && printAnchor.x < 7 && printAnchor.x > -7) {
    const target = place("processPrint", printAnchor, 0.92)

    target.rotationY = -28 * degrees
    target.rotationZ = 0
    target.print = Math.min(range(track, 0.6, 0.9), fade)
    target.stiffness = 40
    target.visible = target.print > 0.002
    setNozzle("processPrint")
  }

  if (finalAnchor && finalAnchor.x < 7) {
    const target = place("processFinal", finalAnchor, 0.92)

    target.rotationY = -28 * degrees
    target.rotationZ = 0
    target.print = fade
    target.stiffness = 40
    target.visible = fade > 0.002
  }
}

function updatePassport(size: StageSize) {
  const { width, height } = size
  const enter = readProgress("passportEnter")
  const leave = readProgress("passportLeave")
  const stream = readProgress("passportStream")
  const chairAnchor = readAnchor("passport-chair", width, height, true)
  const stoolAnchor = readAnchor("passport-stool", width, height, true)
  const seam = readAnchor("configurator-seam", width, height)

  if (enter <= 0 || !chairAnchor || !stoolAnchor || !seam) {
    return false
  }

  const seamVisible = seam.bottom > -height * 0.3
  let active = false

  if (leave < 1) {
    const chair = place("tolqyn", chairAnchor)
    const arrive = smooth(range(enter, 0.55, 1))

    chair.visible = arrive > 0.001
    chair.y += (1 - arrive) * worldHeight * 0.9 + leave * worldHeight * 0.9
    chair.rotationY = -20 * degrees
    chair.rotationZ = 120 * degrees
    chair.print = 1
    active = true
  }

  if (seamVisible && enter >= 1) {
    const unit = pixelsToWorld(height)
    const stoolRect = { ...stoolAnchor }
    const seamWorldY = seam.y

    if (seamWorldY > stoolRect.y) {
      stoolRect.y = seamWorldY
    }

    const stool = place("stool", stoolRect)

    stool.rotationY = 10 * degrees
    stool.rotationZ = 0
    stool.print = stream
    stool.stiffness = 30
    setNozzle("stool")

    if (stream > 0 && stream < 1) {
      const chair = actorTargets.tolqyn

      particleDirective.streamFrom.set(chair.x - chair.scale * 0.1, chair.y - chair.scale * 0.2, 0.3)
      particleDirective.streamTo.copy(nozzleDirective.position)
      particleDirective.streamTo.y += 12 * unit
      particleDirective.paletteMode = true
      setParticles("hidden", "hidden", 0, "stream", "stream")
    }

    active = true
  }

  return active
}

function updateConfigurator(size: StageSize) {
  const enter = readProgress("configuratorEnter")
  const leave = readProgress("configuratorLeave")
  const anchor = readAnchor("configurator-product", size.width, size.height)

  if (enter <= 0 || !anchor || anchor.bottom < -40) {
    return
  }

  const config = useScrollStore.getState().configurator
  const chair = place("configChair", anchor, 0.88)

  chair.rotationY = (-25 + config.angle + config.dragAngle) * degrees
  chair.rotationZ = 0
  chair.rotationStiffness = 5
  chair.print = smooth(range(enter, 0.2, 1))
  chair.stiffness = 26
  chair.printStiffness = 12
  setNozzle("configChair")
  setShadow("configChair", 0.45 * (1 - leave) * chair.print)
}

function updateBusiness(size: StageSize) {
  const seam = readAnchor("business-seam", size.width, size.height)
  const reveal = readProgress("businessSeam")

  if (!seam || reveal <= 0 || seam.bottom < -size.height * 0.25) {
    return
  }

  const stoolHeight = worldHeight * 0.32
  const rect: WorldRect = {
    ...seam,
    x: worldHeight * (size.width / size.height) * 0.2,
    y: seam.y + stoolHeight * 0.32,
    width: stoolHeight * 1.4,
    height: stoolHeight,
  }
  const stool = place("stool", rect)

  stool.rotationY = -18 * degrees
  stool.rotationZ = 0
  stool.print = smooth(range(reveal, 0, 0.45))
  stool.stiffness = 40
  setNozzle("stool")
}

function inView(rect: WorldRect | null, height: number) {
  return rect !== null && rect.bottom > -height * 0.25 && rect.top < height * 1.25
}

function updateCompact(size: StageSize, reduced: boolean) {
  const { width, height, time } = size
  const hero = readAnchor("hero-product", width, height)
  const firstBlock = readAnchor("collection-product-0", width, height)
  const seam = reduced ? 0 : smooth(readProgress("heroSeam"))
  const entrance = reduced ? 1 : heroRig.entrance
  const heroPrint = reduced ? 1 : readProgress("heroHold") < 1 ? 1 : readProgress("heroPrint")
  const rig = collectionRig.models
  const staticSpin = reduced ? 0 : Math.sin(time * 0.4) * 0.14
  let cloudCenterSet = false

  if (hero && firstBlock && (inView(hero, height) || inView(firstBlock, height))) {
    const rect = mixRects(hero, firstBlock, seam)
    const chair = place("tolqyn", rect, 0.76)

    chair.visible = entrance > 0.001
    chair.y += (1 - entrance) * worldHeight * 0.9
    chair.rotationY = -25 * degrees + staticSpin
    chair.rotationZ = 0
    chair.print = Math.min(heroPrint, seam > 0.98 ? (rig[0]?.print ?? 1) : 1)
    chair.stiffness = 18
    setNozzle("tolqyn")
    particleDirective.center.set(chair.x, chair.y, 0)
    cloudCenterSet = inView(hero, height) && seam < 0.5
    shardDirective.opacity = reduced ? 0 : entrance * (1 - seam)
    shardDirective.center.set(chair.x, chair.y, 0)
  }

  collectionActors.forEach((id, index) => {
    const state = rig[index]
    const rect = index === 0 ? null : readAnchor(`collection-product-${index}`, width, height)

    if (index === 0 || !state || !rect || !inView(rect, height)) {
      return
    }

    const target = place(id, rect, (collectionFill[index] ?? 1) * 0.86)

    target.rotationY = 15 * degrees + staticSpin
    target.rotationZ = 0
    target.print = state.print
    target.stiffness = 18
    setNozzle(id)
  })

  const chairAnchor = readAnchor("passport-chair", width, height)
  const stoolAnchor = readAnchor("passport-stool", width, height)

  if (chairAnchor && inView(chairAnchor, height)) {
    const chair = place("tolqyn", chairAnchor)

    chair.rotationY = -20 * degrees
    chair.rotationZ = 120 * degrees
    chair.print = 1
    chair.stiffness = 24
  }

  if (stoolAnchor && inView(stoolAnchor, height)) {
    const stool = place("stool", stoolAnchor)
    const position = clamp01(1 - stoolAnchor.top / height)

    stool.rotationY = 10 * degrees
    stool.rotationZ = 0
    stool.print = reduced ? 1 : smooth(position * 1.3)
    stool.stiffness = 24
    setNozzle("stool")
  }

  const config = readAnchor("configurator-product", width, height)

  if (config && inView(config, height)) {
    const state = useScrollStore.getState().configurator
    const chair = place("configChair", config, 0.88)

    chair.rotationY = (-25 + state.angle + state.dragAngle) * degrees
    chair.rotationZ = 0
    chair.print = 1
    chair.stiffness = 24
  }

  const processPrint = readAnchor("process-4", width, height)
  const processFinal = readAnchor("process-5", width, height)

  if (processPrint && inView(processPrint, height)) {
    const target = place("processPrint", processPrint, 0.9)

    target.rotationY = -28 * degrees
    target.rotationZ = 0
    target.print = reduced ? 1 : smooth(clamp01(1.1 - processPrint.top / height))
    target.stiffness = 24
    setNozzle("processPrint")
  }

  if (processFinal && inView(processFinal, height)) {
    const target = place("processFinal", processFinal, 0.9)

    target.rotationY = -28 * degrees
    target.rotationZ = 0
    target.print = 1
    target.stiffness = 24
  }

  processDirective.visible = inView(readAnchor("process-1", width, height), height) || inView(readAnchor("process-3", width, height), height)

  const businessSeam = readAnchor("business-seam", width, height)

  if (!reduced && businessSeam && businessSeam.top < height * 1.2 && businessSeam.top > -height * 0.25) {
    updateBusiness(size)
  }

  if (reduced) {
    setParticles(cloudCenterSet ? "cloud" : "hidden", cloudCenterSet ? "cloud" : "hidden", 1)
    return
  }

  if (cloudCenterSet) {
    setParticles("cloud", "intake", range(readProgress("heroPrint"), 0, 0.9))
  } else if (!updateProblem(size)) {
    setParticles("hidden", "hidden", 0)
  }
}

export function runChoreography(size: StageSize) {
  const { compact, reducedMotion } = useScrollStore.getState()

  resetActors()
  particleDirective.paletteMode = false
  shardDirective.opacity = 0

  if (compact || reducedMotion) {
    particleDirective.spin = reducedMotion ? 0 : 1
    updateCompact(size, reducedMotion)
    return
  }

  particleDirective.spin = 1
  setParticles("hidden", "hidden", 0)

  updateHeroAndCollection(size)
  updateProblem(size)
  updateProcess(size)
  updatePassport(size)
  updateConfigurator(size)
  updateBusiness(size)
}
