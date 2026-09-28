import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Stars, Trail, Sphere, Torus } from "@react-three/drei";
import { useRef, useMemo } from "react";
import type { Group, Mesh, Points } from "three";
import * as THREE from "three";

/**
 * Hero scene: a large red blood cell at the centre representing HbA1c,
 * with glucose molecules (C6 rings) drifting in and binding to the cell
 * surface. An amber glucose-time ring orbits the cell, and a green
 * insulin pulse occasionally sweeps across — tying the 3D hero directly
 * to the dashboard's HbA1c and glucose-management story.
 */

function RedBloodCell() {
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.15;
      ref.current.rotation.x += dt * 0.05;
    }
  });

  // Biconcave-disc-ish shape: squashed sphere with a slight dimple via
  // a secondary inverted sphere. The result reads as a stylised RBC.
  return (
    <Float speed={1.2} floatIntensity={0.35} rotationIntensity={0.2}>
      <group ref={ref}>
        <Sphere args={[1.35, 64, 64]} scale={[1, 0.42, 1]}>
          <meshPhysicalMaterial
            color="#b91c1c"
            emissive="#450a0a"
            emissiveIntensity={0.4}
            roughness={0.35}
            metalness={0.1}
            transmission={0.15}
            thickness={0.8}
            clearcoat={0.6}
            clearcoatRoughness={0.2}
          />
        </Sphere>
        {/* Central dimple shade */}
        <Sphere args={[0.55, 32, 32]} scale={[1, 0.2, 1]} position={[0, 0.02, 0]}>
          <meshBasicMaterial color="#450a0a" transparent opacity={0.35} />
        </Sphere>
      </group>
    </Float>
  );
}

function GlucoseRing({ radius, tilt, speed, color }: { radius: number; tilt: number; speed: number; color: string }) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z += speed * 0.008;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
  });

  return (
    <group ref={ref} rotation={[Math.PI / 2 + tilt, 0, 0]}>
      <Torus args={[radius, 0.018, 12, 100]}>
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </Torus>
      {[...Array(8)].map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <Sphere key={i} args={[0.06, 12, 12]} position={[Math.cos(a) * radius, Math.sin(a) * radius, 0]}>
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
          </Sphere>
        );
      })}
    </group>
  );
}

function GlucoseMolecule({ angle, radiusOrbit, y, speed, color }: { angle: number; radiusOrbit: number; y: number; speed: number; color: string }) {
  const g = useRef<Group>(null);
  useFrame((state) => {
    if (!g.current) return;
    const t = state.clock.elapsedTime * speed + angle;
    g.current.position.x = Math.cos(t) * radiusOrbit;
    g.current.position.z = Math.sin(t) * radiusOrbit;
    g.current.position.y = y + Math.sin(t * 2) * 0.25;
    g.current.rotation.y += 0.04;
    g.current.rotation.x += 0.02;
  });

  return (
    <group ref={g}>
      {/* Hexagon ring representing C6 glucose */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.06, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} metalness={0.6} roughness={0.2} />
      </mesh>
      {[...Array(6)].map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <Sphere key={i} args={[0.045, 12, 12]} position={[Math.cos(a) * 0.18, Math.sin(a) * 0.18, 0]}>
            <meshStandardMaterial color="#f8fafc" emissive={color} emissiveIntensity={0.5} />
          </Sphere>
        );
      })}
    </group>
  );
}

function InsulinPulse({ radius, color }: { radius: number; color: string }) {
  const ring = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ring.current) return;
    const t = state.clock.elapsedTime * 0.8;
    const scale = 1 + (t % 1) * 0.35;
    ring.current.scale.set(scale, scale, scale);
    const mat = ring.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.6 * (1 - (t % 1));
  });

  return (
    <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.025, 16, 100]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
    </mesh>
  );
}

function GlucoseField() {
  const points = useRef<Points>(null);
  const count = 300;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!points.current) return;
    points.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#22d3ee" size={0.035} transparent opacity={0.5} />
    </points>
  );
}

function Scene() {
  const group = useRef<Group>(null);
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.04;
  });

  return (
    <group ref={group}>
      <RedBloodCell />

      {/* Glucose molecules drifting in two orbital bands */}
      {[...Array(5)].map((_, i) => (
        <GlucoseMolecule key={`a${i}`} angle={(i / 5) * Math.PI * 2} radiusOrbit={2.5} y={0.35} speed={0.5} color="#22d3ee" />
      ))}
      {[...Array(4)].map((_, i) => (
        <GlucoseMolecule key={`b${i}`} angle={(i / 4) * Math.PI * 2 + 0.7} radiusOrbit={3.2} y={-0.35} speed={-0.35} color="#f59e0b" />
      ))}

      {/* Glucose time rings */}
      <GlucoseRing radius={2.5} tilt={0.25} speed={0.6} color="#22d3ee" />
      <GlucoseRing radius={3.2} tilt={-0.35} speed={-0.45} color="#f59e0b" />
      <GlucoseRing radius={3.9} tilt={0.55} speed={0.3} color="#e11d48" />

      {/* Insulin pulse sweeping outward */}
      <InsulinPulse radius={2.0} color="#a3e635" />

      {/* Ambient glucose dust */}
      <GlucoseField />
    </group>
  );
}

export function HeroScene() {
  return (
    <Canvas camera={{ position: [0, 0.5, 7.2], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.45} />
      <pointLight position={[5, 4, 5]} intensity={1.2} color="#22d3ee" />
      <pointLight position={[-5, -3, -4]} intensity={0.9} color="#e11d48" />
      <pointLight position={[0, 4, -4]} intensity={0.6} color="#a3e635" />
      <Stars radius={40} depth={30} count={1500} factor={2.2} fade speed={0.4} />
      <Scene />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.4} />
    </Canvas>
  );
}
