import {useCallback, useEffect, useRef, useState} from 'react'

const AUTO_HIDE_MS = 3000

export function useOverlayVisibility(initialVisible = true) {
  const [controlsVisible, setControlsVisible] = useState(initialVisible)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), AUTO_HIDE_MS)
  }, [])

  const revealControls = useCallback(() => {
    setControlsVisible(true)
    scheduleHide()
  }, [scheduleHide])

  useEffect(() => {
    if (initialVisible) scheduleHide()
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [initialVisible, scheduleHide])

  return {controlsVisible, revealControls}
}
