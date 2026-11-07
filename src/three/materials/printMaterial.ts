import { Color, DoubleSide, MeshDepthMaterial, MeshPhysicalMaterial, MeshStandardMaterial, RGBADepthPacking } from "three"
import type { IUniform } from "three"
import printClip from "./printClip.glsl?raw"
import printColor from "./printColor.glsl?raw"
import printEmissive from "./printEmissive.glsl?raw"
import printFragmentPars from "./printFragmentPars.glsl?raw"
import printNormal from "./printNormal.glsl?raw"
import printRoughness from "./printRoughness.glsl?raw"
import printVertexMain from "./printVertexMain.glsl?raw"
import printVertexPars from "./printVertexPars.glsl?raw"

export const defaultLayerHeight = 0.0016

export interface PrintUniforms {
  uProgress: IUniform<number>
  uDirection: IUniform<number>
  uMinY: IUniform<number>
  uMaxY: IUniform<number>
  uLayerHeight: IUniform<number>
  uEdgeColor: IUniform<Color>
  uEdgeWidth: IUniform<number>
  uBaseColor: IUniform<Color>
  uSpeckle: IUniform<Color[]>
  uSpeckleAmount: IUniform<number>
  uRelief: IUniform<number>
  uRoughMin: IUniform<number>
  uRoughMax: IUniform<number>
  uTime: IUniform<number>
  uLegStretch: IUniform<number>
  uSeatY: IUniform<number>
}

export interface PrintOptions {
  color: Color
  speckle: [Color, Color, Color]
  edgeColor: Color
  speckleAmount?: number
  roughMin?: number
  roughMax?: number
  relief?: number
  translucent?: boolean
}

export interface PrintBundle {
  material: MeshStandardMaterial
  depthMaterial: MeshDepthMaterial
  uniforms: PrintUniforms
}

function injectVertex(source: string) {
  return source
    .replace("#include <common>", `#include <common>\n${printVertexPars}`)
    .replace("#include <begin_vertex>", printVertexMain)
}

export function createPrintMaterial(options: PrintOptions): PrintBundle {
  const uniforms: PrintUniforms = {
    uProgress: { value: 1 },
    uDirection: { value: 1 },
    uMinY: { value: 0 },
    uMaxY: { value: 1 },
    uLayerHeight: { value: defaultLayerHeight },
    uEdgeColor: { value: options.edgeColor.clone() },
    uEdgeWidth: { value: 0.012 },
    uBaseColor: { value: options.color.clone() },
    uSpeckle: { value: options.speckle.map((color) => color.clone()) },
    uSpeckleAmount: { value: options.speckleAmount ?? 0.035 },
    uRelief: { value: options.relief ?? 1 },
    uRoughMin: { value: options.roughMin ?? 0.55 },
    uRoughMax: { value: options.roughMax ?? 0.8 },
    uTime: { value: 0 },
    uLegStretch: { value: 1 },
    uSeatY: { value: 0.45 },
  }

  const material = options.translucent
    ? new MeshPhysicalMaterial({ transmission: 0.6, thickness: 0.3, roughness: 0.35, side: DoubleSide })
    : new MeshStandardMaterial({ side: DoubleSide })

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = injectVertex(shader.vertexShader)
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${printFragmentPars}`)
      .replace("#include <clipping_planes_fragment>", `#include <clipping_planes_fragment>\n${printClip}`)
      .replace("#include <color_fragment>", printColor)
      .replace("#include <roughnessmap_fragment>", printRoughness)
      .replace("#include <normal_fragment_maps>", printNormal)
      .replace("#include <emissivemap_fragment>", printEmissive)
  }

  material.customProgramCacheKey = () => (options.translucent ? "print-physical" : "print-standard")

  const depthMaterial = new MeshDepthMaterial({ depthPacking: RGBADepthPacking })

  depthMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = injectVertex(shader.vertexShader)
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uProgress;\nuniform float uMinY;\nuniform float uMaxY;\nvarying vec3 vObjPos;\nvarying vec3 vUpView;")
      .replace(
        "#include <clipping_planes_fragment>",
        "#include <clipping_planes_fragment>\nif (vObjPos.y > mix(uMinY, uMaxY, uProgress)) discard;",
      )
  }

  depthMaterial.customProgramCacheKey = () => "print-depth"

  return { material, depthMaterial, uniforms }
}
