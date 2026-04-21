'use client'

import {useEffect, useRef, useState} from 'react'
import {useAmbientLight} from '@/app/hooks/useAmbientLight'
import {useFullscreen} from '@/app/hooks/useFullscreen'
import {useThreeScene} from '@/app/hooks/useThreeScene'
import {useAudioStream} from '@/app/hooks/useAudioStream'
import {useAudioAnalysis} from '@/app/hooks/useAudioAnalysis'
import {PALETTES} from '@/app/lib/palettes'
import {
  AMPLITUDE_THRESHOLD,
  BAND_COOLDOWN_MS,
  BEAT_CURVES_PER_BEAT,
  BEAT_THRESHOLD,
  GRAVITY,
  UNDULATION_AMPLITUDE,
  UNDULATION_FREQ,
  UNDULATION_SPEED,
} from '@/app/lib/visualizerConstants'
import type {AudioSource, DetectionMode, PaletteId} from '@/app/types/visualizer'

export default function AudioVisualizer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [recording, setRecording] = useState(false)

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

  const [audioSource, setAudioSource] = useState<AudioSource>('system')
  const audioSourceRef = useRef<AudioSource>('system')
  function selectSource(s: AudioSource) {
    setAudioSource(s)
    audioSourceRef.current = s
  }

  const [undulation, setUndulation] = useState(true)
  const undulationRef = useRef(true)
  const [recordingError, setRecordingError] = useState<string | null>(null)

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

  const {isFullscreen, controlsVisible, toggleFullscreen, revealControls} = useFullscreen(containerRef)
  const {canvasRef, sceneRef, rendererRef, cameraRef, rafRef, curvesRef, canvasSize, startResize} = useThreeScene(isFullscreen)
  const {analyserRef, openStream, closeStream} = useAudioStream()
  const {startLoop, stopLoop, resetUndulation} = useAudioAnalysis({
    sceneRef, rendererRef, cameraRef, rafRef, analyserRef, curvesRef,
    paletteRef, detectionModeRef, undulationRef,
    amplitudeThresholdRef, gravityRef,
    undulationSpeedRef, undulationAmplitudeRef, undulationFreqRef,
    beatThresholdRef, bandCooldownMsRef, beatCurvesPerBeatRef,
  })
  const {ambientEnabled, isDark, ambientError, toggleAmbient} = useAmbientLight()

  function setUndulationMode(val: boolean) {
    undulationRef.current = val
    setUndulation(val)
    if (!val) resetUndulation()
  }

  async function startRecording() {
    if (recording) return
    setRecordingError(null)
    try {
      await openStream(audioSourceRef.current)
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
  }, [amplitudeThreshold, gravity, undulationSpeed, undulationAmplitude, undulationFreq, beatThreshold, bandCooldownMs, beatCurvesPerBeat])

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

  const sliderRow = (
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    display: string,
    tooltip: string,
    onChange: (v: number) => void,
  ) => (
    <div key={label} title={tooltip} style={{display: 'flex', flexDirection: 'column', gap: 4, width: 148}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <span style={{color: '#555', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase'}}>{label}</span>
        <span style={{color: '#888', fontSize: 11, fontVariantNumeric: 'tabular-nums'}}>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{width: '100%', cursor: 'pointer', accentColor: '#666', margin: 0}}
      />
    </div>
  )

  const btnStyle = (active: boolean, disabled = false) => ({
    padding: '6px 14px',
    background: active ? '#222' : 'transparent',
    color: active ? '#fff' : disabled ? '#444' : '#888',
    border: `1px solid ${active ? '#666' : '#333'}`,
    borderRadius: 4,
    cursor: disabled ? 'default' : 'pointer',
    fontSize: 12,
    letterSpacing: 0.5,
  } as const)

  return (
    <div
      ref={containerRef}
      onMouseMove={revealControls}
      onTouchStart={revealControls}
      style={{
        position: 'relative',
        width: '100vw',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        flexDirection: 'column',
        gap: isFullscreen ? 0 : 20,
        padding: isFullscreen ? 0 : '40px 0',
        cursor: isFullscreen && !controlsVisible ? 'none' : 'auto',
      }}
    >
      <div style={{position: 'relative', flexShrink: 0}}>
        <canvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
          style={{
            display: 'block',
            border: isFullscreen ? 'none' : '1px solid #111',
            filter: ambientEnabled && isDark ? 'invert(1)' : 'none',
            transition: 'filter 0.6s',
          }}
        />
        {!isFullscreen && (
          <div
            onPointerDown={startResize}
            title="Drag to resize"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 18,
              height: 18,
              cursor: 'se-resize',
              background: 'linear-gradient(135deg, transparent 40%, #555 40%)',
            }}
          />
        )}
      </div>
      <div
        style={isFullscreen ? {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '32px 20px 20px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.88))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          opacity: controlsVisible ? 1 : 0,
          transition: 'opacity 0.4s',
          pointerEvents: controlsVisible ? 'auto' : 'none',
        } : {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        {/* Primary actions row */}
        <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
          <button
            onClick={recording ? stopRecording : startRecording}
            style={{
              padding: '10px 28px',
              background: recording ? '#400' : '#004',
              color: '#fff',
              border: `1px solid ${recording ? '#f44' : '#44f'}`,
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14,
              letterSpacing: 1,
            }}
          >
            {recording ? 'Stop Recording' : 'Start Recording'}
          </button>
          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            aria-pressed={isFullscreen}
            title="Toggle fullscreen (F)"
            style={{
              padding: '10px 12px',
              background: 'transparent',
              color: '#888',
              border: '1px solid #333',
              borderRadius: 4,
              cursor: 'pointer',
              lineHeight: 0,
            }}
          >
            {isFullscreen ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M5 1v4H1M9 1v4h4M9 13v-4h4M5 13v-4H1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M1 5V1h4M9 1h4v4M13 9v4H9M5 13H1V9" />
              </svg>
            )}
          </button>
        </div>

        {recordingError && (
          <div style={{color: '#f44', fontSize: 11, maxWidth: 320, textAlign: 'center'}}>
            {recordingError}
          </div>
        )}

        {/* Source row */}
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
          <span style={{color: '#444', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase'}}>Source</span>
          <div style={{display: 'flex', gap: 8}}>
            {(['microphone', 'system'] as AudioSource[]).map((s) => (
              <button
                key={s}
                onClick={() => !recording && selectSource(s)}
                style={btnStyle(audioSource === s, recording)}
              >
                {s === 'microphone' ? 'Mic' : 'System'}
              </button>
            ))}
          </div>
        </div>

        {/* Color row */}
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
          <span style={{color: '#444', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase'}}>Color</span>
          <div style={{display: 'flex', gap: 8}}>
            {(Object.keys(PALETTES) as PaletteId[]).map((id) => (
              <button key={id} onClick={() => selectPalette(id)} style={btnStyle(palette === id)}>
                {PALETTES[id].label}
              </button>
            ))}
          </div>
        </div>

        {/* Detection row */}
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
          <span style={{color: '#444', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase'}}>Detection</span>
          <div style={{display: 'flex', gap: 8}}>
            {(['bands', 'beat', 'mixed'] as DetectionMode[]).map((m) => (
              <button key={m} onClick={() => selectMode(m)} style={btnStyle(detectionMode === m)}>
                {m === 'bands' ? 'Bands' : m === 'beat' ? 'Beat' : 'Mixed'}
              </button>
            ))}
          </div>
        </div>

        {/* Ambient row */}
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
          <span style={{color: '#444', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase'}}>Ambient</span>
          <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
            <button onClick={toggleAmbient} style={btnStyle(ambientEnabled)}>
              {ambientEnabled ? 'On' : 'Off'}
            </button>
            {ambientError && (
              <span style={{color: '#844', fontSize: 10}}>{ambientError}</span>
            )}
            {ambientEnabled && !ambientError && (
              <span style={{color: '#444', fontSize: 10}}>{isDark ? 'dark' : 'light'}</span>
            )}
          </div>
        </div>

        {/* Undulation row */}
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
          <span style={{color: '#444', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase'}}>Undulation</span>
          <div style={{display: 'flex', gap: 8}}>
            {([true, false] as boolean[]).map((val) => (
              <button key={String(val)} onClick={() => setUndulationMode(val)} style={btnStyle(undulation === val)}>
                {val ? 'On' : 'Off'}
              </button>
            ))}
          </div>
        </div>

        {/* Parameters section */}
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <span style={{color: '#444', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase'}}>Parameters</span>
            <button
              onClick={resetParams}
              title="Reset all parameters to defaults"
              style={{padding: '2px 8px', background: 'transparent', color: '#444', border: '1px solid #2a2a2a', borderRadius: 3, cursor: 'pointer', fontSize: 10, letterSpacing: 0.5}}
            >
              reset
            </button>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px'}}>
            {sliderRow('Sensitivity', amplitudeThreshold, 0, 255, 5, String(amplitudeThreshold),
              'Minimum volume a frequency band must reach before spawning a curve. Lower = reacts to quieter sounds.',
              setAmplitudeThreshold)}
            {sliderRow('Gravity', gravity, 0.5, 12, 0.5, gravity.toFixed(1),
              'Downward pull on curves after they spawn. Higher = curves fall faster and spend less time on screen.',
              setGravity)}
            {sliderRow('Wave Speed', undulationSpeed, 1, 20, 1, String(undulationSpeed),
              'How fast the wave animation cycles. Higher = faster, more energetic rippling motion.',
              setUndulationSpeed)}
            {sliderRow('Wave Height', undulationAmplitude, 0, 2, 0.05, undulationAmplitude.toFixed(2),
              'Maximum vertical displacement of the wave. Higher = taller, more dramatic undulation.',
              setUndulationAmplitude)}
            {sliderRow('Wave Freq', undulationFreq, 1, 30, 1, String(undulationFreq),
              'Number of wave cycles across each curve. Higher = more tightly packed oscillations.',
              setUndulationFreq)}
            {sliderRow('Beat Sens', beatThreshold, 1.1, 3.0, 0.1, beatThreshold.toFixed(1),
              'How much louder a moment must be vs. recent average to count as a beat. Lower = triggers more easily.',
              setBeatThreshold)}
            {sliderRow('Band Rate', bandCooldownMs, 100, 2000, 100, `${bandCooldownMs}ms`,
              'Minimum time between spawns per frequency band. Lower = faster, denser curve generation.',
              setBandCooldownMs)}
            {sliderRow('Curves/Beat', beatCurvesPerBeat, 1, 8, 1, String(beatCurvesPerBeat),
              'How many curves burst out on each detected beat. Higher = bigger explosions on loud hits.',
              setBeatCurvesPerBeat)}
          </div>
        </div>
      </div>
    </div>
  )
}
