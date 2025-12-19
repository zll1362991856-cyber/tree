import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ParticleTree: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const starRef = useRef<THREE.Mesh>(null);
  
  // Tree Parameters
  const count = 8000; // Increased particle count for density
  const height = 14;
  const baseRadius = 5.5;

  // Generate particle positions and colors
  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const colorDeepGreen = new THREE.Color('#002211');
    const colorBrightGreen = new THREE.Color('#00ff88');
    const colorGold = new THREE.Color('#ffcc00');
    const colorRed = new THREE.Color('#ff0055');
    const colorSnow = new THREE.Color('#ffffff');
    const tempColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      // 1. Height Distribution (0 to 1)
      // Power > 1 pushes more particles to the bottom for a stable base look
      const yNorm = Math.pow(Math.random(), 0.8); 
      const y = (yNorm * height) - (height / 2);

      // 2. Radius Calculation (Cone shape)
      // Radius decreases as we go up.
      // (1 - yNorm) creates the taper. 
      const coneRadiusAtHeight = baseRadius * (1 - yNorm);

      // 3. Volumetric Distribution
      // randomRadius determines how far from the trunk (center) the particle is.
      // Math.sqrt(Math.random()) gives uniform distribution in a circle.
      // Math.pow(..., 0.4) biases particles towards the edge/surface for better shape definition.
      const rDist = Math.pow(Math.random(), 0.4); 
      const r = coneRadiusAtHeight * rDist;

      // 4. Angle (Random 360 degrees) - No spiral logic
      const theta = Math.random() * Math.PI * 2;

      // 5. Add "Branch" Noise
      // Slight randomization to make it look like needles/branches rather than a perfect smooth cone
      const noise = 0.3;
      const x = r * Math.cos(theta) + (Math.random() - 0.5) * noise;
      const z = r * Math.sin(theta) + (Math.random() - 0.5) * noise;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // 6. Color Logic based on position
      const isOuter = rDist > 0.85; // Is this particle on the surface?
      const randomVal = Math.random();

      if (isOuter && randomVal > 0.92) {
        // Ornaments (Red/Gold) on the surface
        if (Math.random() > 0.5) {
             tempColor.copy(colorRed);
             sizes[i] = Math.random() * 0.3 + 0.2;
        } else {
             tempColor.copy(colorGold);
             sizes[i] = Math.random() * 0.25 + 0.15;
        }
      } else if (isOuter && randomVal > 0.85) {
        // Snow tips
        tempColor.copy(colorSnow);
        sizes[i] = Math.random() * 0.15 + 0.1;
      } else if (isOuter) {
        // Bright green needles on surface
        tempColor.copy(colorBrightGreen).lerp(colorDeepGreen, Math.random() * 0.3);
        sizes[i] = Math.random() * 0.15 + 0.05;
      } else {
        // Inner volume is dark to create depth
        tempColor.copy(colorDeepGreen);
        sizes[i] = Math.random() * 0.1 + 0.02;
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
      // Soft glow texture
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
            bevelSegments: 1 
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
      // Slow rotation for the whole tree
      pointsRef.current.rotation.y = time * 0.05;
      
      // Optional: Gentle sway if you want it more alive
      // pointsRef.current.rotation.z = Math.sin(time * 0.5) * 0.01; 
    }
    if (starRef.current) {
        starRef.current.rotation.y = -time * 0.5; 
        starRef.current.rotation.z = Math.sin(time * 2) * 0.05;
    }
  });

  return (
    <group position={[0, 1, 0]}> 
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
                size={0.2}
                sizeAttenuation={true}
                transparent
                alphaTest={0.01}
                opacity={0.9}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
        
        {/* Star Position adjusted to match new height logic */}
        <mesh 
            ref={starRef} 
            position={[0, height / 2 + 0.2, 0]} 
            geometry={starGeometry}
        >
            <meshBasicMaterial color="#ffdd00" toneMapped={false} />
        </mesh>
        
        <pointLight position={[0, height / 2, 0]} intensity={2} color="#ffdd00" distance={10} decay={2} />
    </group>
  );
};

export default ParticleTree;