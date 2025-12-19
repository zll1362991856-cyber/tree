import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ParticleTree: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const starRef = useRef<THREE.Mesh>(null);
  
  // Tree Parameters
  const count = 3000;
  const height = 12;
  const radius = 5;

  // Generate particle positions and colors
  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const colorGreen = new THREE.Color('#00ff88');
    const colorGold = new THREE.Color('#ffcc00');
    const colorRed = new THREE.Color('#ff0055');
    const tempColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const yNorm = i / count; 
      const angle = yNorm * Math.PI * 30; 
      const r = (1 - yNorm) * radius; 
      
      const randomR = r + (Math.random() - 0.5) * 1.5 * (1 - yNorm);
      const randomAngle = angle + (Math.random() - 0.5) * 0.5;

      const x = Math.cos(randomAngle) * randomR;
      const z = Math.sin(randomAngle) * randomR;
      const y = yNorm * height - height / 2;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const mix = Math.random();
      if (mix > 0.95) {
        tempColor.copy(colorRed);
        sizes[i] = Math.random() * 0.3 + 0.2;
      } else if (mix > 0.85) {
        tempColor.copy(colorGold);
        sizes[i] = Math.random() * 0.25 + 0.15;
      } else {
        tempColor.copy(colorGreen).lerp(new THREE.Color('#004422'), Math.random() * 0.5);
        sizes[i] = Math.random() * 0.15 + 0.05;
      }

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    return { positions, colors, sizes };
  }, []);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    if (context) {
      const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
      gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 32, 32);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  // Generate 3D Star Geometry safely
  const starGeometry = useMemo(() => {
    try {
        const shape = new THREE.Shape();
        const points = 5;
        const outerRadius = 0.8;
        const innerRadius = 0.38;

        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points + Math.PI / 2;
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        shape.closePath();

        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: 0.2,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelSegments: 1 // Reduced segments for stability
        });
        geometry.center();
        return geometry;
    } catch (e) {
        console.error("Star generation failed, fallback to sphere", e);
        return new THREE.SphereGeometry(0.8, 8, 8);
    }
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = time * 0.1;
    }
    if (starRef.current) {
        starRef.current.rotation.y = -time * 0.5; 
        starRef.current.rotation.z = Math.sin(time * 2) * 0.05;
    }
  });

  return (
    <group>
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={colors.length / 3}
                    array={colors}
                    itemSize={3}
                />
                <bufferAttribute 
                    attach="attributes-size" 
                    count={sizes.length}
                    array={sizes}
                    itemSize={1}
                />
            </bufferGeometry>
            <pointsMaterial
                map={texture}
                vertexColors
                size={0.25}
                sizeAttenuation={true}
                transparent
                alphaTest={0.01}
                opacity={0.8}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
        
        <mesh 
            ref={starRef} 
            position={[0, height / 2 + 0.6, 0]} 
            geometry={starGeometry}
        >
            <meshBasicMaterial color="#ffdd00" toneMapped={false} />
        </mesh>
        
        <pointLight position={[0, height / 2, 0]} intensity={2} color="#ffdd00" distance={10} decay={2} />
    </group>
  );
};

export default ParticleTree;