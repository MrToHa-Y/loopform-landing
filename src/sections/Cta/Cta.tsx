import { useState } from "react"
import type { FormEvent } from "react"
import { MagneticButton } from "@/components/MagneticButton/MagneticButton"
import { StackSection } from "@/components/StackSection/StackSection"
import { ru } from "@/content/ru"
import type { CtaField } from "@/content/types"
import styles from "./Cta.module.scss"

type Errors = Partial<Record<CtaField["name"], boolean>>

export function Cta() {
  const [errors, setErrors] = useState<Errors>({})
  const [sent, setSent] = useState(false)
  const { cta } = ru

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const form = event.currentTarget
    const data = new FormData(form)
    const nextErrors: Errors = {}

    cta.fields.forEach((field) => {
      if (!String(data.get(field.name) ?? "").trim()) {
        nextErrors[field.name] = true
      }
    })

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length === 0) {
      setSent(true)
      form.reset()
      window.setTimeout(() => setSent(false), 3200)
    }
  }

  return (
    <StackSection id="cta" theme="light" label={ru.sections[16]?.title ?? ""} className={styles.root}>
      <div className={styles.inner}>
        <h2 className={styles.title}>{cta.title}</h2>
        <form className={styles.form} noValidate onSubmit={handleSubmit}>
          {cta.fields.map((field) => (
            <label key={field.name} className={styles.field}>
              <span className={styles.label}>{field.label}</span>
              <input
                className={styles.input}
                name={field.name}
                autoComplete={field.autoComplete}
                aria-invalid={errors[field.name] ?? false}
                aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
              />
              {errors[field.name] ? (
                <span id={`${field.name}-error`} className={styles.error}>
                  {cta.requiredMessage}
                </span>
              ) : null}
            </label>
          ))}
          <MagneticButton>
            <button type="submit" className={styles.submit}>
              {cta.submitLabel}
            </button>
          </MagneticButton>
        </form>
      </div>
      <p className={`${styles.toast} ${sent ? styles.toastVisible : ""}`} role="status">
        {sent ? cta.successMessage : ""}
      </p>
    </StackSection>
  )
}
