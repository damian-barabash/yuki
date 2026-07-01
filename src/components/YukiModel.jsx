import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

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
    return { scale: 3.1 / maxDim, offset: center }
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
  useFrame((_, dt) => {
    if (spin.current) {
      spin.current.rotation.y += dt * 0.6
      bob.current += dt
      spin.current.position.y = Math.sin(bob.current * 1.6) * 0.06
    }
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
