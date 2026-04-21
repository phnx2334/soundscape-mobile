export const CANVAS_W = 400
export const CANVAS_H = 700
export const ASPECT = CANVAS_H / CANVAS_W  // 1.75  →  y ∈ [-1.75, 1.75] in ortho space

export const BAND_COUNT = 6               // sub-bass / bass / low-mid / mid / upper-mid / treble
export const AMPLITUDE_THRESHOLD = 125    // only respond to meaningful sound, ignore background noise
export const BAND_COOLDOWN_MS = 800       // at most one curve per band every 800 ms
export const LINE_STYLE: 'curvy' | 'angular' = 'curvy'
export const GRAVITY = 3.5               // world-units/sec² downward pull

export const BEAT_HISTORY_SIZE = 43      // rolling window ~1 second at 60fps
export const BEAT_THRESHOLD = 1.4        // must be 40% louder than recent average
export const BEAT_MIN_ENERGY = 0.05      // ignore near-silence
export const BEAT_COOLDOWN_MS = 300      // max ~3 beats per second
export const BEAT_CURVES_PER_BEAT = 2    // curves spawned per detected beat

export const UNDULATION_SPEED = 6         // phase advance per second
export const UNDULATION_FREQ = 10         // spatial wavenumber — higher = more oscillation cycles
export const UNDULATION_SIGMA = 0.45      // gaussian envelope width — lower = more concentrated at center
export const UNDULATION_AMPLITUDE = 0.65  // max Y displacement in world units
