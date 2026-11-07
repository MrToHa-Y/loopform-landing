import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "@/app/App"
import "@/styles/globals.scss"

const container = document.getElementById("root")

if (window.location.search.includes("debug")) {
  document.documentElement.dataset.debug = "true"
}

if (!container) {
  throw new Error("Root container is missing")
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
