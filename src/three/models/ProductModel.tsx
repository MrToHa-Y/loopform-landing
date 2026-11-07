import { useGLTF } from "@react-three/drei"
import { useMemo } from "react"
import { Box3, Vector3 } from "three"
import type { Material, Mesh, Object3D } from "three"
import type { CatalogModelId } from "@/content/types"
import { getModelParts } from "@/three/models/modelLibrary"
import { availableModels } from "@/three/models/modelAvailability"

interface ProductModelProps {
  model: CatalogModelId
  material: Material
  depthMaterial: Material
  cushionMaterial: Material | null
  cushionVisible: boolean
  castShadow: boolean
}

interface GltfModelProps {
  path: string
  height: number
  material: Material
  depthMaterial: Material
}

function isMesh(object: Object3D): object is Mesh {
  return (object as Mesh).isMesh === true
}

function GltfModel({ path, height, material, depthMaterial }: GltfModelProps) {
  const { scene } = useGLTF(path, "/draco/")

  const prepared = useMemo(() => {
    const clone = scene.clone(true)
    const bounds = new Box3().setFromObject(clone)
    const size = bounds.getSize(new Vector3())
    const center = bounds.getCenter(new Vector3())
    const scale = height / Math.max(size.y, 0.0001)

    clone.scale.setScalar(scale)
    clone.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale)
    clone.traverse((object) => {
      if (isMesh(object)) {
        object.material = material
        object.customDepthMaterial = depthMaterial
        object.castShadow = true
      }
    })

    return clone
  }, [scene, height, material, depthMaterial])

  return <primitive object={prepared} />
}

export function ProductModel({ model, material, depthMaterial, cushionMaterial, cushionVisible, castShadow }: ProductModelProps) {
  const parts = getModelParts(model)
  const path = availableModels.get(model)

  if (path) {
    return <GltfModel path={path} height={parts.size.y} material={material} depthMaterial={depthMaterial} />
  }

  return (
    <>
      <mesh geometry={parts.main} material={material} customDepthMaterial={depthMaterial} castShadow={castShadow} receiveShadow />
      {parts.cushion && cushionMaterial ? (
        <mesh geometry={parts.cushion} material={cushionMaterial} visible={cushionVisible} castShadow={castShadow} />
      ) : null}
    </>
  )
}
