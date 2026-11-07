import type { ConfiguratorOption } from "@/content/types"
import styles from "./Configurator.module.scss"

interface SegmentedProps<Id extends string> {
  options: ConfiguratorOption<Id>[]
  value: Id
  onChange: (value: Id) => void
}

export function Segmented<Id extends string>({ options, value, onChange }: SegmentedProps<Id>) {
  return (
    <div className={styles.segmented}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`${styles.segment} ${option.id === value ? styles.segmentActive : ""}`}
          aria-pressed={option.id === value}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
