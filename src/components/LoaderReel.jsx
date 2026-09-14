import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import ReelMesh from '../three/ReelMesh'

/**
 * A real 3D film reel the camera flies INTO through the open hub.
 * `progressRef.current` (0..1) drives the fly-through so it stays perfectly in
 * sync with the loading counter without re-rendering the canvas every frame.
 */

function Reel({ scale = 1, z = 0, spin = 0.6, color = '#c9a267', tube = 0.14 }) {
  const g = useRef()
  useFrame((_, d) => {
    if (g.current) g.current.rotation.z += d * spin
  })
  return (
    <group position={[0, 0, z]} scale={scale}>
      <ReelMesh ref={g} color={color} tube={tube} />
    </group>
  )
}

function Dust({ count = 400 }) {
  const ref = useRef()
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const a = Math.sin(i * 12.9898) * 43758.5453
      const b = Math.sin(i * 78.233) * 12543.213
      const c = Math.sin(i * 39.425) * 24634.634
      arr[i * 3] = (a - Math.floor(a) - 0.5) * 20
      arr[i * 3 + 1] = (b - Math.floor(b) - 0.5) * 14
      arr[i * 3 + 2] = (c - Math.floor(c) - 0.5) * 24 - 6
    }
    return arr
  }, [count])
  useFrame((s) => {
    if (ref.current) ref.current.rotation.z = s.clock.elapsedTime * 0.03
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#e9d3a8" transparent opacity={0.6} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

function Fly({ progressRef }) {
  useFrame(({ camera }) => {
    const p = progressRef.current || 0
    const e = 1 - Math.pow(1 - p, 2.2)
    camera.position.z = 7.5 - e * 8.6 // 7.5 → -1.1 (through the hub)
    camera.position.x = Math.sin(e * 2.5) * 0.12
    camera.position.y = Math.cos(e * 2.0) * 0.08
    camera.lookAt(0, 0, -3)
  })
  return null
}

export default function LoaderReel({ progressRef }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 7.5], fov: 55 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#050506']} />
      <fog attach="fog" args={['#050506', 6, 22]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[4, 5, 6]} intensity={1.6} color="#fff2dc" />
      <pointLight position={[0, 0, 5]} intensity={30} color="#e9b872" />
      <pointLight position={[-6, -3, -4]} intensity={12} color="#3a4a6a" />

      <Dust />
      <Reel scale={1} z={0} spin={0.6} />
      <Reel scale={2.4} z={-9} spin={-0.25} color="#5b5346" tube={0.1} />
      <Fly progressRef={progressRef} />
    </Canvas>
  )
}
