import {useRef} from 'react'
import {
  AnalyserNode,
  AudioContext,
  AudioManager,
  AudioRecorder,
  RecorderAdapterNode,
} from 'react-native-audio-api'

export function useAudioGraph() {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const recorderRef = useRef<AudioRecorder | null>(null)
  const adapterRef = useRef<RecorderAdapterNode | null>(null)

  async function openStream() {
    let perm = await AudioManager.checkRecordingPermissions()
    if (perm !== 'Granted') {
      perm = await AudioManager.requestRecordingPermissions()
    }
    if (perm !== 'Granted') {
      throw new Error('Microphone permission denied. Enable it in system settings to visualize audio.')
    }

    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'measurement',
      iosOptions: ['allowBluetoothHFP', 'defaultToSpeaker', 'mixWithOthers'],
    })
    await AudioManager.setAudioSessionActivity(true)

    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.88

    const adapter = ctx.createRecorderAdapter()
    adapter.connect(analyser)

    const recorder = new AudioRecorder()
    recorder.connect(adapter)
    recorder.start()

    audioCtxRef.current = ctx
    analyserRef.current = analyser
    adapterRef.current = adapter
    recorderRef.current = recorder
  }

  function closeStream() {
    try {
      recorderRef.current?.stop()
    } catch {}
    try {
      recorderRef.current?.disconnect()
    } catch {}
    audioCtxRef.current?.close().catch(() => {})
    AudioManager.setAudioSessionActivity(false).catch(() => {})

    audioCtxRef.current = null
    analyserRef.current = null
    adapterRef.current = null
    recorderRef.current = null
  }

  return {audioCtxRef, analyserRef, openStream, closeStream}
}
