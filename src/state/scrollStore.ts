import { create } from "zustand"
import type { SegmentKey } from "@/animation/tokens"
import type { ConfiguratorState, SectionId, ThemeName } from "@/content/types"

export const progress = {} as Record<SegmentKey, number>

export function readProgress(key: SegmentKey) {
  return progress[key] ?? 0
}

export interface ModelRig {
  print: number
  direction: number
}

export const collectionRig = {
  models: [
    { print: 1, direction: 1 },
    { print: 0, direction: 1 },
    { print: 0, direction: 1 },
    { print: 0, direction: 1 },
  ] as ModelRig[],
  particleColorIndex: 0,
}

export const heroRig = {
  entrance: 0,
}

export const configuratorRig = {
  print: 1,
}

export const configuratorView = {
  yaw: 0,
  pitch: 0,
  x: 0,
  y: 0,
  zoom: 1,
}

export const loadState = {
  assets: 0,
}

export const thumbnails = new Map<string, string>()

export const productViews = new Map<string, string[]>()

interface ScrollState {
  fontsReady: boolean
  layoutReady: boolean
  stageReady: boolean
  preloaderDone: boolean
  reducedMotion: boolean
  compact: boolean
  viewportVersion: number
  headerTheme: ThemeName
  headerSection: SectionId
  activeModel: number
  collectionActive: boolean
  thumbnailsVersion: number
  catalogViewsWanted: boolean
  footerActive: boolean
  presentationMode: boolean
  presentationFrame: number
  presentationSection: number
  configurator: ConfiguratorState
  set: (partial: Partial<Omit<ScrollState, "set" | "setConfigurator">>) => void
  setConfigurator: (partial: Partial<ConfiguratorState>) => void
}

export const useScrollStore = create<ScrollState>((set) => ({
  fontsReady: false,
  layoutReady: false,
  stageReady: false,
  preloaderDone: false,
  reducedMotion: false,
  compact: false,
  viewportVersion: 0,
  headerTheme: "dark",
  headerSection: "intro",
  activeModel: 0,
  collectionActive: false,
  thumbnailsVersion: 0,
  catalogViewsWanted: false,
  footerActive: false,
  presentationMode: false,
  presentationFrame: 0,
  presentationSection: 0,
  configurator: {
    model: "tolqyn",
    color: "cap-red",
    texture: "relief",
    angle: 0,
    variants: { height: "dining", cushion: "none" },
  },
  set: (partial) => set(partial),
  setConfigurator: (partial) => set((state) => ({ configurator: { ...state.configurator, ...partial } })),
}))
