import { Suspense, lazy } from "react"
import { AppProviders } from "@/app/AppProviders"
import { Header } from "@/components/Header/Header"
import { MiniProductCard } from "@/components/MiniProductCard/MiniProductCard"
import { Preloader } from "@/components/Preloader/Preloader"
import { ProgressRail } from "@/components/ProgressRail/ProgressRail"
import { RotatingBadge } from "@/components/RotatingBadge/RotatingBadge"
import { Business } from "@/sections/Business/Business"
import { Catalog } from "@/sections/Catalog/Catalog"
import { Collection } from "@/sections/Collection/Collection"
import { Configurator } from "@/sections/Configurator/Configurator"
import { Cta } from "@/sections/Cta/Cta"
import { Faq } from "@/sections/Faq/Faq"
import { Footer } from "@/sections/Footer/Footer"
import { Hero } from "@/sections/Hero/Hero"
import { Intro } from "@/sections/Intro/Intro"
import { Manifesto } from "@/sections/Manifesto/Manifesto"
import { Market } from "@/sections/Market/Market"
import { Passport } from "@/sections/Passport/Passport"
import { Problem } from "@/sections/Problem/Problem"
import { Process } from "@/sections/Process/Process"

const Stage = lazy(() => import("@/three/Stage"))
const PrintTest = lazy(() => import("@/three/PrintTest"))

const isPrintTest = new URLSearchParams(window.location.search).get("test") === "print"

function App() {
  if (isPrintTest) {
    return (
      <Suspense fallback={null}>
        <PrintTest />
      </Suspense>
    )
  }

  return (
    <AppProviders>
      <Preloader />
      <Header />
      <main>
        <Intro />
        <Hero />
        <Collection />
        <Catalog />
        <Problem />
        <Process />
        <Passport />
        <Configurator />
        <Manifesto />
        <Business />
        <Market />
        <Faq />
        <Cta />
      </main>
      <Footer />
      <Suspense fallback={null}>
        <Stage />
      </Suspense>
      <MiniProductCard />
      <RotatingBadge />
      <ProgressRail />
    </AppProviders>
  )
}

export default App
