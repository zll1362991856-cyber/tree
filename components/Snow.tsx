import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Snow: React.FC = () => {
  const count = 1000;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 50;
      const y = (Math.random() - 0.5) * 50;
      const z = (Math.random() - 0.5) * 50;
      const speed = 0.02 + Math.random() * 0.05;
      temp.push({ x, y, z, speed, initialY: y });
    }
    return temp;
  }, []);

  useFrame(() => {
    if (!mesh.current) return;
    
    particles.forEach((particle, i) => {
      // Move snow down
      particle.y -= particle.speed;
      
      // Reset to top if below bottom
      if (particle.y < -25) {
        particle.y = 25;
      }

      dummy.position.set(particle.x, particle.y, particle.z);
      // Slight wobble
      dummy.rotation.x += 0.01;
      dummy.rotation.y += 0.01;
      dummy.updateMatrix();
      
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[0.08, 0]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
    </instancedMesh>
  );
};

export default Snow;