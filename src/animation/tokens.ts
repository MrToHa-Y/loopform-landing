export const easeCurves = {
  out: "0.16, 1, 0.3, 1",
  inOut: "0.65, 0, 0.35, 1",
} as const

export const eases = {
  out: "loop.out",
  inOut: "loop.inOut",
  elastic: "elastic.out(1, 0.4)",
  linear: "none",
} as const

export const durations = {
  instant: 0.25,
  fast: 0.4,
  swift: 0.5,
  medium: 0.6,
  smooth: 0.7,
  base: 0.8,
  print: 0.9,
  reveal: 1.1,
  slow: 1.2,
  hero: 1.4,
  counter: 1.6,
  preloaderMinimum: 1.6,
} as const

export const staggers = {
  lines: 0.08,
  nameLines: 0.06,
  chars: 0.02,
  cards: 0.08,
  bands: 0.05,
} as const

export const motion = {
  transitionBoost: 3,
  anchorDamping: 6,
  printDamping: 10,
  scrub: 0.6,
  scatterSeed: 17,
} as const

export const lenisOptions = {
  lerp: 0.085,
  wheelMultiplier: 0.9,
  smoothWheel: true,
} as const

export const sectionHeights = {
  hero: 300,
  collection: 600,
  catalog: 130,
  problem: 350,
  melt: 400,
  process: 400,
  passport: 300,
  configurator: 200,
  manifesto: 250,
  business: 100,
  market: 100,
} as const

export const segments = {
  intro: {
    introOut: [0, 100],
    introText: [40, 90],
  },
  hero: {
    heroHold: [0, 40],
    heroPrint: [40, 200],
    heroScatter: [110, 190],
    heroSeam: [100, 200],
  },
  collection: {
    collectionIn: [-15, 25],
    collectionSteps: [0, 400],
    collectionLeave: [400, 500],
  },
  problem: {
    problemFall: [0, 70],
    problemRise: [70, 130],
    problemOut: [130, 230],
  },
  melt: {
    meltEnter: [-100, 0],
    meltFlow: [0, 300],
  },
  process: {
    processEnter: [-100, 0],
    processTrack: [0, 200],
    processLeave: [200, 300],
  },
  passport: {
    passportEnter: [-100, 0],
    passportStream: [0, 130],
    passportList: [0, 160],
  },
  configurator: {
    configuratorEnter: [-80, 0],
    configuratorLeave: [100, 200],
  },
  manifesto: {
    manifestoLines: [-100, 150],
    manifestoPhoto: [0, 80],
  },
  business: {
    businessSeam: [-100, 60],
  },
  footer: {
    footerEnter: [-100, 0],
  },
} as const

export type SegmentSection = keyof typeof segments

type SegmentMap = (typeof segments)[SegmentSection]

export type SegmentKey = SegmentMap extends infer Group ? (Group extends object ? keyof Group : never) : never

export const presentationPoints = {
  heroStart: 100,
  heroEnd: 195,
  collectionStep: 100,
  collectionSteps: 4,
  problemHeap: 60,
  problemShape: 140,
  meltDeep: 130,
  processSteps: 5,
  processSpan: 200,
  passportItems: 4,
  passportSpan: 160,
} as const

export const presentationTransition = {
  duration: 1.4,
} as const

export const footerPhysics = {
  capsDesktop: 60,
  capsMobile: 20,
  flakesDesktop: 120,
  flakesMobile: 40,
} as const

export const particleCounts = {
  capsDesktop: 240,
  capsMobile: 120,
  flakesDesktop: 360,
  flakesMobile: 180,
} as const

export const scatter = {
  xVw: 45,
  yVhUp: 70,
  yVhDown: 30,
  rotation: 120,
  scaleMin: 0.6,
  scaleMax: 1.4,
} as const
