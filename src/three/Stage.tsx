import { Stats, useProgress } from "@react-three/drei"
import { Canvas, useThree } from "@react-three/fiber"
import { Suspense, lazy, useEffect, useRef, useState } from "react"
import { ACESFilmicToneMapping } from "three"
import { ScrollTrigger } from "@/animation/gsap"
import { loadState, useScrollStore } from "@/state/scrollStore"
import { Actor } from "@/three/Actor"
import { actorIds } from "@/three/actors"
import { cameraDistance, cameraFov } from "@/three/anchors"
import { CameraRig } from "@/three/CameraRig"
import { ConfiguratorActor } from "@/three/ConfiguratorActor"
import { Director } from "@/three/Director"
import { GroundShadow } from "@/three/GroundShadow"
import { MeltScene } from "@/three/melt/MeltScene"
import { detectModels, loadCapModel } from "@/three/models/modelAvailability"
import { LabelShards } from "@/three/particles/LabelShards"
import { ParticleField } from "@/three/particles/ParticleField"
import { attachPointerField } from "@/three/pointerField"
import { PrintNozzle } from "@/three/PrintNozzle"
import { ProcessIllustrations } from "@/three/ProcessIllustrations"
import { StageLights } from "@/three/StageLights"
import { renderProductViews, renderThumbnails } from "@/three/thumbnailRenderer"
import styles from "./Stage.module.scss"

const FooterPhysics = lazy(() => import("@/three/physics/FooterPhysics"))
const isDebug = window.location.search.includes("debug")
const thumbnailDelayMs = 1400
const secondaryDelayMs = 500
const secondaryActors = actorIds.filter((id) => id !== "tolqyn" && id !== "configChair")

function LoadTracker() {
  const { progress, active } = useProgress()

  useEffect(() => {
    loadState.assets = active ? progress / 100 : 1
  }, [progress, active])

  return null
}

function FrameLoopController() {
  const setFrameloop = useThree((state) => state.setFrameloop)
  const layoutReady = useScrollStore((state) => state.layoutReady)

  useEffect(() => {
    if (!layoutReady) {
      return
    }

    const start = document.querySelector("[data-section='advantages']")
    const end = document.querySelector("[data-section='cta']")

    if (!start || !end) {
      return
    }

    const trigger = ScrollTrigger.create({
      trigger: start,
      start: "top top",
      endTrigger: end,
      end: "top 40%",
      onToggle: (self) => setFrameloop(self.isActive ? "demand" : "always"),
    })

    return () => trigger.kill()
  }, [layoutReady, setFrameloop])

  return null
}

function ReadySignal() {
  const set = useScrollStore((state) => state.set)
  const preloaderDone = useScrollStore((state) => state.preloaderDone)
  const catalogViewsWanted = useScrollStore((state) => state.catalogViewsWanted)

  useEffect(() => {
    if (preloaderDone && catalogViewsWanted) {
      renderProductViews()
    }
  }, [preloaderDone, catalogViewsWanted])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      set({ stageReady: true })
    })

    return () => cancelAnimationFrame(frame)
  }, [set])

  useEffect(() => {
    if (!preloaderDone) {
      return
    }

    const timer = window.setTimeout(() => {
      renderThumbnails()
    }, thumbnailDelayMs)

    return () => window.clearTimeout(timer)
  }, [preloaderDone])

  return null
}

export default function Stage() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [modelsChecked, setModelsChecked] = useState(false)
  const footerActive = useScrollStore((state) => state.footerActive)
  const reducedMotion = useScrollStore((state) => state.reducedMotion)
  const physicsMounted = useRef(false)
  const preloaderDone = useScrollStore((state) => state.preloaderDone)
  const [secondaryReady, setSecondaryReady] = useState(false)

  useEffect(() => {
    if (!preloaderDone) {
      return
    }

    const timer = window.setTimeout(() => setSecondaryReady(true), secondaryDelayMs)

    return () => window.clearTimeout(timer)
  }, [preloaderDone])

  useEffect(attachPointerField, [])

  useEffect(() => {
    Promise.all([detectModels(), loadCapModel()]).finally(() => setModelsChecked(true))
  }, [])

  physicsMounted.current = physicsMounted.current || footerActive

  if (!modelsChecked) {
    return null
  }

  return (
    <div ref={canvasRef} className={styles.root} aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        flat={false}
        shadows="percentage"
        camera={{ fov: cameraFov, position: [0, 0, cameraDistance], near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        eventSource={document.getElementById("root") ?? undefined}
        eventPrefix="client"
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
          gl.setClearColor(0x000000, 0)
        }}
      >
        <StageLights />
        <Director canvasRef={canvasRef} />
        <CameraRig />
        <LoadTracker />
        <FrameLoopController />
        <Suspense fallback={null}>
          <Actor id="tolqyn" />
          {secondaryReady ? secondaryActors.map((id) => <Actor key={id} id={id} />) : null}
          {secondaryReady ? <ConfiguratorActor /> : null}
          <ReadySignal />
        </Suspense>
        <GroundShadow />
        <PrintNozzle />
        <ParticleField />
        <LabelShards />
        <ProcessIllustrations />
        {secondaryReady ? <MeltScene /> : null}
        {physicsMounted.current && !reducedMotion ? (
          <Suspense fallback={null}>
            <FooterPhysics />
          </Suspense>
        ) : null}
        {isDebug ? <Stats /> : null}
      </Canvas>
    </div>
  )
}
