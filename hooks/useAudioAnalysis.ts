import type {ExpoWebGLRenderingContext} from 'expo-gl'
import {useRef} from 'react'
import type {AnalyserNode} from 'react-native-audio-api'
import * as THREE from 'three'
import {spawnCurve} from '@/lib/curveSpawner'
import {BAND_BOUNDARIES, PALETTES} from '@/lib/palettes'
import {
  BEAT_COOLDOWN_MS,
  BEAT_HISTORY_SIZE,
  BEAT_MIN_ENERGY,
  UNDULATION_SIGMA,
} from '@/lib/visualizerConstants'
import type {ActiveCurve, DetectionMode, PaletteId} from '@/types/visualizer'

interface UseAudioAnalysisParams {
  glRef: React.RefObject<ExpoWebGLRenderingContext | null>
  sceneRef: React.RefObject<THREE.Scene | null>
  rendererRef: React.RefObject<THREE.WebGLRenderer | null>
  cameraRef: React.RefObject<THREE.OrthographicCamera | null>
  rafRef: React.RefObject<number | null>
  analyserRef: React.RefObject<AnalyserNode | null>
  curvesRef: React.RefObject<ActiveCurve[]>
  paletteRef: React.RefObject<PaletteId>
  detectionModeRef: React.RefObject<DetectionMode>
  undulationRef: React.RefObject<boolean>
  invertColorsRef: React.RefObject<boolean>
  amplitudeThresholdRef: React.RefObject<number>
  gravityRef: React.RefObject<number>
  undulationSpeedRef: React.RefObject<number>
  undulationAmplitudeRef: React.RefObject<number>
  undulationFreqRef: React.RefObject<number>
  beatThresholdRef: React.RefObject<number>
  bandCooldownMsRef: React.RefObject<number>
  beatCurvesPerBeatRef: React.RefObject<number>
}

export function useAudioAnalysis({
  glRef,
  sceneRef,
  rendererRef,
  cameraRef,
  rafRef,
  analyserRef,
  curvesRef,
  paletteRef,
  detectionModeRef,
  undulationRef,
  invertColorsRef,
  amplitudeThresholdRef,
  gravityRef,
  undulationSpeedRef,
  undulationAmplitudeRef,
  undulationFreqRef,
  beatThresholdRef,
  bandCooldownMsRef,
  beatCurvesPerBeatRef,
}: UseAudioAnalysisParams) {
  const bandCooldownsRef = useRef<number[]>(new Array(BAND_BOUNDARIES.length).fill(0))
  const lastTimeRef = useRef<number>(0)
  const beatEnergyHistoryRef = useRef<number[]>([])
  const beatCooldownRef = useRef<number>(0)

  function colorFn(): THREE.Color {
    const c = PALETTES[paletteRef.current].color()
    if (invertColorsRef.current) {
      c.r = 1 - c.r
      c.g = 1 - c.g
      c.b = 1 - c.b
    }
    return c
  }

  function startLoop() {
    const analyser = analyserRef.current
    if (!analyser) return
    const freqData = new Uint8Array(analyser.frequencyBinCount)
    lastTimeRef.current = performance.now()

    function animate(now: number) {
      rafRef.current = requestAnimationFrame(animate)

      const scene = sceneRef.current
      const renderer = rendererRef.current
      const camera = cameraRef.current
      const gl = glRef.current
      const currentAnalyser = analyserRef.current
      if (!scene || !renderer || !camera || !gl || !currentAnalyser) return

      const delta = Math.min((now - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = now

      currentAnalyser.getByteFrequencyData(freqData)

      let frameEnergy = 0
      {
        let total = 0
        for (let i = 0; i < freqData.length; i++) total += freqData[i]
        frameEnergy = total / (freqData.length * 255)
      }

      const toRemove: number[] = []

      curvesRef.current.forEach((curve, idx) => {
        curve.vy -= gravityRef.current * delta
        curve.group.position.y += curve.vy * delta

        if (undulationRef.current) {
          curve.undulationPhase += undulationSpeedRef.current * delta
          const pos = curve.lineGeometry.attributes.position as THREE.BufferAttribute
          for (let i = 0; i < curve.basePts.length; i++) {
            const x = curve.basePts[i].x
            const envelope = Math.exp(-(x * x) / (2 * UNDULATION_SIGMA * UNDULATION_SIGMA))
            const dy =
              undulationAmplitudeRef.current *
              Math.sin(x * undulationFreqRef.current + curve.undulationPhase) *
              envelope *
              frameEnergy
            pos.setY(i, curve.basePts[i].y + dy)
          }
          pos.needsUpdate = true
        }

        if (curve.vy < 0) {
          curve.alpha -= curve.fadeSpeed * delta
          const a = Math.max(0, curve.alpha)
          curve.fillMaterial.opacity = a * 0.35
          curve.lineMaterial.opacity = a
        }

        if (curve.alpha <= 0) {
          scene.remove(curve.group)
          curve.fillGeometry.dispose()
          curve.lineGeometry.dispose()
          curve.fillMaterial.dispose()
          curve.lineMaterial.dispose()
          toRemove.push(idx)
        }
      })

      for (let i = toRemove.length - 1; i >= 0; i--) {
        curvesRef.current.splice(toRemove[i], 1)
      }

      const nowMs = now

      if (detectionModeRef.current === 'bands' || detectionModeRef.current === 'mixed') {
        BAND_BOUNDARIES.forEach(([lo, hi], bandIdx) => {
          let sum = 0
          for (let b = lo; b < hi; b++) sum += freqData[b]
          const avg = sum / (hi - lo)
          const energy = avg / 255
          if (avg > amplitudeThresholdRef.current && nowMs > bandCooldownsRef.current[bandIdx]) {
            curvesRef.current.push(spawnCurve(scene, energy, colorFn, camera.top))
            bandCooldownsRef.current[bandIdx] = nowMs + bandCooldownMsRef.current
          }
        })
      }

      if (detectionModeRef.current === 'beat' || detectionModeRef.current === 'mixed') {
        const currentEnergy = frameEnergy
        const history = beatEnergyHistoryRef.current
        history.push(currentEnergy)
        if (history.length > BEAT_HISTORY_SIZE) history.shift()
        const avgEnergy = history.reduce((a, b) => a + b, 0) / history.length

        if (
          currentEnergy > beatThresholdRef.current * avgEnergy &&
          currentEnergy > BEAT_MIN_ENERGY &&
          nowMs > beatCooldownRef.current
        ) {
          const energy = Math.min(currentEnergy / (avgEnergy * beatThresholdRef.current), 1)
          for (let i = 0; i < beatCurvesPerBeatRef.current; i++) {
            curvesRef.current.push(spawnCurve(scene, energy, colorFn, camera.top))
          }
          beatCooldownRef.current = nowMs + BEAT_COOLDOWN_MS
        }
      }

      renderer.render(scene, camera)
      gl.endFrameEXP()
    }

    rafRef.current = requestAnimationFrame(animate)
  }

  function stopLoop() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  function resetUndulation() {
    curvesRef.current.forEach((c) => {
      const pos = c.lineGeometry.attributes.position as THREE.BufferAttribute
      c.basePts.forEach((p, i) => pos.setY(i, p.y))
      pos.needsUpdate = true
    })
  }

  return {startLoop, stopLoop, resetUndulation}
}
