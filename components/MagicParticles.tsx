import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  scale: number;
  isStuck: boolean;
}

const MagicParticles: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { viewport, camera, mouse } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Particle System Configuration
  const maxParticles = 800;
  const particles = useRef<ParticleData[]>([]);
  
  // Tree Dimensions for collision (Approximate cone)
  const treeHeight = 12;
  const treeBaseRadius = 5;
  const treeYBottom = -treeHeight / 2;

  // Initialize particle pool
  useMemo(() => {
    for (let i = 0; i < maxParticles; i++) {
      particles.current.push({
        position: new THREE.Vector3(0, -100, 0), // Hidden initially
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        life: 0,
        maxLife: 1,
        scale: 0,
        isStuck: false
      });
    }
  }, []);

  const spawnParticle = (pos: THREE.Vector3, type: 'trail' | 'firework') => {
    // Find first dead particle
    const p = particles.current.find(p => p.life <= 0);
    if (!p) return;

    p.position.copy(pos);
    p.isStuck = false;
    
    if (type === 'trail') {
      p.velocity.set(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1
      );
      p.life = 1.0;
      p.maxLife = 1.0 + Math.random() * 0.5;
      p.scale = Math.random() * 0.3 + 0.1;
      p.color.setHSL(0.1 + Math.random() * 0.1, 1, 0.8); // Gold/Yellow
    } else {
      // Firework burst
      p.velocity.set(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      );
      p.life = 1.0;
      p.maxLife = 1.5 + Math.random();
      p.scale = Math.random() * 0.4 + 0.2;
      // Random vibrant colors
      p.color.setHSL(Math.random(), 1, 0.6); 
    }
  };

  // Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const intersectPoint = new THREE.Vector3();

  // Gesture Event Listener
  useEffect(() => {
    const handleGesture = (e: CustomEvent) => {
        const { x, y, intensity } = e.detail;
        
        // Convert normalized gesture coords (-1 to 1) to 3D point
        // 1. Setup raycaster from camera
        const vector = new THREE.Vector3(x, y, 0.5);
        vector.unproject(camera);
        raycaster.set(camera.position, vector.sub(camera.position).normalize());
        
        // 2. Intersect with plane z=-10 (or similar plane near tree)
        plane.normal.copy(camera.position).normalize();
        plane.constant = -10;
        
        const target = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, target);
        
        if (target) {
            // Spawn multiple particles based on intensity
            const count = Math.min(Math.floor(intensity / 10), 5);
            for(let i=0; i<count; i++) {
                // Add some jitter to position
                const jitter = new THREE.Vector3(
                    target.x + (Math.random()-0.5)*2,
                    target.y + (Math.random()-0.5)*2,
                    target.z + (Math.random()-0.5)*2
                );
                spawnParticle(jitter, 'trail');
            }
        }
    };

    window.addEventListener('gesture-input', handleGesture as EventListener);
    return () => {
        window.removeEventListener('gesture-input', handleGesture as EventListener);
    };
  }, [camera, plane]); // Dependencies needed for raycaster

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // 1. Handle Input & Spawning (Mouse/Touch)
    raycaster.setFromCamera(mouse, camera);
    plane.normal.copy(camera.position).normalize();
    plane.constant = -10; 
    
    raycaster.ray.intersectPlane(plane, intersectPoint);
    
    if (intersectPoint && !state.pointer.x && !state.pointer.y) {
       // Mouse not initialized
    } else if (intersectPoint) {
       if (Math.random() > 0.5) {
         spawnParticle(intersectPoint, 'trail');
       }
    }

    // 2. Physics & Update Loop
    particles.current.forEach((p, i) => {
      if (p.life > 0) {
        
        if (!p.isStuck) {
          // Move
          p.position.add(p.velocity);
          
          // Gravity/Drag
          p.velocity.y -= 0.005; 
          p.velocity.multiplyScalar(0.98); 

          // Attraction to Tree (Magnetic effect)
          const distToCenter = Math.sqrt(p.position.x * p.position.x + p.position.z * p.position.z);
          
          if (distToCenter < 10 && p.position.y > treeYBottom && p.position.y < treeHeight / 2) {
             const attractionDir = new THREE.Vector3(0, p.position.y, 0).sub(p.position).normalize();
             p.velocity.add(attractionDir.multiplyScalar(0.01));
          }

          // Collision with Tree Cone
          const relY = p.position.y - treeYBottom;
          if (relY >= 0 && relY <= treeHeight) {
            const coneRadius = (1 - relY / treeHeight) * treeBaseRadius;
            
            if (distToCenter < coneRadius) {
              p.isStuck = true;
              p.velocity.set(0,0,0);
              p.color.setHSL(Math.random(), 1, 0.5);
              p.life = 2.0; 
            }
          }
        }

        // Age
        p.life -= delta * (p.isStuck ? 0.3 : 1.0);
        
        // Render Transform
        dummy.position.copy(p.position);
        
        const currentScale = p.scale * (p.life / p.maxLife);
        dummy.scale.set(currentScale, currentScale, currentScale);
        dummy.updateMatrix();
        
        meshRef.current!.setMatrixAt(i, dummy.matrix);
        meshRef.current!.setColorAt(i, p.color);
      } else {
        dummy.position.set(0, -1000, 0);
        dummy.scale.set(0,0,0);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      }
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    const point = e.point; 
    for(let k=0; k<20; k++) {
      spawnParticle(point, 'firework');
    }
  };

  return (
    <>
      <mesh visible={false} onPointerDown={handlePointerDown} scale={[20, 20, 20]}>
         <sphereGeometry />
         <meshBasicMaterial />
      </mesh>

      <instancedMesh ref={meshRef} args={[undefined, undefined, maxParticles]}>
        <dodecahedronGeometry args={[0.2, 0]} />
        <meshBasicMaterial toneMapped={false} transparent />
      </instancedMesh>
    </>
  );
};

export default MagicParticles;
