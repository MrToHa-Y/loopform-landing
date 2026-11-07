import type { ReactNode } from "react"
import styles from "./Configurator.module.scss"

interface PanelGroupProps {
  title: string
  active: boolean
  pinned?: boolean
  children: ReactNode
}

export function PanelGroup({ title, active, pinned = false, children }: PanelGroupProps) {
  return (
    <fieldset className={`${styles.group} ${active ? styles.groupActive : ""} ${pinned ? styles.groupPinned : ""}`}>
      <legend className={styles.groupTitle}>{title}</legend>
      {children}
    </fieldset>
  )
}
