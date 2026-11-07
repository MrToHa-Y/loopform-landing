import { useFrame, useThree } from "@react-three/fiber"
import { Physics, useBeforePhysicsStep, useRapier } from "@react-three/rapier"
import type { RapierRigidBody } from "@react-three/rapier"
import { useEffect, useMemo, useRef } from "react"
import { Matrix4, Quaternion, Vector3 } from "three"
import type { InstancedMesh } from "three"
import { footerPhysics } from "@/animation/tokens"
import type { ColorToken } from "@/content/types"
import { useScrollStore } from "@/state/scrollStore"
import { pixelsToWorld, worldHeight } from "@/three/anchors"
import { createCapGeometry, createFlakeGeometry } from "@/three/models/proceduralCap"
import { paletteColor } from "@/three/palette"
import { createRandom } from "@/three/random"

const paletteTokens: ColorToken[] = ["cap-red", "bottle-green", "cap-blue", "sun", "sand"]
const capHeightRatio = 0.7

interface LetterBox {
  x: number
  y: number
  halfWidth: number
  halfHeight: number
}

interface Measured {
  letters: LetterBox[]
  width: number
  floorY: number
}

function measureLogo(viewportHeight: number): Measured | null {
  const line = document.querySelector<HTMLElement>("[data-footer-logo] [data-fit-line]")
  const textNode = line?.firstChild
  const logo = document.querySelector<HTMLElement>("[data-footer-logo]")
  const footer = document.querySelector<HTMLElement>("[data-section='footer']")

  if (!line || !textNode || !logo || !footer) {
    return null
  }

  const unit = pixelsToWorld(viewportHeight)
  const logoRect = logo.getBoundingClientRect()
  const footerRect = footer.getBoundingClientRect()
  const fontSize = parseFloat(getComputedStyle(line).fontSize)
  const length = textNode.textContent?.length ?? 0
  const range = document.createRange()
  const letters: LetterBox[] = []

  for (let index = 0; index < length; index += 1) {
    range.setStart(textNode, index)
    range.setEnd(textNode, index + 1)

    const rect = range.getBoundingClientRect()

    letters.push({
      x: (rect.left + rect.width / 2 - logoRect.left) * unit,
      y: -(rect.top + rect.height / 2 - logoRect.top) * unit,
      halfWidth: (rect.width / 2) * unit * 0.94,
      halfHeight: (fontSize * capHeightRatio * unit) / 2,
    })
  }

  return {
    letters,
    width: logoRect.width * unit,
    floorY: -(footerRect.bottom - logoRect.top) * unit,
  }
}

const matrix = new Matrix4()
const position = new Vector3()
const quaternion = new Quaternion()
const scaleVector = new Vector3()

interface BodyEntry {
  body: RapierRigidBody
  scale: number
}

interface SimulationProps {
  measured: Measured
  capCount: number
  flakeCount: number
}

