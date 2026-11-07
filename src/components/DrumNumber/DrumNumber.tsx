import type { CSSProperties } from "react"
import styles from "./DrumNumber.module.scss"

interface DrumNumberProps {
  text: string
  className?: string
}

const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]

export function DrumNumber({ text, className }: DrumNumberProps) {
  const characters = Array.from(text)

  return (
    <span className={`${styles.root} ${className ?? ""}`}>
      <span className="sr-only">{text}</span>
      {characters.map((character, index) => {
        const position = characters.length - index

        if (!/\d/.test(character)) {
          return (
            <span key={`static-${position}`} className={styles.static} aria-hidden="true">
              {character}
            </span>
          )
        }

        return (
          <span key={`digit-${position}`} className={styles.window} aria-hidden="true">
            <span className={styles.reel} style={{ "--digit": character } as CSSProperties}>
              {digits.map((digit) => (
                <span key={digit} className={styles.digit}>
                  {digit}
                </span>
              ))}
            </span>
          </span>
        )
      })}
    </span>
  )
}
