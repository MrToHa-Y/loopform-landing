import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { CustomEase } from "gsap/CustomEase"
import { Flip } from "gsap/Flip"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"
import { easeCurves, eases } from "@/animation/tokens"

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip, CustomEase)

CustomEase.create(eases.out, easeCurves.out)
CustomEase.create(eases.inOut, easeCurves.inOut)

ScrollTrigger.config({ ignoreMobileResize: true })

export { CustomEase, Flip, ScrollTrigger, SplitText, gsap, useGSAP }
