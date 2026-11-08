import { formatNumber } from "@/components/Counter/formatNumber"
import { ru } from "@/content/ru"
import type { CatalogModelId, ConfiguratorModel, ConfiguratorState, VariantChoice, VariantSelection } from "@/content/types"

const priceRounding = 100
const capRounding = 100

export function findModel(state: ConfiguratorState) {
  return modelById(state.model)
}

export function modelById(id: CatalogModelId) {
  return ru.configurator.models.find((model) => model.id === id) ?? ru.configurator.models[0]
}

export function defaultVariants(model: ConfiguratorModel | undefined): VariantSelection {
  return Object.fromEntries((model?.variants ?? []).map((group) => [group.id, group.defaultId ?? group.choices[0]?.id ?? ""]))
}

export function selectedChoices(state: ConfiguratorState) {
  const model = findModel(state)

  return (model?.variants ?? [])
    .map((group) => group.choices.find((choice) => choice.id === (state.variants[group.id] ?? group.defaultId)) ?? group.choices[0])
    .filter((choice): choice is VariantChoice => choice !== undefined)
}

export function computeResult(state: ConfiguratorState) {
  const { capWeightGrams } = ru.configurator
  const model = findModel(state)
  const baseWeight = model?.weightKg ?? 1
  const basePrice = model?.priceValue ?? 0
  const choices = selectedChoices(state)
  const weightKg = choices.reduce((value, choice) => choice.weightKg ?? value, baseWeight)
  const explicitPrice = choices.reduce<number | null>((value, choice) => choice.priceValue ?? value, null)
  const price = explicitPrice ?? Math.round((basePrice * weightKg) / baseWeight / priceRounding) * priceRounding
  const caps = Math.round((weightKg * 1000) / capWeightGrams / capRounding) * capRounding

  return {
    price: `${model?.pricePrefix ?? ""}${formatNumber(price, 0)} ₸`,
    weight: `${formatNumber(weightKg, weightKg % 1 === 0 ? 0 : 1)} кг`,
    caps: `≈ ${formatNumber(caps, 0)}`,
  }
}

function encodeBase64Url(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export function buildTelegramLink(state: ConfiguratorState) {
  const choices = selectedChoices(state).map((choice) => choice.id)
  const payload = [state.model, state.color, ...choices, state.texture, state.angle].join(".")

  return `https://t.me/${ru.configurator.telegramBot}?start=${encodeBase64Url(payload)}`
}
