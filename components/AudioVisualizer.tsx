import {GLView} from 'expo-gl'
import {useEffect, useRef, useState} from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import {Gesture, GestureDetector, GestureHandlerRootView} from 'react-native-gesture-handler'
import {SafeAreaView} from 'react-native-safe-area-context'
import {ParameterSlider} from '@/components/ParameterSlider'
import {useAmbientLight} from '@/hooks/useAmbientLight'
import {useAudioAnalysis} from '@/hooks/useAudioAnalysis'
import {useAudioGraph} from '@/hooks/useAudioGraph'
import {useOverlayVisibility} from '@/hooks/useOverlayVisibility'
import {useThreeScene} from '@/hooks/useThreeScene'
import {PALETTES} from '@/lib/palettes'
import {
  AMPLITUDE_THRESHOLD,
  BAND_COOLDOWN_MS,
  BEAT_CURVES_PER_BEAT,
  BEAT_THRESHOLD,
  GRAVITY,
  UNDULATION_AMPLITUDE,
  UNDULATION_FREQ,
  UNDULATION_SPEED,
} from '@/lib/visualizerConstants'
import type {DetectionMode, PaletteId} from '@/types/visualizer'

export default function AudioVisualizer() {
  const {width, height} = useWindowDimensions()

  const [recording, setRecording] = useState(false)
  const [recordingError, setRecordingError] = useState<string | null>(null)

  const [palette, setPalette] = useState<PaletteId>('random')
  const paletteRef = useRef<PaletteId>('random')
  function selectPalette(id: PaletteId) {
    setPalette(id)
    paletteRef.current = id
  }

  const [detectionMode, setDetectionMode] = useState<DetectionMode>('mixed')
  const detectionModeRef = useRef<DetectionMode>('mixed')
  function selectMode(m: DetectionMode) {
    setDetectionMode(m)
    detectionModeRef.current = m
  }

  const [undulation, setUndulation] = useState(true)
  const undulationRef = useRef(true)

  const [amplitudeThreshold, setAmplitudeThreshold] = useState(AMPLITUDE_THRESHOLD)
  const amplitudeThresholdRef = useRef(AMPLITUDE_THRESHOLD)
  const [gravity, setGravity] = useState(GRAVITY)
  const gravityRef = useRef(GRAVITY)
  const [undulationSpeed, setUndulationSpeed] = useState(UNDULATION_SPEED)
  const undulationSpeedRef = useRef(UNDULATION_SPEED)
  const [undulationAmplitude, setUndulationAmplitude] = useState(UNDULATION_AMPLITUDE)
  const undulationAmplitudeRef = useRef(UNDULATION_AMPLITUDE)
  const [undulationFreq, setUndulationFreq] = useState(UNDULATION_FREQ)
  const undulationFreqRef = useRef(UNDULATION_FREQ)
  const [beatThreshold, setBeatThreshold] = useState(BEAT_THRESHOLD)
  const beatThresholdRef = useRef(BEAT_THRESHOLD)
  const [bandCooldownMs, setBandCooldownMs] = useState(BAND_COOLDOWN_MS)
  const bandCooldownMsRef = useRef(BAND_COOLDOWN_MS)
  const [beatCurvesPerBeat, setBeatCurvesPerBeat] = useState(BEAT_CURVES_PER_BEAT)
  const beatCurvesPerBeatRef = useRef(BEAT_CURVES_PER_BEAT)

  const invertColorsRef = useRef(false)

  const {controlsVisible, revealControls} = useOverlayVisibility(true)
  const {glRef, sceneRef, rendererRef, cameraRef, rafRef, curvesRef, onContextCreate} =
    useThreeScene(width, height)
  const {analyserRef, openStream, closeStream} = useAudioGraph()
  const {startLoop, stopLoop, resetUndulation} = useAudioAnalysis({
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
  })
  const {ambientEnabled, isDark, ambientError, available: ambientAvailable, toggleAmbient} =
    useAmbientLight()

  useEffect(() => {
    const shouldInvert = ambientEnabled && isDark
    invertColorsRef.current = shouldInvert
    const renderer = rendererRef.current
    if (renderer) {
      renderer.setClearColor(shouldInvert ? 0xffffff : 0x000000, 1)
    }
  }, [ambientEnabled, isDark, rendererRef])

  function setUndulationMode(val: boolean) {
    undulationRef.current = val
    setUndulation(val)
    if (!val) resetUndulation()
  }

  async function startRecording() {
    if (recording) return
    setRecordingError(null)
    try {
      await openStream()
      startLoop()
      setRecording(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setRecordingError(msg)
      closeStream()
    }
  }

  function stopRecording() {
    stopLoop()
    closeStream()
    setRecording(false)
  }

  useEffect(() => {
    amplitudeThresholdRef.current = amplitudeThreshold
    gravityRef.current = gravity
    undulationSpeedRef.current = undulationSpeed
    undulationAmplitudeRef.current = undulationAmplitude
    undulationFreqRef.current = undulationFreq
    beatThresholdRef.current = beatThreshold
    bandCooldownMsRef.current = bandCooldownMs
    beatCurvesPerBeatRef.current = beatCurvesPerBeat
  }, [
    amplitudeThreshold,
    gravity,
    undulationSpeed,
    undulationAmplitude,
    undulationFreq,
    beatThreshold,
    bandCooldownMs,
    beatCurvesPerBeat,
  ])

  useEffect(() => {
    return () => {
      stopLoop()
      closeStream()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function resetParams() {
    setAmplitudeThreshold(AMPLITUDE_THRESHOLD)
    setGravity(GRAVITY)
    setUndulationSpeed(UNDULATION_SPEED)
    setUndulationAmplitude(UNDULATION_AMPLITUDE)
    setUndulationFreq(UNDULATION_FREQ)
    setBeatThreshold(BEAT_THRESHOLD)
    setBandCooldownMs(BAND_COOLDOWN_MS)
    setBeatCurvesPerBeat(BEAT_CURVES_PER_BEAT)
  }

  const tap = Gesture.Tap().onEnd(() => {
    revealControls()
  })

  return (
    <GestureHandlerRootView style={styles.root}>
      <GestureDetector gesture={tap}>
        <View style={styles.root}>
          <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />

          <SafeAreaView
            pointerEvents={controlsVisible ? 'auto' : 'none'}
            style={[styles.overlay, {opacity: controlsVisible ? 1 : 0}]}
          >
            <View style={styles.overlayInner}>
              <View style={styles.row}>
                <Pressable
                  onPress={recording ? stopRecording : startRecording}
                  style={({pressed}) => [
                    styles.primaryBtn,
                    recording ? styles.primaryBtnStop : styles.primaryBtnStart,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.primaryBtnText}>
                    {recording ? 'Stop Recording' : 'Start Recording'}
                  </Text>
                </Pressable>
              </View>

              {recordingError && <Text style={styles.error}>{recordingError}</Text>}

              <ControlRow title="Color">
                {(Object.keys(PALETTES) as PaletteId[]).map((id) => (
                  <PillButton
                    key={id}
                    label={PALETTES[id].label}
                    active={palette === id}
                    onPress={() => selectPalette(id)}
                  />
                ))}
              </ControlRow>

              <ControlRow title="Detection">
                {(['bands', 'beat', 'mixed'] as DetectionMode[]).map((m) => (
                  <PillButton
                    key={m}
                    label={m === 'bands' ? 'Bands' : m === 'beat' ? 'Beat' : 'Mixed'}
                    active={detectionMode === m}
                    onPress={() => selectMode(m)}
                  />
                ))}
              </ControlRow>

              <ControlRow title="Ambient">
                <PillButton
                  label={ambientEnabled ? 'On' : 'Off'}
                  active={ambientEnabled}
                  disabled={!ambientAvailable}
                  onPress={toggleAmbient}
                />
                {ambientError && <Text style={styles.muted}>{ambientError}</Text>}
                {ambientEnabled && !ambientError && (
                  <Text style={styles.muted}>{isDark ? 'dark' : 'light'}</Text>
                )}
              </ControlRow>

              <ControlRow title="Undulation">
                <PillButton label="On" active={undulation} onPress={() => setUndulationMode(true)} />
                <PillButton label="Off" active={!undulation} onPress={() => setUndulationMode(false)} />
              </ControlRow>

              <View style={styles.paramsHeader}>
                <Text style={styles.sectionLabel}>Parameters</Text>
                <Pressable onPress={resetParams} style={styles.resetBtn}>
                  <Text style={styles.resetText}>reset</Text>
                </Pressable>
              </View>
              <View style={styles.paramsGrid}>
                <ParameterSlider
                  label="Sensitivity"
                  value={amplitudeThreshold}
                  min={0}
                  max={255}
                  step={5}
                  display={String(amplitudeThreshold)}
                  onChange={setAmplitudeThreshold}
                />
                <ParameterSlider
                  label="Gravity"
                  value={gravity}
                  min={0.5}
                  max={12}
                  step={0.5}
                  display={gravity.toFixed(1)}
                  onChange={setGravity}
                />
                <ParameterSlider
                  label="Wave Speed"
                  value={undulationSpeed}
                  min={1}
                  max={20}
                  step={1}
                  display={String(undulationSpeed)}
                  onChange={setUndulationSpeed}
                />
                <ParameterSlider
                  label="Wave Height"
                  value={undulationAmplitude}
                  min={0}
                  max={2}
                  step={0.05}
                  display={undulationAmplitude.toFixed(2)}
                  onChange={setUndulationAmplitude}
                />
                <ParameterSlider
                  label="Wave Freq"
                  value={undulationFreq}
                  min={1}
                  max={30}
                  step={1}
                  display={String(undulationFreq)}
                  onChange={setUndulationFreq}
                />
                <ParameterSlider
                  label="Beat Sens"
                  value={beatThreshold}
                  min={1.1}
                  max={3}
                  step={0.1}
                  display={beatThreshold.toFixed(1)}
                  onChange={setBeatThreshold}
                />
                <ParameterSlider
                  label="Band Rate"
                  value={bandCooldownMs}
                  min={100}
                  max={2000}
                  step={100}
                  display={`${bandCooldownMs}ms`}
                  onChange={setBandCooldownMs}
                />
                <ParameterSlider
                  label="Curves/Beat"
                  value={beatCurvesPerBeat}
                  min={1}
                  max={8}
                  step={1}
                  display={String(beatCurvesPerBeat)}
                  onChange={setBeatCurvesPerBeat}
                />
              </View>
            </View>
          </SafeAreaView>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  )
}

function ControlRow({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <View style={styles.controlRow}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.controlRowButtons}>{children}</View>
    </View>
  )
}

function PillButton({
  label,
  active,
  disabled,
  onPress,
}: {
  label: string
  active: boolean
  disabled?: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({pressed}) => [
        styles.pill,
        active && styles.pillActive,
        disabled && styles.pillDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.pillText,
          active && styles.pillTextActive,
          disabled && styles.pillTextDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#000'},
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  overlayInner: {
    padding: 16,
    gap: 14,
    alignItems: 'center',
  },
  row: {flexDirection: 'row', gap: 12, alignItems: 'center'},
  primaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 4,
    borderWidth: 1,
  },
  primaryBtnStart: {backgroundColor: '#004', borderColor: '#44f'},
  primaryBtnStop: {backgroundColor: '#400', borderColor: '#f44'},
  primaryBtnText: {color: '#fff', fontSize: 14, letterSpacing: 1},
  pressed: {opacity: 0.6},
  error: {color: '#f66', fontSize: 11, textAlign: 'center', maxWidth: 320},
  controlRow: {alignItems: 'center', gap: 6},
  controlRowButtons: {flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center'},
  sectionLabel: {color: '#666', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase'},
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: 'transparent',
  },
  pillActive: {backgroundColor: '#222', borderColor: '#666'},
  pillDisabled: {borderColor: '#222'},
  pillText: {color: '#aaa', fontSize: 12, letterSpacing: 0.5},
  pillTextActive: {color: '#fff'},
  pillTextDisabled: {color: '#444'},
  muted: {color: '#666', fontSize: 10},
  paramsHeader: {flexDirection: 'row', alignItems: 'center', gap: 12},
  resetBtn: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  resetText: {color: '#888', fontSize: 10, letterSpacing: 0.5},
  paramsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
})
