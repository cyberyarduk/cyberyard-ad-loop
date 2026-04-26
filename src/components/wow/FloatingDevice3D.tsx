import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox } from "@react-three/drei";
import { Suspense, useRef } from "react";
import type { Mesh } from "three";

/**
 * A stylised wearable display: a rounded screen with a glowing emissive face,
 * floating and slowly rotating. Pure geometry — no external 3D assets needed.
 */
const Device = () => {
  const screen = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (screen.current) {
      const t = clock.getElapsedTime();
      // gentle hue pulse on the glowing face
      const mat = screen.current.material as { emissiveIntensity: number };
      mat.emissiveIntensity = 1.4 + Math.sin(t * 1.3) * 0.5;
    }
  });

  return (
    <Float speed={1.4} rotationIntensity={0.6} floatIntensity={1.2}>
      <group rotation={[0.15, -0.4, 0]}>
        {/* Body / bezel */}
        <RoundedBox args={[2.4, 3.4, 0.32]} radius={0.28} smoothness={6}>
          <meshStandardMaterial color="#0a0a14" metalness={0.85} roughness={0.25} />
        </RoundedBox>
        {/* Glowing screen face */}
        <mesh ref={screen} position={[0, 0, 0.17]}>
          <planeGeometry args={[2.05, 3.05]} />
          <meshStandardMaterial
            color="#fdb913"
            emissive="#fdb913"
            emissiveIntensity={1.6}
            toneMapped={false}
          />
        </mesh>
        {/* Strap top */}
        <mesh position={[0, 1.95, 0]}>
          <boxGeometry args={[0.9, 0.5, 0.18]} />
          <meshStandardMaterial color="#1a1a26" metalness={0.6} roughness={0.5} />
        </mesh>
        {/* Strap bottom */}
        <mesh position={[0, -1.95, 0]}>
          <boxGeometry args={[0.9, 0.5, 0.18]} />
          <meshStandardMaterial color="#1a1a26" metalness={0.6} roughness={0.5} />
        </mesh>
      </group>
    </Float>
  );
};

const FloatingDevice3D = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.45} />
          <directionalLight position={[5, 5, 5]} intensity={1.1} color="#ffffff" />
          <pointLight position={[-4, -2, 3]} intensity={1.5} color="#ec4899" />
          <pointLight position={[4, 3, 2]} intensity={1.2} color="#8b5cf6" />
          <Device />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default FloatingDevice3D;
