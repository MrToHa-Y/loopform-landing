import { useScrollStore } from "@/state/scrollStore"
import { Actor } from "@/three/Actor"
import { actorModels } from "@/three/actors"

export function ConfiguratorActor() {
  const model = useScrollStore((state) => state.configurator.model)

  actorModels.configChair = model

  return <Actor key={model} id="configChair" model={model} />
}
