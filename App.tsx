import React, { useState, Suspense, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Info } from 'lucide-react';
import ParticleTree from './components/ParticleTree';
import Snow from './components/Snow';
import MagicParticles from './components/MagicParticles';
import GestureController from './components/GestureController';

const App: React.FC = () => {
  const [showInfo, setShowInfo] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);

  const handleGestureMotion = useCallback((x: number, y: number, intensity: number) => {
      // Dispatch event to be caught by 3D scene components
      const event = new CustomEvent('gesture-input', { detail: { x, y, intensity } });
      window.dispatchEvent(event);
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#050510] text-white font-sans overflow-hidden">
      
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas gl={{ antialias: false }}>
          <PerspectiveCamera makeDefault position={[0, 2, 25]} fov={50} />
          
          <ambientLight intensity={0.2} />
          <color attach="background" args={['#050510']} />
          <fog attach="fog" args={['#050510', 10, 50]} />

          <Suspense fallback={null}>
            <ParticleTree />
            <Snow />
            <MagicParticles />
          </Suspense>

          <EffectComposer enableNormalPass={false}>
            <Bloom 
                luminanceThreshold={0.2} 
                mipmapBlur 
                intensity={1.5} 
                radius={0.6}
            />
          </EffectComposer>

          <OrbitControls 
            enablePan={false}
            enableZoom={true}
            minDistance={10}
            maxDistance={40}
            autoRotate
            autoRotateSpeed={0.8}
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 3}
          />
        </Canvas>
      </div>

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-between p-6">
        
        {/* Header */}
        <header className="text-center pointer-events-auto mt-4 animate-fade-in-down">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-green-300 via-yellow-200 to-red-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] font-serif">
            Lumina
          </h1>
          <p className="text-blue-200/60 text-sm md:text-base mt-2 tracking-widest uppercase">
            3D 沉浸式圣诞树体验
          </p>
        </header>

        {/* Empty Center Area (Filler) */}
        <div className="flex-1" />

        {/* Footer Controls */}
        <footer className="w-full max-w-md pointer-events-auto mb-8 flex flex-col gap-4 items-center">
            
           <div className="flex gap-4 text-white/40 text-xs">
                <button onClick={() => setShowInfo(!showInfo)} className="hover:text-white transition-colors flex items-center gap-1">
                    <Info className="w-3 h-3" /> 操作指南
                </button>
           </div>
           
           {showInfo && (
               <div className="absolute bottom-20 bg-black/80 backdrop-blur text-white/80 p-4 rounded-lg text-sm border border-white/10 w-full">
                   <p className="mb-1">🖱️ <strong>拖拽/滑动:</strong> 旋转视角 & 产生星轨</p>
                   <p className="mb-1">👆 <strong>点击任意处:</strong> 释放烟花粒子</p>
                   <p className="mb-1">👋 <strong>手势:</strong> 开启摄像头，挥手产生魔法效果</p>
                   <p className="mb-1">✨ <strong>提示:</strong> 粒子会被圣诞树吸引并点亮它</p>
               </div>
           )}

        </footer>
      </div>

      {/* Gesture Controller (Overlay) */}
      <GestureController 
        enabled={cameraEnabled} 
        onToggle={() => setCameraEnabled(!cameraEnabled)}
        onMotion={handleGestureMotion}
      />
    </div>
  );
};

export default App;