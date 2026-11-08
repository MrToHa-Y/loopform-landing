import { useMemo } from "react"
import { useScrollStore } from "@/state/scrollStore"
import { Actor } from "@/three/Actor"
import { actorModels, actorOptions } from "@/three/actors"
import { shapeKey } from "@/three/models/modelLibrary"

export function ConfiguratorActor() {
  const model = useScrollStore((state) => state.configurator.model)
  const variants = useScrollStore((state) => state.configurator.variants)
  const key = shapeKey(model, variants)
  const options = useMemo(() => ({ ...variants }), [key])

  actorModels.configChair = model
  actorOptions.configChair = options

  return <Actor key={key} id="configChair" model={model} options={options} />
}
