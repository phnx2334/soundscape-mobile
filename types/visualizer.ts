import type * as THREE from 'three'

export type PaletteId = 'random' | 'ocean' | 'sunset' | 'forest' | 'neon' | 'aurora' | 'ember'
export type DetectionMode = 'bands' | 'beat' | 'mixed'

export interface ActiveCurve {
  group: THREE.Group
  fillMaterial: THREE.MeshBasicMaterial
  lineMaterial: THREE.LineBasicMaterial
  fillGeometry: THREE.ShapeGeometry
  lineGeometry: THREE.BufferGeometry
  vy: number             // vertical velocity (world-units/sec), positive = up
  alpha: number          // 1→0 fade
  fadeSpeed: number      // alpha/sec, applied only after peak
  undulationPhase: number    // per-curve sine phase, randomized at spawn
  basePts: THREE.Vector3[]   // original line vertex positions, used as undulation baseline
}
