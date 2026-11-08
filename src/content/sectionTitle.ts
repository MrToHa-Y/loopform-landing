import { ru } from "@/content/ru"
import type { SectionId } from "@/content/types"

export function sectionTitle(id: SectionId) {
  return ru.sections.find((section) => section.id === id)?.title ?? ""
}
