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
  | "philosophy"
  | "advantages"
  | "business"
  | "market"
  | "competition"
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

export type ConfiguratorColorId = "cap-red" | "bottle-green" | "sand" | "cap-blue" | "sun" | "terrazzo"

export type ConfiguratorTextureId = "smooth" | "relief"

export type VariantGroupId = "height" | "cushion" | "shape" | "top" | "light" | "size" | "arch" | "fold" | "modules" | "orientation"

export type ConfiguratorBaseGroupId = "model" | "color" | "texture" | "angle"

export type ConfiguratorGroupId = ConfiguratorBaseGroupId | VariantGroupId

export type VariantSelection = Partial<Record<VariantGroupId, string>>

export interface ConfiguratorState {
  model: CatalogModelId
  color: ConfiguratorColorId
  texture: ConfiguratorTextureId
  angle: number
  variants: VariantSelection
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

export interface VariantChoice {
  id: string
  label: string
  priceValue?: number
  weightKg?: number
}

export interface VariantGroup {
  id: VariantGroupId
  label: string
  tab: string
  rebuild: boolean
  defaultId?: string
  choices: VariantChoice[]
}

export interface ConfiguratorModel {
  id: CatalogModelId
  name: string
  priceValue: number
  pricePrefix: string
  weightKg: number
  color: ConfiguratorColorId
  variants: VariantGroup[]
}

export interface Configurator {
  titlePrefix: string
  groups: Record<ConfiguratorBaseGroupId, string>
  tabs: Record<ConfiguratorBaseGroupId, string>
  models: ConfiguratorModel[]
  colors: ConfiguratorColor[]
  textures: ConfiguratorOption<ConfiguratorTextureId>[]
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
  preview: {
    hoverHint: string
    tapHint: string
    openLabel: string
    closeLabel: string
    photoLabel: string
    modelLabel: string
    specs: Record<"size" | "material" | "weight" | "printTime" | "caps", string>
  }
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

export interface TextItem {
  title: string
  text: string
}

export interface PhilosophyContent {
  eyebrow: string
  title: string
  lead: string
  paragraphs: string[]
  principles: TextItem[]
}

export interface AdvantagesContent {
  eyebrow: string
  title: string
  items: TextItem[]
}

export interface SourceLink {
  label: string
  url: string
}

export interface CompetitorRow {
  name: string
  place: string
  fact: string
  answer: string
  source: SourceLink
}

export interface DemandFigure {
  value: string
  label: string
  source: SourceLink
}

export interface CompetitionContent {
  eyebrow: string
  title: string
  lead: string
  columns: { name: string; fact: string; answer: string }
  rows: CompetitorRow[]
  note: string
  demandTitle: string
  demand: DemandFigure[]
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
  philosophy: PhilosophyContent
  advantages: AdvantagesContent
  business: Business
  competition: CompetitionContent
  market: Market
  faq: Faq
  cta: Cta
  footer: Footer
  businessModel: BusinessModel
  presentation: Presentation
}
