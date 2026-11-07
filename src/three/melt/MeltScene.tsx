import { MeltBlob } from "@/three/melt/MeltBlob"
import { MeltCards } from "@/three/melt/MeltCards"
import { MeltRings } from "@/three/melt/MeltRings"

export function MeltScene() {
  return (
    <>
      <MeltRings />
      <MeltBlob />
      <MeltCards />
    </>
  )
}
