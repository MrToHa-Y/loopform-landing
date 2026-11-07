export type ColorToken =
  | "bone"
  | "graphite"
  | "cap-red"
  | "bottle-green"
  | "sand"
  | "cap-blue"
  | "sun"

export type SectionId =
  | "intro"
  | "hero"
  | "collection"
  | "catalog"
  | "problem"
  | "melt"
  | "process"
  | "passport"
  | "configurator"
  | "manifesto"
  | "business"
  | "market"
  | "faq"
  | "cta"
  | "footer"

export type ModelId = "tolqyn" | "tas" | "qum" | "saule"

export type CatalogModelId =
  | ModelId
  | "biik"
  | "kol"
  | "japyraq"
  | "saiabaq"
  | "ornek"
  | "uya"

export type ThemeName = "light" | "dark" | "accent"

export type ConfiguratorColorId = "cap-red" | "bottle-green" | "sand" | "cap-blue" | "terrazzo"

export type ConfiguratorHeightId = "dining" | "bar"

export type ConfiguratorTextureId = "smooth" | "relief"

export type ConfiguratorCushionId = "none" | "felt"

export type ConfiguratorGroupId = "model" | "color" | "height" | "texture" | "cushion" | "angle"

export interface ConfiguratorState {
  model: CatalogModelId
  color: ConfiguratorColorId
  height: ConfiguratorHeightId
  texture: ConfiguratorTextureId
  cushion: ConfiguratorCushionId
  angle: number
}

export interface SectionEntry {
  id: SectionId
  number: string
  title: string
}

export interface NavLink {
  label: string
  target: SectionId
}

export interface ExternalLink {
  label: string
  url: string | null
}

export interface BrandColor {
  role: string
  name: string
  token: ColorToken
}

export interface Brand {
  name: string
  positioning: string
  slogans: {
    ru: string[]
    en: string[]
    kz: string[]
  }
  colors: BrandColor[]
  aiImageNote: string
  badge: string
  monogram: string
}

export interface Preloader {
  brand: string
  layerLabel: string
  layerTotal: number
}

export interface Header {
  logo: string
  leftNav: NavLink[]
  rightNav: NavLink[]
  order: NavLink
  orderCount: number
}

export interface Intro {
  lines: string[]
  eyebrowLeft: string
  eyebrowRight: string
}

export interface Hero {
  titleLines: string[]
  subtitle: string
  slogan: string
  layerLabel: string
  layerTotal: number
}

export interface CollectionModel {
  id: ModelId
  name: string
  meaning: string
  type: string
  description: string
  backgroundName: string
  background: ColorToken
  price: string
  priceValue: number
  modelPath: string
}

export interface Collection {
  title: string
  origin: string
  buyLabel: string
  models: CollectionModel[]
}

export interface ProblemStat {
  value: number
  decimals: number
  suffix: string
  display: string
  label: string
  source: ExternalLink
}

export interface Problem {
  title: string
  stats: ProblemStat[]
  lead: string
}

export interface Melt {
  lines: string[]
  labels: string[]
}

export interface ProcessPhoto {
  src: string
  alt: string
}

export interface ProcessStep {
  number: string
  title: string
  text: string
  photo?: ProcessPhoto
  inset?: ProcessPhoto
}

export interface Process {
  title: string
  steps: ProcessStep[]
}

export interface PassportItem {
  title: string
  text: string
}

export interface PassportField {
  label: string
  value: string
}

export interface Passport {
  titleLines: string[]
  items: PassportItem[]
  linkLabel: string
  modal: {
    title: string
    note: string
    model: string
    closeLabel: string
    fields: PassportField[]
  }
}

export interface ConfiguratorOption<Id extends string> {
  id: Id
  label: string
}

export interface ConfiguratorColor extends ConfiguratorOption<ConfiguratorColorId> {
  token: ColorToken
}

