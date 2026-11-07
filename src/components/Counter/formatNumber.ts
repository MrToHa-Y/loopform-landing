export function formatNumber(value: number, decimals: number) {
  const fixed = value.toFixed(decimals)
  const [whole = "0", fraction] = fixed.split(".")
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ")

  return fraction ? `${grouped},${fraction}` : grouped
}
