import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { bus } from '../lib/bus.js'

function Model({ dirty }) {
  const { scene } = useGLTF('/model/yuki.glb', true)

  // Clone so we can safely retint materials without touching the cache.
  const model = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((o) => {
      if (o.isMesh && o.material) {
        o.material = o.material.clone()
        o.castShadow = true
        if (o.material.color) o.material.userData._base = o.material.color.clone()
      }
    })
    return c
  }, [scene])

  // Normalize to a consistent size + center at origin.
  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    return { scale: 2.8 / maxDim, offset: center }
  }, [model])

  // Dirty → muddy tint; clean → restore.
  useMemo(() => {
    model.traverse((o) => {
      if (o.isMesh && o.material?.color && o.material.userData._base) {
        const base = o.material.userData._base
        if (dirty) {
          o.material.color.copy(base).multiplyScalar(0.62)
          o.material.color.r = Math.min(1, o.material.color.r + 0.12)
          o.material.color.g = Math.min(1, o.material.color.g + 0.05)
        } else {
          o.material.color.copy(base)
        }
      }
    })
  }, [model, dirty])

  const spin = useRef()
  const bob = useRef(0)
  const jump = useRef(null) // { t, dur, hops, height, turns }

  // taps / celebrations make the model hop; 'popcorn' is the full happy-pig routine
  useEffect(
    () =>
      bus.on('hop', ({ kind }) => {
        jump.current =
          kind === 'popcorn'
            ? { t: 0, dur: 1.9, hops: 4, height: 0.55, turns: 2 }
            : { t: 0, dur: 0.42, hops: 1, height: 0.22, turns: 0 }
      }),
    [],
  )

  useFrame((_, dt) => {
    const g = spin.current
    if (!g) return
    bob.current += dt
    let y = Math.sin(bob.current * 1.6) * 0.06
    let speed = 0.6
    let squash = 1
    const j = jump.current
    if (j) {
      j.t += dt
      const p = Math.min(1, j.t / j.dur)
      const phase = (p * j.hops) % 1
      const arc = Math.sin(phase * Math.PI)
      y += arc * j.height * (1 - p * 0.35)
      squash = 1 + arc * 0.08
      speed += (j.turns * Math.PI * 2) / j.dur
      if (p >= 1) jump.current = null
    }
    g.rotation.y += dt * speed
    g.position.y = y
    g.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash))
  })

  return (
    <group ref={spin}>
      <group scale={scale} position={[-offset.x * scale, -offset.y * scale, -offset.z * scale]}>
        <primitive object={model} />
      </group>
    </group>
  )
}

export default function YukiModel({ dirty }) {
  return (
    <>
      <ambientLight intensity={0.95} />
      <directionalLight position={[3, 5, 4]} intensity={1.15} castShadow />
      <directionalLight position={[-4, 2, -3]} intensity={0.4} />
      <Model dirty={dirty} />
      <ContactShadows position={[0, -1.35, 0]} opacity={0.35} scale={7} blur={2.6} far={3} />
    </>
  )
}

useGLTF.preload('/model/yuki.glb', true)
