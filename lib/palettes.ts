import * as THREE from 'three'
import type {PaletteId} from '@/types/visualizer'
import {BAND_COUNT} from '@/lib/visualizerConstants'

export const PALETTES: Record<PaletteId, {label: string; color: () => THREE.Color}> = {
  random: {
    label: 'Random',
    color: () => new THREE.Color().setHSL(Math.random(), 0.85, 0.5 + Math.random() * 0.2),
  },
  ocean: {
    label: 'Ocean',
    color: () => new THREE.Color().setHSL(0.5 + Math.random() * 0.14, 0.8, 0.45 + Math.random() * 0.25),
  },
  sunset: {
    label: 'Sunset',
    color: () => {
      const hue = Math.random() < 0.5 ? Math.random() * 0.08 : 0.82 + Math.random() * 0.18
      return new THREE.Color().setHSL(hue, 0.9, 0.52 + Math.random() * 0.18)
    },
  },
  forest: {
    label: 'Forest',
    color: () => new THREE.Color().setHSL(0.25 + Math.random() * 0.14, 0.65, 0.35 + Math.random() * 0.3),
  },
  neon: {
    label: 'Neon',
    color: () => {
      const hues = [0.55, 0.83, 0.33, 0.97]
      const hue = hues[Math.floor(Math.random() * hues.length)] + (Math.random() - 0.5) * 0.04
      return new THREE.Color().setHSL(hue, 1.0, 0.55 + Math.random() * 0.1)
    },
  },
  aurora: {
    label: 'Aurora',
    color: () => {
      const hues = [0.38, 0.45, 0.52, 0.72, 0.82]
      const hue = hues[Math.floor(Math.random() * hues.length)] + (Math.random() - 0.5) * 0.05
      return new THREE.Color().setHSL(hue, 0.75, 0.45 + Math.random() * 0.25)
    },
  },
  ember: {
    label: 'Ember',
    color: () => {
      const hue = Math.random() * 0.1  // 0–36° = deep red to orange-yellow
      return new THREE.Color().setHSL(hue, 0.95, 0.4 + Math.random() * 0.3)
    },
  },
}

function buildBandBoundaries(): [number, number][] {
  const bands: [number, number][] = []
  const logMin = Math.log(1)
  const logMax = Math.log(256)
  for (let i = 0; i < BAND_COUNT; i++) {
    const lo = Math.round(Math.exp(logMin + (i / BAND_COUNT) * (logMax - logMin)))
    const hi = Math.round(Math.exp(logMin + ((i + 1) / BAND_COUNT) * (logMax - logMin)))
    bands.push([lo, hi])
  }
  return bands
}

export const BAND_BOUNDARIES = buildBandBoundaries()
