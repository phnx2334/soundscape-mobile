import * as THREE from 'three'
import type {ActiveCurve} from '@/types/visualizer'
import {GRAVITY, LINE_STYLE} from '@/lib/visualizerConstants'

// energy 0-1 = normalized loudness of that band
export function spawnCurve(scene: THREE.Scene, energy: number, colorFn: () => THREE.Color, cameraTop: number): ActiveCurve {
  const color = colorFn()

  // Curve wiggle scales with loudness — quiet sounds make subtle shapes
  const amplitude = LINE_STYLE === 'curvy' ? 0.03 + energy * 0.25 : 0.15 + energy * 0.55
  const cpCount = LINE_STYLE === 'curvy' ? 5 + Math.floor(Math.random() * 4) : 7 + Math.floor(Math.random() * 5)
  const ctrl3d = Array.from({length: cpCount}, (_, i) => {
    const x = -1 + (i / (cpCount - 1)) * 2
    const y = (Math.random() - 0.5) * 2 * amplitude
    return new THREE.Vector3(x, y, 0)
  })

  const pts3d = LINE_STYLE === 'curvy'
    ? new THREE.CatmullRomCurve3(ctrl3d).getPoints(80)
    : ctrl3d
  const pts2d = pts3d.map((p) => new THREE.Vector2(p.x, p.y))

  // Filled shape: curve on top, closed far below (camera clips at -ASPECT)
  const shape = new THREE.Shape(pts2d)
  shape.lineTo(1, -10)
  shape.lineTo(-1, -10)
  shape.closePath()

  const fillGeometry = new THREE.ShapeGeometry(shape)
  const fillMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const fillMesh = new THREE.Mesh(fillGeometry, fillMaterial)

  const lineGeometry = new THREE.BufferGeometry().setFromPoints(pts3d)
  const lineMaterial = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 1,
  })
  const lineMesh = new THREE.Line(lineGeometry, lineMaterial)

  const group = new THREE.Group()
  group.add(fillMesh)
  group.add(lineMesh)

  const startY = -(cameraTop + 0.5)
  const peakYMin = -cameraTop * 0.5
  const peakYMax = cameraTop * 0.9
  const peakY = peakYMin + energy * (peakYMax - peakYMin)
  const vy = Math.sqrt(2 * GRAVITY * (peakY - startY))
  // High energy curves linger longer after peak; low energy fades fast
  const fadeSpeed = 0.4 - energy * 0.3 + Math.random() * 0.05

  group.position.y = startY
  scene.add(group)

  return {
    group,
    fillMaterial,
    lineMaterial,
    fillGeometry,
    lineGeometry,
    vy,
    alpha: 1,
    fadeSpeed,
    undulationPhase: Math.random() * Math.PI * 2,
    basePts: pts3d,
  }
}
