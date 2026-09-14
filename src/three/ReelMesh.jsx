import { forwardRef, useMemo } from 'react'

/**
 * The film-reel geometry, shared by the loader (camera flies into it) and the
 * site background (it's "carried over" and winds as you scroll). Purely visual
 * — the parent attaches the ref and animates rotation/position.
 */
const ReelMesh = forwardRef(function ReelMesh(
  { color = '#e9b872', tube = 0.14, dim = 1, opacity = 1 },
  ref
) {
  const transparent = opacity < 1
  const holes = useMemo(
    () =>
      [0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2
        return [Math.cos(a) * 1.18, Math.sin(a) * 1.18, 0]
      }),
    []
  )
  const spokes = useMemo(
    () => [0, 1, 2, 3, 4].map((i) => (i / 5) * Math.PI * 2 - Math.PI / 2 + Math.PI / 5),
    []
  )
  const mat = { color, metalness: 0.92, roughness: 0.28, transparent, opacity }
  return (
    <group ref={ref}>
      <mesh>
        <torusGeometry args={[2, tube, 18, 72]} />
        <meshStandardMaterial {...mat} emissive={color} emissiveIntensity={0.12 * dim} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.58, tube * 0.7, 14, 48]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.3, tube * 0.75, 14, 40]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {holes.map((p, i) => (
        <mesh key={i} position={p}>
          <torusGeometry args={[0.42, tube * 0.55, 12, 36]} />
          <meshStandardMaterial {...mat} />
        </mesh>
      ))}
      {spokes.map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 1.2, Math.sin(a) * 1.2, 0]} rotation={[0, 0, a]}>
          <boxGeometry args={[1.2, 0.07, 0.07]} />
          <meshStandardMaterial {...mat} />
        </mesh>
      ))}
    </group>
  )
})

export default ReelMesh