export interface ConfiguratorHeight extends ConfiguratorOption<ConfiguratorHeightId> {
  heightCm: number
  weightKg: number
}

export interface ConfiguratorModel {
  id: CatalogModelId
  name: string
  priceValue: number
  pricePrefix: string
  weightKg: number
  fromCaps: boolean
  adjustable: boolean
}

export interface Configurator {
  titlePrefix: string
  groups: Record<ConfiguratorGroupId, string>
  tabs: Record<ConfiguratorGroupId, string>
  models: ConfiguratorModel[]
  colors: ConfiguratorColor[]
  heights: ConfiguratorHeight[]
  textures: ConfiguratorOption<ConfiguratorTextureId>[]
  cushions: ConfiguratorOption<ConfiguratorCushionId>[]
  angle: {
    min: number
    max: number
    step: number
    unit: string
  }
  result: {
    price: string
    weight: string
    caps: string
  }
  capWeightGrams: number
  resetLabel: string
  gestureHint: string
  submitLabel: string
  telegramBot: string
}

export interface BusinessCard {
  number: string
  title: string
  text: string
}

export interface Business {
  title: string
  cards: BusinessCard[]
  actionLabel: string
}

export interface Manifesto {
  lines: string[]
  imagePath: string
  imageAlt: string
  imageCaption: string
  pilotCall: string
}

export interface MarketFigure {
  value: number
  decimals: number
  prefix: string
  suffix: string
  display: string
  label: string
}

export interface RoadmapStage {
  label: string
}

export interface RevenueStream {
  direction: string
  client: string
  offer: string
  channel: string
}

export interface Market {
  title: string
  figures: MarketFigure[]
  roadmap: {
    title: string
    note: string
    stages: RoadmapStage[]
  }
  revenueStreams: RevenueStream[]
}

export interface FaqItem {
  question: string
  answer: string
}

export interface Faq {
  eyebrow: string
  title: string
  items: FaqItem[]
}

export interface CtaField {
  name: "name" | "contact" | "city"
  label: string
  autoComplete: string
}

export interface Cta {
  title: string
  fields: CtaField[]
  submitLabel: string
  requiredMessage: string
  successMessage: string
}

export interface FooterColumnLink {
  label: string
  target?: SectionId
  url?: string
}

export interface FooterColumn {
  title: string
  links: FooterColumnLink[]
}

export interface Footer {
  logo: string
  columns: FooterColumn[]
  disclaimer: string
  copyright: string
}

export type CatalogKind = "product" | "digital" | "service"

export interface CatalogItem {
  kind: CatalogKind
  slug: CatalogModelId | null
  model: string
  type: string
  size: string
  material: string
  weight: string
  printTime: string
  price: string
  priceLabel: string
  izicity: string
  viadigital: string
}

export interface Catalog {
  eyebrow: string
  titleLines: string[]
  summary: string
  note: string
  buyLabel: string
  buyUrl: string
  previousLabel: string
  nextLabel: string
  items: CatalogItem[]
}

export interface CostRow {
  item: string
  calculation: string
  amount: string
}

export interface BudgetRow {
  item: string
  amount: string
}

export interface BusinessModel {
  summary: string
  unitEconomics: {
    title: string
    note: string
    rows: CostRow[]
    capacity: string
  }
  startupBudget: {
    title: string
    rows: BudgetRow[]
    funding: string
  }
}

export interface Presentation {
  counterSeparator: string
  railLabel: string
}

export interface Content {
  brand: Brand
  sections: SectionEntry[]
  preloader: Preloader
  header: Header
  intro: Intro
  hero: Hero
  collection: Collection
  catalog: Catalog
  problem: Problem
  melt: Melt
  process: Process
  passport: Passport
  configurator: Configurator
  manifesto: Manifesto
  business: Business
  market: Market
  faq: Faq
  cta: Cta
  footer: Footer
  businessModel: BusinessModel
  presentation: Presentation
}
