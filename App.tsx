import React, { useState, Suspense, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Sparkles, Wand2, Loader2, Info } from 'lucide-react';
import ParticleTree from './components/ParticleTree';
import Snow from './components/Snow';
import MagicParticles from './components/MagicParticles';
import GestureController from './components/GestureController';
import { generateHolidayWish } from './services/geminiService';
import { WishState } from './types';

const App: React.FC = () => {
  const [wishState, setWishState] = useState<WishState>({
    text: "",
    loading: false,
    error: null,
  });

  const [showInfo, setShowInfo] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);

  const handleGenerateWish = async () => {
    if (wishState.loading) return;

    setWishState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const text = await generateHolidayWish();
      setWishState({ text, loading: false, error: null });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "发生了一些小错误";
      setWishState({ text: "", loading: false, error: errorMessage });
    }
  };

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

        {/* Center Wish Area */}
        <div className={`transition-all duration-700 ease-in-out transform ${wishState.text ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} max-w-lg w-full text-center pointer-events-auto`}>
           {wishState.text && (
             <div className="bg-black/30 backdrop-blur-md border border-white/10 p-8 rounded-2xl shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-red-500/10 opacity-50 group-hover:opacity-100 transition-opacity" />
                <Sparkles className="w-6 h-6 text-yellow-300 absolute top-4 left-4 animate-pulse" />
                <Sparkles className="w-6 h-6 text-yellow-300 absolute bottom-4 right-4 animate-pulse delay-75" />
                <p className="font-serif text-xl md:text-2xl italic leading-relaxed text-white drop-shadow-md">
                  "{wishState.text}"
                </p>
             </div>
           )}
        </div>

        {/* Footer Controls */}
        <footer className="w-full max-w-md pointer-events-auto mb-8 flex flex-col gap-4 items-center">
            
           {wishState.error && (
               <div className="text-red-300 bg-red-900/50 px-4 py-2 rounded-lg text-sm border border-red-500/30">
                   {wishState.error}
               </div>
           )}

           <button
            onClick={handleGenerateWish}
            disabled={wishState.loading}
            className={`
                relative group flex items-center gap-3 px-8 py-4 rounded-full
                bg-white/10 backdrop-blur-md border border-white/20
                hover:bg-white/20 hover:scale-105 active:scale-95
                transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)]
                hover:shadow-[0_0_30px_rgba(0,255,136,0.3)]
                disabled:opacity-50 disabled:cursor-not-allowed
            `}
           >
             <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400/20 via-yellow-400/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity blur-md" />
             
             {wishState.loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-white" />
             ) : (
                <Wand2 className="w-6 h-6 text-yellow-300 group-hover:rotate-12 transition-transform" />
             )}
             
             <span className="font-semibold text-lg tracking-wide text-white">
                {wishState.loading ? '正在祈祷...' : '许下一个愿望'}
             </span>
           </button>

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
                   <p>🤖 <strong>按钮:</strong> AI 生成专属祝福</p>
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