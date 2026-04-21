import type {ExpoWebGLRenderingContext} from 'expo-gl'
import {useCallback, useEffect, useRef} from 'react'
import * as THREE from 'three'
import type {ActiveCurve} from '@/types/visualizer'

export function useThreeScene(width: number, height: number) {
  const glRef = useRef<ExpoWebGLRenderingContext | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null)
  const rafRef = useRef<number | null>(null)
  const curvesRef = useRef<ActiveCurve[]>([])

  const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    glRef.current = gl

    // expo-gl provides a WebGL2-compatible context; Three.js can drive it
    // directly when we hand it the raw context and a minimal canvas shim.
    const canvasShim = {
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
      style: {},
      clientWidth: gl.drawingBufferWidth,
      clientHeight: gl.drawingBufferHeight,
      addEventListener: () => {},
      removeEventListener: () => {},
      getContext: () => gl,
    }

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasShim as unknown as HTMLCanvasElement,
      context: gl as unknown as WebGL2RenderingContext,
      antialias: true,
    })
    renderer.setPixelRatio(1) // expo-gl drawing buffer is already at device scale
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false)
    renderer.setClearColor(0x000000, 1)

    const scene = new THREE.Scene()
    const aspect = gl.drawingBufferHeight / gl.drawingBufferWidth
    const camera = new THREE.OrthographicCamera(-1, 1, aspect, -aspect, 0.1, 10)
    camera.position.z = 1

    rendererRef.current = renderer
    sceneRef.current = scene
    cameraRef.current = camera

    renderer.render(scene, camera)
    gl.endFrameEXP()
  }, [])

  useEffect(() => {
    const gl = glRef.current
    const renderer = rendererRef.current
    const camera = cameraRef.current
    if (!gl || !renderer || !camera || width <= 0 || height <= 0) return

    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false)
    const aspect = gl.drawingBufferHeight / gl.drawingBufferWidth
    camera.top = aspect
    camera.bottom = -aspect
    camera.updateProjectionMatrix()
  }, [width, height])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      curvesRef.current.forEach((c) => {
        c.fillGeometry.dispose()
        c.lineGeometry.dispose()
        c.fillMaterial.dispose()
        c.lineMaterial.dispose()
      })
      curvesRef.current = []
      rendererRef.current?.dispose()
      rendererRef.current = null
      sceneRef.current = null
      cameraRef.current = null
      glRef.current = null
    }
  }, [])

  return {glRef, sceneRef, rendererRef, cameraRef, rafRef, curvesRef, onContextCreate}
}
