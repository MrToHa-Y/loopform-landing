import { formatNumber } from "@/components/Counter/formatNumber"
import { ru } from "@/content/ru"
import type { ConfiguratorState } from "@/content/types"

const priceRounding = 100
const noCaps = "—"

export function findModel(state: ConfiguratorState) {
  return ru.configurator.models.find((model) => model.id === state.model) ?? ru.configurator.models[0]
}

export function computeResult(state: ConfiguratorState) {
  const { heights, capWeightGrams } = ru.configurator
  const model = findModel(state)
  const baseWeight = model?.weightKg ?? 1
  const basePrice = model?.priceValue ?? 0
  const height = model?.adjustable ? heights.find((item) => item.id === state.height) : undefined
  const weightKg = height?.weightKg ?? baseWeight
  const price = Math.round((basePrice * weightKg) / baseWeight / priceRounding) * priceRounding
  const caps = Math.round((weightKg * 1000) / capWeightGrams)

  return {
    price: `${model?.pricePrefix ?? ""}${formatNumber(price, 0)} ₸`,
    weight: `${formatNumber(weightKg, weightKg % 1 === 0 ? 0 : 1)} кг`,
    caps: model?.fromCaps ? formatNumber(caps, 0) : noCaps,
  }
}

function encodeBase64Url(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export function buildTelegramLink(state: ConfiguratorState) {
  const payload = [state.model, state.color, state.height, state.texture, state.cushion, state.angle].join(".")
  return `https://t.me/${ru.configurator.telegramBot}?start=${encodeBase64Url(payload)}`
}