function Simulation({ measured, capCount, flakeCount }: SimulationProps) {
  const { world, rapier } = useRapier()
  const capsRef = useRef<InstancedMesh>(null)
  const flakesRef = useRef<InstancedMesh>(null)
  const capBodies = useRef<BodyEntry[]>([])
  const flakeBodies = useRef<BodyEntry[]>([])
  const cursorBody = useRef<RapierRigidBody | null>(null)
  const capGeometry = useMemo(createCapGeometry, [])
  const flakeGeometry = useMemo(createFlakeGeometry, [])
  const size = useThree((state) => state.size)

  useEffect(() => {
    const random = createRandom(71)
    const { letters, width, floorY } = measured
    const statics = world.createRigidBody(rapier.RigidBodyDesc.fixed())
    const colliders = [
      rapier.ColliderDesc.cuboid(width, 0.2, 2).setTranslation(width / 2, floorY - 0.2, 0),
      rapier.ColliderDesc.cuboid(0.2, 12, 2).setTranslation(-0.25, 4, 0),
      rapier.ColliderDesc.cuboid(0.2, 12, 2).setTranslation(width + 0.25, 4, 0),
      ...letters.map((letter) =>
        rapier.ColliderDesc.cuboid(letter.halfWidth, letter.halfHeight, 1.5).setTranslation(letter.x, letter.y, 0),
      ),
    ]

    colliders.forEach((collider) => world.createCollider(collider.setRestitution(0.35).setFriction(0.9), statics))

    const spawn = (radius: number, scale: number) => {
      const body = world.createRigidBody(
        rapier.RigidBodyDesc.dynamic()
          .setTranslation(random() * width, 3.5 + random() * 8, 0)
          .setRotation({ x: random(), y: random(), z: random(), w: 1 })
          .enabledTranslations(true, true, false)
          .setLinearDamping(0.15)
          .setAngularDamping(0.5),
      )

      world.createCollider(rapier.ColliderDesc.ball(radius).setRestitution(0.4).setFriction(0.8).setDensity(1), body)

      return { body, scale }
    }

    capBodies.current = Array.from({ length: capCount }, () => {
      const scale = 0.05 + random() * 0.03
      return spawn(scale * 1.02, scale)
    })
    flakeBodies.current = Array.from({ length: flakeCount }, () => {
      const scale = 0.03 + random() * 0.02
      return spawn(scale * 0.7, scale)
    })

    const cursor = world.createRigidBody(rapier.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 40, 0))

    world.createCollider(rapier.ColliderDesc.ball(0.3), cursor)
    cursorBody.current = cursor

    const caps = capsRef.current
    const flakes = flakesRef.current

    if (caps && flakes) {
      for (let index = 0; index < capCount; index += 1) {
        caps.setColorAt(index, paletteColor(paletteTokens[index % paletteTokens.length] ?? "sun"))
      }

      for (let index = 0; index < flakeCount; index += 1) {
        flakes.setColorAt(index, paletteColor(paletteTokens[(index * 3) % paletteTokens.length] ?? "sun"))
      }

      caps.frustumCulled = false
      flakes.frustumCulled = false
    }

    return () => {
      capBodies.current.concat(flakeBodies.current).forEach(({ body }) => {
        if (world.getRigidBody(body.handle)) {
          world.removeRigidBody(body)
        }
      })
      capBodies.current = []
      flakeBodies.current = []

      if (world.getRigidBody(statics.handle)) {
        world.removeRigidBody(statics)
      }

      if (world.getRigidBody(cursor.handle)) {
        world.removeRigidBody(cursor)
      }
    }
  }, [world, rapier, measured, capCount, flakeCount])

  const offset = useRef(new Vector3())
  const pointerLocal = useMemo(() => new Vector3(0, 40, 0), [])

  useBeforePhysicsStep(() => {
    cursorBody.current?.setNextKinematicTranslation({ x: pointerLocal.x, y: pointerLocal.y, z: 0 })
  })

  useFrame((state) => {
    const logo = document.querySelector<HTMLElement>("[data-footer-logo]")
    const caps = capsRef.current
    const flakes = flakesRef.current

    if (!logo || !caps || !flakes) {
      return
    }

    const rect = logo.getBoundingClientRect()
    const unit = pixelsToWorld(size.height)

    offset.current.set((rect.left - size.width / 2) * unit, worldHeight / 2 - rect.top * unit, 0)
    pointerLocal.set(
      (state.pointer.x * size.width * unit) / 2 - offset.current.x,
      (state.pointer.y * size.height * unit) / 2 - offset.current.y,
      0,
    )

    const write = (mesh: InstancedMesh, entries: BodyEntry[]) => {
      entries.forEach(({ body, scale }, index) => {
        const translation = body.translation()
        const rotation = body.rotation()

        position.set(translation.x + offset.current.x, translation.y + offset.current.y, 0)
        quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
        scaleVector.setScalar(scale)
        mesh.setMatrixAt(index, matrix.compose(position, quaternion, scaleVector))
      })
      mesh.instanceMatrix.needsUpdate = true
    }

    write(caps, capBodies.current)
    write(flakes, flakeBodies.current)
  })

  return (
    <>
      <instancedMesh ref={capsRef} args={[capGeometry, undefined, capCount]}>
        <meshStandardMaterial roughness={0.55} />
      </instancedMesh>
      <instancedMesh ref={flakesRef} args={[flakeGeometry, undefined, flakeCount]}>
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
    </>
  )
}

export default function FooterPhysics() {
  const size = useThree((state) => state.size)
  const compact = useScrollStore((state) => state.compact)
  const footerActive = useScrollStore((state) => state.footerActive)
  const viewportVersion = useScrollStore((state) => state.viewportVersion)
  const measured = useMemo(
    () => measureLogo(size.height),
    [size.height, size.width, viewportVersion],
  )

  if (!measured) {
    return null
  }

  return (
    <Physics gravity={[0, -9.8, 0]} paused={!footerActive} timeStep={1 / 60}>
      <Simulation
        measured={measured}
        capCount={compact ? footerPhysics.capsMobile : footerPhysics.capsDesktop}
        flakeCount={compact ? footerPhysics.flakesMobile : footerPhysics.flakesDesktop}
      />
    </Physics>
  )
}
