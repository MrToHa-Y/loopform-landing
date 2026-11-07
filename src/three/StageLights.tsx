import { Environment, Lightformer } from "@react-three/drei"

export function StageLights() {
  return (
    <>
      <Environment resolution={128} frames={1} environmentIntensity={0.6}>
        <Lightformer form="rect" intensity={5} position={[0, 5, -3]} scale={[12, 6, 1]} />
        <Lightformer form="rect" intensity={3} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 6, 1]} />
        <Lightformer form="rect" intensity={2.4} position={[6, 0, 2]} rotation-y={-Math.PI / 2} scale={[8, 6, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[0, 0, 7]} rotation-y={Math.PI} scale={[10, 8, 1]} />
      </Environment>
      <directionalLight
        position={[4, 6, 5]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
    </>
  )
}
