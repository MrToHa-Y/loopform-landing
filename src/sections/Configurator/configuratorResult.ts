import { formatNumber } from "@/components/Counter/formatNumber"
import { ru } from "@/content/ru"
import type { ConfiguratorState } from "@/content/types"

const priceRounding = 100

export function computeResult(state: ConfiguratorState) {
  const { base, heights } = ru.configurator
  const height = heights.find((item) => item.id === state.height)
  const weightKg = height?.weightKg ?? base.weightKg
  const price = Math.round((base.priceValue * weightKg) / base.weightKg / priceRounding) * priceRounding
  const caps = Math.round((weightKg * 1000) / base.capWeightGrams)

  return {
    price: `${formatNumber(price, 0)} ₸`,
    weight: `${formatNumber(weightKg, weightKg % 1 === 0 ? 0 : 1)} кг`,
    caps: formatNumber(caps, 0),
  }
}

function encodeBase64Url(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export function buildTelegramLink(state: ConfiguratorState) {
  const payload = [state.color, state.height, state.texture, state.cushion, state.angle].join(".")
  return `https://t.me/${ru.configurator.telegramBot}?start=${encodeBase64Url(payload)}`
}
