import type { CatalogModelId } from "@/content/types"

export const productPhotos: Partial<Record<CatalogModelId, string>> = {
  tolqyn: "/images/products/tolqyn.webp",
  tas: "/images/products/tas.webp",
  qum: "/images/products/qum.webp",
  kol: "/images/products/kol.webp",
  saule: "/images/products/saule.webp",
  japyraq: "/images/products/japyraq.webp",
  saiabaq: "/images/products/saiabaq.webp",
  ornek: "/images/products/ornek.webp",
  uya: "/images/products/uya.webp",
}

const meltOrder = [
  "/images/products/tolqyn.webp",
  "/images/process/flakes.webp",
  "/images/products/saule.webp",
  "/images/products/uya.webp",
  "/images/process/sorting.webp",
  "/images/products/qum.webp",
  "/images/products/ornek.webp",
  "/images/process/printing.webp",
  "/images/products/tas.webp",
  "/images/products/saiabaq.webp",
  "/images/process/tag.webp",
  "/images/products/kol.webp",
  "/images/products/japyraq.webp",
]

export const meltPhotos = [...meltOrder, ...meltOrder.slice(0, 5)]
