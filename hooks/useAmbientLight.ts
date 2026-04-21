import {LightSensor} from 'expo-sensors'
import type {Subscription} from 'expo-sensors/build/DeviceSensor'
import {useEffect, useRef, useState} from 'react'

// LightSensor reports illuminance in lux.
// Dim room / dark indoors is typically under 10 lux; office lighting is ~300+.
const DARK_THRESHOLD = 10
const LIGHT_THRESHOLD = 30
const POLL_MS = 500

export interface UseAmbientLightReturn {
  ambientEnabled: boolean
  isDark: boolean
  ambientError: string | null
  available: boolean
  toggleAmbient: () => void
}

export function useAmbientLight(): UseAmbientLightReturn {
  const [ambientEnabled, setAmbientEnabled] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [ambientError, setAmbientError] = useState<string | null>(null)
  const [available, setAvailable] = useState(true)

  const subscriptionRef = useRef<Subscription | null>(null)
  const isDarkRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    LightSensor.isAvailableAsync()
      .then((ok) => {
        if (!cancelled) {
          setAvailable(ok)
          if (!ok) setAmbientError('Light sensor not available on this device')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAvailable(false)
          setAmbientError('Light sensor not available on this device')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ambientEnabled || !available) return

    setAmbientError(null)
    LightSensor.setUpdateInterval(POLL_MS)
    subscriptionRef.current = LightSensor.addListener(({illuminance}) => {
      if (isDarkRef.current && illuminance > LIGHT_THRESHOLD) {
        isDarkRef.current = false
        setIsDark(false)
      } else if (!isDarkRef.current && illuminance < DARK_THRESHOLD) {
        isDarkRef.current = true
        setIsDark(true)
      }
    })

    return () => {
      subscriptionRef.current?.remove()
      subscriptionRef.current = null
      isDarkRef.current = false
      setIsDark(false)
    }
  }, [ambientEnabled, available])

  function toggleAmbient() {
    if (!available) return
    setAmbientEnabled((prev) => !prev)
  }

  return {ambientEnabled, isDark, ambientError, available, toggleAmbient}
}
