"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment } from "@react-three/drei"
import { useRef, useMemo } from "react"
import type * as THREE from "three"

// Generate clustered data points
function generateClusteredData() {
  const clusters = [
    { center: [2, 2, 2], color: "#ff6b6b", count: 30 },
    { center: [-2, -1, 1], color: "#4ecdc4", count: 25 },
    { center: [1, -2, -1], color: "#45b7d1", count: 35 },
    { center: [-1, 2, -2], color: "#f9ca24", count: 20 },
    { center: [0, 0, 3], color: "#6c5ce7", count: 28 },
  ]

  const points: Array<{ position: [number, number, number]; color: string; size: number }> = []

  clusters.forEach((cluster) => {
    for (let i = 0; i < cluster.count; i++) {
      const spread = 1.5
      const position: [number, number, number] = [
        cluster.center[0] + (Math.random() - 0.5) * spread,
        cluster.center[1] + (Math.random() - 0.5) * spread,
        cluster.center[2] + (Math.random() - 0.5) * spread,
      ]
      points.push({
        position,
        color: cluster.color,
        size: Math.random() * 0.1 + 0.05,
      })
    }
  })

  return points
}

function DataPoint({ position, color, size }: { position: [number, number, number]; color: string; size: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

function ScatterPlot() {
  const dataPoints = useMemo(() => generateClusteredData(), [])

  return (
    <>
      {dataPoints.map((point, index) => (
        <DataPoint key={index} position={point.position} color={point.color} size={point.size} />
      ))}
    </>
  )
}

export default function ThreeScatterPlot() {
  return (
    <Canvas camera={{ position: [8, 8, 8], fov: 60 }}>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      <ScatterPlot />

      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} minDistance={5} maxDistance={20} />

      <Environment preset="studio" />

      {/* Grid helper for reference */}
      <gridHelper args={[10, 10]} position={[0, -3, 0]} />
    </Canvas>
  )
}
